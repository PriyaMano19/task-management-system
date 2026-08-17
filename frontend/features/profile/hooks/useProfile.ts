import { useQuery } from "@tanstack/react-query";
import * as profileService from "../services/profile.service";

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
  });
}