"use client";

import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  CircleUser,
  KeyRound,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { logout } from "@/features/auth/store/auth.thunks";

export default function ProfileDropdown() {
  const dispatch = useAppDispatch();
  const router = useRouter();

  const user = useAppSelector(
    (state) => state.auth.user
  );

  const initials = `${user?.firstName?.[0] ?? ""}${
    user?.lastName?.[0] ?? ""
  }`;

  const handleLogout = async () => {
    const result = await dispatch(logout());

    if (logout.fulfilled.match(result)) {
      toast.success("Logged out successfully.");

      
      router.replace("/login");
    } else {
      toast.error(
        result.payload as string ||
        "Logout failed."
      );
    }
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="
            flex
            items-center
            gap-3
            rounded-xl
            border
            border-border
            bg-card
            px-3
            py-2
            shadow-sm
            transition-all
            duration-200
            hover:bg-muted
            hover:shadow-md
          "
        >
          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-full
              bg-gradient-to-br
              from-[#0A2E63]
              to-[#11468F]
              font-semibold
              text-white
              shadow
            "
          >
            {initials}
          </div>

          <div className="hidden text-left lg:block">
            <p className="text-sm font-semibold text-foreground">
              {user?.firstName} {user?.lastName}
            </p>

            <p className="text-xs text-muted-foreground">
              {user?.role}
            </p>
          </div>

          <ChevronDown
            size={18}
            className="text-muted-foreground"
          />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content
        sideOffset={10}
        align="end"
        className="
          z-50
          w-72
          rounded-2xl
          border
          border-border
          bg-card
          p-2
          shadow-2xl
        "
      >

        <DropdownMenu.Separator
          className="my-2 h-px bg-border"
        />

        {/* My Profile */}

        <DropdownMenu.Item asChild>
          <Link
            href="/profile?tab=profile"
            className="
              flex
              cursor-pointer
              items-center
              gap-3
              rounded-xl
              px-3
              py-3
              outline-none
              transition
              hover:bg-muted
            "
          >
            <CircleUser size={18} />

            <span>
              My Profile
            </span>
          </Link>
        </DropdownMenu.Item>

        {/* Change Password */}

        <DropdownMenu.Item asChild>
          <Link
            href="/profile?tab=security"
            className="
              flex
              cursor-pointer
              items-center
              gap-3
              rounded-xl
              px-3
              py-3
              outline-none
              transition
              hover:bg-muted
            "
          >
            <KeyRound size={18} />

            <span>
              Change Password
            </span>
          </Link>
        </DropdownMenu.Item>

        <DropdownMenu.Separator
          className="my-2 h-px bg-border"
        />

        {/* Logout */}

        <DropdownMenu.Item
          onSelect={(event) => {
            event.preventDefault();
            handleLogout();
          }}
          className="
            flex
            cursor-pointer
            items-center
            gap-3
            rounded-xl
            px-3
            py-3
            text-red-600
            outline-none
            transition
            hover:bg-red-50
            dark:hover:bg-red-950
          "
        >
          <LogOut size={18} />

          <span>
            Sign Out
          </span>
        </DropdownMenu.Item>

      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}