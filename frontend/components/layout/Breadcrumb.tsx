"use client";

import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import { usePathname } from "next/navigation";

const routeNames: Record<string, string> = {
  dashboard: "Dashboard",
  users: "Users",
  roles: "Roles",
  projects: "Projects",
  tasks: "Tasks",
  settings: "Settings",
  create: "Create",
  edit: "Edit",
};

export default function Breadcrumb() {
  const pathname = usePathname();

  const segments = pathname
    .split("/")
    .filter(Boolean);

  return (
    <div className="flex items-center gap-2 text-sm">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-muted-foreground hover:text-primary"
      >
        <House size={15} />
        Home
      </Link>

      {segments.map((segment, index) => {
        const href =
          "/" + segments.slice(0, index + 1).join("/");

        return (
          <div
            key={href}
            className="flex items-center gap-2"
          >
            <ChevronRight
              size={15}
              className="text-muted-foreground"
            />

            <Link
              href={href}
              className={`capitalize ${
                index === segments.length - 1
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {routeNames[segment] ??
                segment.replaceAll("-", " ")}
            </Link>
          </div>
        );
      })}
    </div>
  );
}