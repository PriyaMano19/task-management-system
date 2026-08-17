"use client";

import { Mail, CalendarDays, ShieldCheck } from "lucide-react";
import { useProfile } from "../hooks/useProfile";

export default function ProfileCard() {
  const { data: user, isLoading } =useProfile();

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-border bg-card p-8 shadow-lg">
        <div className="animate-pulse flex flex-col items-center space-y-5">
          <div className="h-28 w-28 rounded-full bg-muted" />
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-4 w-56 rounded bg-muted" />
          <div className="h-10 w-28 rounded-full bg-muted" />

          <div className="w-full border-t border-border pt-6 space-y-5">
            <div className="h-5 w-32 rounded bg-muted" />
            <div className="h-5 w-40 rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`;

  return (
    <div className="rounded-3xl border border-border bg-card p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex flex-col items-center">
        {/* Avatar */}

        <div
          className="
            flex
            h-28
            w-28
            items-center
            justify-center
            rounded-full
            bg-gradient-to-br
            from-[#0A2E63]
            via-[#11468F]
            to-[#0D5FD6]
            text-4xl
            font-bold
            text-white
            shadow-xl
            ring-4
            ring-background
          "
        >
          {initials}
        </div>

        {/* Name */}

        <h2 className="mt-6 text-2xl font-bold tracking-tight">
          {user?.firstName} {user?.lastName}
        </h2>

        {/* Email */}

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <Mail size={16} />
          <span>{user?.email}</span>
        </div>

        {/* Role */}

        <div
          className="
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-blue-200
            bg-blue-50
            px-4
            py-2
            text-sm
            font-semibold
            text-blue-700

            dark:border-blue-800
            dark:bg-blue-950/40
            dark:text-blue-300
          "
        >
          <ShieldCheck size={16} />
          {user?.role}
        </div>
      </div>

      <div className="my-8 border-t border-border" />

      <div className="space-y-6">
        {/* Status */}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account Status
          </p>

          <div className="mt-2 flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${
                user?.status === "ACTIVE"
                  ? "bg-green-500"
                  : "bg-red-500"
              }`}
            />

            <span
              className={`font-medium ${
                user?.status === "ACTIVE"
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {user?.status === "ACTIVE"
                ? "Active"
                : "Inactive"}
            </span>
          </div>
        </div>

        {/* Member Since */}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Member Since
          </p>

          <div className="mt-2 flex items-center gap-2">
            <CalendarDays
              size={18}
              className="text-muted-foreground"
            />

            <span className="font-medium">
              {user?.createdAt
                ? new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(new Date(user.createdAt))
                : "—"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}