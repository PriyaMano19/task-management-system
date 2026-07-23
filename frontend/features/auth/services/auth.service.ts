import { authApi } from "../api/auth.api";
import { LoginRequest } from "../types/auth.types";

class AuthService {
  async login(data: LoginRequest) {
    return await authApi.login(data);
  }

  async logout(refreshToken: string) {
    return await authApi.logout(refreshToken);
  }

  async refreshToken(refreshToken: string) {
    return await authApi.refreshToken(refreshToken);
  }

  async getCurrentUser() {
    return await authApi.getCurrentUser();
  }

  async resetPassword(
    newPassword: string,
    confirmPassword: string
  ) {
    return await authApi.resetPassword(
      newPassword,
      confirmPassword
    );
  }
}

export const authService = new AuthService();