import * as profileApi from "../api/profile.api";
import { ProfileFormData } from "../schemas/profile.schema";
import { PasswordFormData } from "../schemas/password.schema";

export const getProfile = async () => {
  return await profileApi.getProfile();
};

export const updateProfile = async (
  data: ProfileFormData
) => {
  return await profileApi.updateProfile(data);
};

export const changePassword = async (
  data: PasswordFormData
) => {
  return await profileApi.changePassword(data);
};