"use client";

import { useEffect } from "react";
import { Mail, ShieldCheck, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { useProfile } from "../hooks/useProfile";
import {
  profileSchema,
  ProfileFormData,
} from "../schemas/profile.schema";

import { useAppDispatch } from "@/hooks/redux";
import { setUser } from "@/store/slices/auth.slice";

export default function ProfileForm() {
  const { data: user, isLoading } = useProfile();
  const updateProfileMutation = useUpdateProfile();
  const dispatch = useAppDispatch();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response =
        await updateProfileMutation.mutateAsync(data);

      dispatch(setUser(response.data));

      reset(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-10 shadow-lg">
        Loading...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:shadow-xl">
      <div className="mb-10">
        <h2 className="text-2xl font-bold">
          Personal Information
        </h2>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-8"
      >
        {/* First Name */}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            First Name
          </label>

          <div className="flex h-12 items-center rounded-xl border border-border bg-background px-4 transition-all duration-200 focus-within:border-[#0A2E63] focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            <User className="mr-3 h-5 w-5 text-muted-foreground" />

            <input
              {...register("firstName")}
              className="w-full bg-transparent text-foreground outline-none"
            />
          </div>

          {errors.firstName && (
            <p className="mt-2 text-sm text-red-500">
              {errors.firstName.message}
            </p>
          )}
        </div>

        {/* Last Name */}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Last Name
          </label>

          <div className="flex h-12 items-center rounded-xl border border-border bg-background px-4 transition-all duration-200 focus-within:border-[#0A2E63] focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            <User className="mr-3 h-5 w-5 text-muted-foreground" />

            <input
              {...register("lastName")}
              className="w-full bg-transparent text-foreground outline-none"
            />
          </div>

          {errors.lastName && (
            <p className="mt-2 text-sm text-red-500">
              {errors.lastName.message}
            </p>
          )}
        </div>

        {/* Email */}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Email Address
          </label>

          <div className="flex h-12 items-center rounded-xl border border-border bg-background px-4 transition-all duration-200 focus-within:border-[#0A2E63] focus-within:ring-4 focus-within:ring-blue-100 dark:focus-within:ring-blue-900/30">
            <Mail className="mr-3 h-5 w-5 text-muted-foreground" />

            <input
              {...register("email")}
              className="w-full bg-transparent text-foreground outline-none"
            />
          </div>

          {errors.email && (
            <p className="mt-2 text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Role */}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Role
          </label>

          <div className="flex h-12 items-center rounded-xl border border-border bg-muted/40 px-4">
            <ShieldCheck className="mr-3 h-5 w-5 text-muted-foreground" />

            <input
              value={user?.role ?? ""}
              readOnly
              className="w-full cursor-not-allowed bg-transparent text-muted-foreground outline-none"
            />
          </div>
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
              !isDirty || updateProfileMutation.isPending
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
            {updateProfileMutation.isPending
              ? "Saving..."
              : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}