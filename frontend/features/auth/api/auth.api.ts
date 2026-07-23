import { api } from "@/services/api";
import {
  LoginRequest,
  LoginResponse,
} from "../types/auth.types";

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>("/auth/login", data);
    return response.data;
  },

  logout: async (refreshToken: string) => {
    const response = await api.post("/auth/logout", {
      refreshToken,
    });

    return response.data;
  },

  refreshToken: async (refreshToken: string) => {
    const response = await api.post("/auth/refresh", {
      refreshToken,
    });

    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  resetPassword: async (
    newPassword: string,
    confirmPassword: string
  ) => {
    const response = await api.put("/auth/reset-password", {
      newPassword,
      confirmPassword,
    });

    return response.data;
  },
};