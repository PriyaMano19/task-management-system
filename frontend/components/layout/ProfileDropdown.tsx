"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CircleUser,
  KeyRound,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/features/auth/store/auth.thunks";

export default function ProfileDropdown() {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 transition hover:bg-muted">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A2E63] font-semibold text-white">
            {initials}
          </div>

          <div className="hidden text-left lg:block">
            <p className="text-sm font-semibold">
              {user?.firstName} {user?.lastName}
            </p>

            <p className="text-xs text-muted-foreground">
              {user?.role}
            </p>
          </div>

          <ChevronDown size={18} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        sideOffset={10}
        align="end"
        className="z-50 w-72 rounded-2xl border border-border bg-card p-2 shadow-xl"
      >
      

        <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 outline-none hover:bg-muted">
          <CircleUser size={18} />
          My Profile
        </DropdownMenu.Item>

        <DropdownMenu.Item className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 outline-none hover:bg-muted">
          <KeyRound size={18} />
          Change Password
        </DropdownMenu.Item>

        <DropdownMenu.Separator className="my-2 h-px bg-border" />

        <DropdownMenu.Item
          onClick={() => dispatch(logout())}
          className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-red-600 outline-none hover:bg-red-50 dark:hover:bg-red-950"
        >
          <LogOut size={18} />
          Sign Out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}