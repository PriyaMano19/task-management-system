"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderKanban,
  House,
  LayoutDashboard,
  ListTodo,
  Settings,
  Shield,
  Users,
} from "lucide-react";

const menus = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: House,
  },
  {
  name: "My Overview",
  href: "/my-work",
  icon: LayoutDashboard,
},
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
  },
  // {
  //   name: "Tasks",
  //   href: "/tasks",
  //   icon: ListTodo,
  // },
  {
    name: "Users",
    href: "/users",
    icon: Users,
  },
  {
    name: "Roles & Permissions",
    href: "/roles",
    icon: Shield,
  },
  // {
  //   name: "Settings",
  //   href: "/settings",
  //   icon: Settings,
  // },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex items-center justify-center border-b border-border px-6 py-0">
        <Image
          src="/images/side-logo.png"
          alt="iPhonik Logo"
          width={150}
          height={30}
          priority
          className="h-auto w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {menus.map((menu) => {
          const Icon = menu.icon;

          const active =
            pathname === menu.href ||
            pathname.startsWith(menu.href + "/");

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[#0A2E63] text-white shadow-md"
                  : "text-sidebar-foreground hover:bg-muted hover:text-[#0A2E63] dark:hover:bg-slate-800 dark:hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute left-0 h-8 w-1 rounded-r-full bg-white" />
              )}

              <Icon size={20} className="transition-colors" />

              <span>{menu.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}