import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import * as profileService from "../services/profile.service";

export function useChangePassword() {
  return useMutation({
    mutationFn: profileService.changePassword,

    onSuccess: () => {
      toast.success("Password updated successfully.");
    },

    onError: (error: any) => {
      toast.error(
        error.response?.data?.message ??
          "Failed to update password."
      );
    },
  });
}