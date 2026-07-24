import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import tokenService from "./token.service";
import { logoutUser } from "./auth.service";
interface RetryRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}
interface RefreshResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
  };
}
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});



api.interceptors.request.use(
  (config) => {
    const token = tokenService.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);



let isRefreshing = false;

let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

const processQueue = (
  error: unknown,
  token: string | null = null
) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });

  failedQueue = [];
};



api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as RetryRequestConfig;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Ignore non-401 errors
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Prevent infinite refresh loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // If refresh is already in progress, wait for it
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({
          resolve: (token: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }

            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        throw new Error("Refresh token not found.");
      }

     const response = await api.post<RefreshResponse>(
  "/auth/refresh",
  {
    refreshToken,
  }
);

      const newAccessToken = response.data.data.accessToken;

      // Save new access token
      tokenService.setAccessToken(newAccessToken);

      // Update axios default header
      api.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${newAccessToken}`;

      // Update current request header
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      // Retry queued requests
      processQueue(null, newAccessToken);

      // Retry original request
      return api(originalRequest);
  } catch (refreshError) {
  processQueue(refreshError);

  delete api.defaults.headers.common["Authorization"];

  logoutUser();

  return Promise.reject(refreshError);
} finally {
  isRefreshing = false;
}
  }
);

export default api;