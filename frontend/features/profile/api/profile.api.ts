import api from "@/services/api";
import { ProfileFormData } from "../schemas/profile.schema";
import { PasswordFormData } from "../schemas/password.schema";

export const getProfile = async () => {
  const response = await api.get("/auth/me");
  return response.data.data;
};

export const updateProfile = async (
  data: ProfileFormData
) => {
  const response = await api.put("/auth/profile", data);
  return response.data;
};

export const changePassword = async (
  data: PasswordFormData
) => {
  const response = await api.put(
    "/auth/reset-password",
    data
  );

  return response.data;
};