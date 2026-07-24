"use client";

import { Bell } from "lucide-react";
import Breadcrumb from "./Breadcrumb";
import ThemeToggle from "./ThemeToggle";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-8">
      <Breadcrumb />

      <div className="flex items-center gap-3">
        <button className="relative rounded-xl p-2 transition hover:bg-muted">
          <Bell size={20} />

          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500"></span>
        </button>

        <ThemeToggle />

        <ProfileDropdown />
      </div>
    </header>
  );
}