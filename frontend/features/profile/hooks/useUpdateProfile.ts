import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as profileService from "../services/profile.service";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileService.updateProfile,

    onSuccess: () => {
      toast.success("Profile updated successfully.");

      queryClient.invalidateQueries({
        queryKey: ["profile"],
      });

      queryClient.invalidateQueries({
        queryKey: ["me"],
      });
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ??
          "Failed to update profile."
      );
    },
  });
}