"use client";

import { useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  passwordSchema,
  PasswordFormData,
} from "../schemas/password.schema";
import { useChangePassword } from "../hooks/useChangePassword";

export default function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (
    data: PasswordFormData
  ) => {
    try {
      await changePasswordMutation.mutateAsync(data);

      reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div
  id="change-password"
  className="rounded-3xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-xl"
>
      <div className="mb-10">
        <h2 className="text-2xl font-bold">
          Change Password
        </h2>

        <p className="mt-2 text-muted-foreground">
          Update your password to keep your account
          secure.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* New Password */}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            New Password
          </label>

          <div className="flex h-12 items-center rounded-xl border border-border bg-background px-4 transition-all duration-200 focus-within:border-[#0A2E63] focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            <Lock className="mr-3 h-5 w-5 text-muted-foreground" />

            <input
              type={
                showPassword ? "text" : "password"
              }
              {...register("newPassword")}
              className="w-full bg-transparent outline-none"
              placeholder="Enter new password"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="text-muted-foreground transition hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.newPassword && (
            <p className="mt-2 text-sm text-red-500">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Confirm Password
          </label>

          <div className="flex h-12 items-center rounded-xl border border-border bg-background px-4 transition-all duration-200 focus-within:border-[#0A2E63] focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            <Lock className="mr-3 h-5 w-5 text-muted-foreground" />

            <input
              type={
                showConfirmPassword
                  ? "text"
                  : "password"
              }
              {...register("confirmPassword")}
              className="w-full bg-transparent outline-none"
              placeholder="Confirm new password"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword
                )
              }
              className="text-muted-foreground transition hover:text-foreground"
            >
              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}
            </button>
          </div>

          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        {/* Buttons */}

        <div className="flex justify-end gap-4 border-t border-border pt-8">
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-xl border border-border bg-background px-6 py-2.5 font-medium transition hover:bg-muted"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              !isDirty ||
              changePasswordMutation.isPending
            }
            className="
              rounded-xl
              bg-gradient-to-r
              from-[#0A2E63]
              to-[#11468F]
              px-6
              py-2.5
              font-semibold
              text-white
              shadow-lg
              transition-all
              duration-300
              hover:-translate-y-0.5
              hover:shadow-xl
              active:scale-95
              dark:from-blue-600
              dark:to-blue-500
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {changePasswordMutation.isPending
              ? "Updating..."
              : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}