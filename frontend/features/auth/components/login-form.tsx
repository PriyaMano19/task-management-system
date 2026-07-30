"use client";

import { useState } from "react";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  loginSchema,
  LoginFormData,
} from "@/features/auth/schemas/login.schema";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { login } from "@/features/auth/store/auth.thunks";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { loading, error } = useAppSelector(
    (state) => state.auth
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

 const onSubmit = async (data: LoginFormData) => {
  const result = await dispatch(login(data));

  if (login.fulfilled.match(result)) {
    toast.success("Login successful.");

    router.push("/dashboard");
  } else {
    toast.error(result.payload as string);
  }
};

  return (
    <div
      className="
        w-full
        max-w-lg
        rounded-[32px]
        border
        border-white/20
        bg-white/90
        backdrop-blur-xl
        p-12
        shadow-[0_30px_80px_rgba(0,0,0,0.35)]
      "
    >
      {/* Logo */}
      <div className="flex justify-center">
        <img
          src="/images/logo.png"
          alt="iPhonik"
          className="h-32 object-contain drop-shadow-xl"
        />
      </div>

      {/* Header */}
      <div className="mt-8 text-center">
        <div className="mt-6 flex justify-center">
          <span className="relative text-l font-bold uppercase  text-[#0A2E63]">
            IPHONIK TASK MANAGEMENT
            <span className="absolute -bottom-3 left-1/2 h-[3px] w-14 -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0A2E63] to-[#E53935]" />
          </span>
        </div>

        <p className="mx-auto mt-5 max-w-md text-base leading-7 text-slate-500">
          Sign in to continue managing your projects, tasks,
          teams and productivity—all from one secure workspace.
        </p>
      </div>

      {/* Form */}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-12 space-y-7"
      >
        {/* Email */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#071D49]">
            Email Address
          </label>

          <div
            className="
              flex
              h-14
              items-center
              rounded-xl
              border
              border-slate-300
              bg-white
              px-5
              shadow-md
              transition-all
              duration-300
              focus-within:border-[#0A2E63]
              focus-within:ring-4
              focus-within:ring-blue-100
            "
          >
            <Mail className="mr-3 h-5 w-5 text-[#0A2E63]" />

            <input
              type="email"
              placeholder="Enter your email"
              {...register("email")}
              className="w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {errors.email && (
            <p className="mt-2 text-sm text-red-500">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-[#071D49]">
            Password
          </label>

          <div
            className="
              flex
              h-14
              items-center
              rounded-xl
              border
              border-slate-300
              bg-white
              px-5
              shadow-md
              transition-all
              duration-300
              focus-within:border-[#0A2E63]
              focus-within:ring-4
              focus-within:ring-blue-100
            "
          >
            <Lock className="mr-3 h-5 w-5 text-[#0A2E63]" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              {...register("password")}
              className="w-full bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(!showPassword)
              }
              className="text-slate-400 transition hover:text-[#E53935]"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="mt-2 text-sm text-red-500">
              {errors.password.message}
            </p>
          )}
        </div>

      
        {/* Submit Button */}

        <button
          type="submit"
          disabled={loading}
          className="
            h-14
            w-full
            rounded-xl
            bg-gradient-to-r
            from-[#071D49]
            via-[#0A2E63]
            to-[#11468F]
            ring-2
            ring-[#0A2E63]/10
            text-lg
            font-semibold
            text-white
            shadow-lg
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:shadow-2xl
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-70
          "
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}