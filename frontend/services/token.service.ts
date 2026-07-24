class TokenService {
  getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  }

setAccessToken(token: string | null) {
    if (token) {
        localStorage.setItem("accessToken", token);
    } else {
        localStorage.removeItem("accessToken");
    }
}

 setRefreshToken(token: string | null) {
    if (token) {
        localStorage.setItem("refreshToken", token);
    } else {
        localStorage.removeItem("refreshToken");
    }
}

  clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  }
}

const tokenService = new TokenService();

export default tokenService;