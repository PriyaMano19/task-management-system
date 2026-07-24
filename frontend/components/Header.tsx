"use client";

import { useAppSelector } from "@/hooks/redux";

export default function Header() {
  const user = useAppSelector((state) => state.auth.user);

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <h1 className="text-xl font-semibold">
        Dashboard
      </h1>

      <div className="text-right">
        <p className="font-medium">
          {user?.firstName} {user?.lastName}
        </p>

        <p className="text-sm text-gray-500">
          {user?.role}
        </p>
      </div>
    </header>
  );
}