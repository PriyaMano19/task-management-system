import { createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "../services/auth.service";
import { LoginRequest } from "../types/auth.types";
import tokenService from "@/services/token.service";

export const login = createAsyncThunk(
  "auth/login",
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await authService.login(data);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Login failed"
      );
    }
  }
);



export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const refreshToken = tokenService.getRefreshToken();

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      return true;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Logout failed"
      );
    }
  }
);



export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken =
        tokenService.getAccessToken();

      const refreshToken =
        tokenService.getRefreshToken();

     
      if (!accessToken && !refreshToken) {
        return rejectWithValue(
          "No active session"
        );
      }

     
      const response =
        await authService.getCurrentUser();

      return response.data;

    } catch (error: any) {

      return rejectWithValue(
        error.response?.data?.message ??
        "Failed to initialize authentication"
      );
    }
  }
);