"use client";

import { useSearchParams } from "next/navigation";

import ProfileCard from "@/features/profile/components/ProfileCard";
import ProfileForm from "@/features/profile/components/ProfileForm";
import ChangePasswordForm from "@/features/profile/components/ChangePasswordForm";

export default function ProfilePage() {
  const searchParams = useSearchParams();

  const tab = searchParams.get("tab") ?? "profile";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Left */}

      <div>
        <ProfileCard />
      </div>

      {/* Right */}

      <div className="space-y-6 lg:col-span-2">
        {/* Tabs */}

        <div className="flex rounded-2xl border border-border bg-card p-1 shadow-sm">
          <a
            href="/profile?tab=profile"
            className={`flex-1 rounded-xl px-5 py-3 text-center font-medium transition ${
              tab === "profile"
                ? "bg-[#0A2E63] text-white"
                : "hover:bg-muted"
            }`}
          >
            Profile
          </a>

          <a
            href="/profile?tab=security"
            className={`flex-1 rounded-xl px-5 py-3 text-center font-medium transition ${
              tab === "security"
                ? "bg-[#0A2E63] text-white"
                : "hover:bg-muted"
            }`}
          >
            Security
          </a>
        </div>

        {tab === "profile" && <ProfileForm />}

        {tab === "security" && <ChangePasswordForm />}
      </div>
    </div>
  );
}