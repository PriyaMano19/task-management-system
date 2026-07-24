"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/hooks/redux";
import { initializeAuth } from "@/features/auth/store/auth.thunks";
import { clearAuth } from "@/store/slices/auth.slice";
import { registerLogoutHandler } from "@/services/auth.service";

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    registerLogoutHandler(() => {
      dispatch(clearAuth());
    });

    const token = localStorage.getItem("accessToken");
    if (token) {
     
      dispatch(initializeAuth());
    }
  }, [dispatch]);

  return null;
}