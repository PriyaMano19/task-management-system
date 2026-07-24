"use client";

import Link from "next/link";

const menus = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "Projects", href: "/projects" },
  { name: "Tasks", href: "/tasks" },
  { name: "Users", href: "/users" },
  { name: "Roles", href: "/roles" },
  { name: "Settings", href: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r bg-white">
      <div className="border-b p-6">
        <h2 className="text-xl font-bold text-[#0A2E63]">
          iPhonik
        </h2>
      </div>

      <nav className="space-y-2 p-4">
        {menus.map((menu) => (
          <Link
            key={menu.href}
            href={menu.href}
            className="block rounded-lg px-4 py-3 transition hover:bg-blue-50 hover:text-[#0A2E63]"
          >
            {menu.name}
          </Link>
        ))}
      </nav>
    </aside>
  );
}