"use client";

import Link from "next/link";
import {
  ChevronRight,
  House,
} from "lucide-react";
import {
  usePathname,
} from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import api from "@/services/api";

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

  const [projectName, setProjectName] =
    useState<string | null>(null);

  const segments = pathname
    .split("/")
    .filter(Boolean);


  const projectsIndex =
    segments.indexOf("projects");

  const projectId =
    projectsIndex !== -1 &&
    segments[projectsIndex + 1]
      ? segments[projectsIndex + 1]
      : null;


  useEffect(() => {
    if (!projectId) {
      setProjectName(null);
      return;
    }

    const loadProjectName =
      async () => {
        try {
          const response =
            await api.get(
              `/projects/${projectId}/dashboard`
            );

          const name =
            response.data?.data?.project
              ?.projectName;

          if (name) {
            setProjectName(name);
          }
        } catch (error) {
          console.error(
            "Failed to load project name:",
            error
          );

          setProjectName(null);
        }
      };

    loadProjectName();
  }, [projectId]);


  return (
    <div className="flex items-center gap-2 text-sm">

      {/* HOME */}

      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-muted-foreground hover:text-primary"
      >
        <House size={15} />
        Home
      </Link>

      {segments.map(
        (segment, index) => {

          const href =
            "/" +
            segments
              .slice(
                0,
                index + 1
              )
              .join("/");

          const isLast =
            index ===
            segments.length - 1;


          const isProjectId =
            projectsIndex !== -1 &&
            index ===
              projectsIndex + 1;

          let label =
            routeNames[segment] ??
            segment.replaceAll(
              "-",
              " "
            );

          if (isProjectId) {
            label = 
              projectName ??
              "Project";
          }

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
                className={`
                  capitalize
                  ${
                    isLast
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground hover:text-primary"
                  }
                `}
              >
                {label}
              </Link>

            </div>
          );
        }
      )}

    </div>
  );
}