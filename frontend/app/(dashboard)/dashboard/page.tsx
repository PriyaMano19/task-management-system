"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
interface ProjectSummary {
  id: string;
  companyName: string;
  projectName: string;
  status:
    | "PLANNING"
    | "ACTIVE"
    | "ON_HOLD"
    | "COMPLETED"
    | "CANCELLED";
  members: number;
  folders: number;
  tasks: number;
}

interface DashboardResponse {
  success: boolean;
  message: string;
  data: {
    summary: {
      projects: {
        total: number;
        planning: number;
        active: number;
        onHold: number;
        completed: number;
        cancelled: number;
      };
      tasks: {
        total: number;
        todo: number;
        inProgress: number;
        done: number;
      };
      members: number;
    };
    projects: ProjectSummary[];
  };
}



const statusConfig = {
  PLANNING: {
    label: "Planning",
    dot: "bg-blue-500",
    badge:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  ACTIVE: {
    label: "Active",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  ON_HOLD: {
    label: "On Hold",
    dot: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  COMPLETED: {
    label: "Completed",
    dot: "bg-violet-500",
    badge:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-500",
    badge:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

function Icon({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}

function ArrowIcon() {
  return (
    <Icon>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

function FolderIcon() {
  return (
    <Icon>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5h4l2 2H18.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5z" />
    </Icon>
  );
}

function UsersIcon() {
  return (
    <Icon>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Icon>
  );
}

function TaskIcon() {
  return (
    <Icon>
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="m8 12 2.5 2.5L16 9" />
    </Icon>
  );
}

function ChartIcon() {
  return (
    <Icon>
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="m7 15 3-4 3 2 4-6" />
    </Icon>
  );
}

function RefreshIcon() {
  return (
    <Icon>
      <path d="M20 11a8.1 8.1 0 0 0-14.7-4L3 10" />
      <path d="M3 5v5h5" />
      <path d="M4 13a8.1 8.1 0 0 0 14.7 4L21 14" />
      <path d="M21 19v-5h-5" />
    </Icon>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-36 rounded-2xl bg-muted" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl bg-muted"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 rounded-2xl bg-muted" />
        <div className="h-80 rounded-2xl bg-muted" />
      </div>

      <div className="h-96 rounded-2xl bg-muted" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<DashboardResponse["data"] | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [refreshing, setRefreshing] =
    useState(false);

const fetchDashboard = useCallback(
  async (showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const response =
        await api.get<DashboardResponse>(
          "/dashboard"
        );

      const result = response.data;

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to load dashboard."
        );
      }

      setDashboard(result.data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  },
  []
);

  useEffect(() => {
    fetchDashboard();

    // Automatically refresh every 10 seconds.
    const interval = setInterval(() => {
      fetchDashboard();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const completionPercentage = useMemo(() => {
    if (!dashboard) return 0;

    const total = dashboard.summary.tasks.total;
    const done = dashboard.summary.tasks.done;

    if (total === 0) return 0;

    return Math.round((done / total) * 100);
  }, [dashboard]);

  const activeProjectPercentage = useMemo(() => {
    if (!dashboard) return 0;

    const total =
      dashboard.summary.projects.total;

    if (total === 0) return 0;

    return Math.round(
      (dashboard.summary.projects.active / total) *
        100
    );
  }, [dashboard]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !dashboard) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <Icon>
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <circle cx="12" cy="12" r="9" />
            </Icon>
          </div>

          <h2 className="mt-4 text-lg font-semibold text-card-foreground">
            Unable to load dashboard
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "Something went wrong while loading  dashboard."}
          </p>

          <button
            onClick={() => fetchDashboard(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
          >
            <RefreshIcon />
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { summary, projects } = dashboard;

  return (
    <div className="space-y-6 pb-8">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h1>

    
        </div>

        <div className="flex items-center gap-3">

          <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Live
          </div>

          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-medium text-card-foreground shadow-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            >
              <RefreshIcon />
            </span>

            Refresh
          </button>
        </div>
      </div>


      {/* =====================================================
          KPI CARDS
      ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Projects */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Projects
              </p>

              <h3 className="mt-2 text-3xl font-bold text-card-foreground">
                {summary.projects.total}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FolderIcon />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {summary.projects.active} active
            </span>

            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              {activeProjectPercentage}%
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-blue-500 transition-all"
              style={{
                width: `${activeProjectPercentage}%`,
              }}
            />
          </div>
        </div>


        {/* Tasks */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Tasks
              </p>

              <h3 className="mt-2 text-3xl font-bold text-card-foreground">
                {summary.tasks.total}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <TaskIcon />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {summary.tasks.inProgress} in progress
            </span>

            <span className="font-medium text-violet-600 dark:text-violet-400">
              {summary.tasks.done} done
            </span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-violet-500 transition-all"
              style={{
                width: `${completionPercentage}%`,
              }}
            />
          </div>
        </div>


        {/* Members */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Team Members
              </p>

              <h3 className="mt-2 text-3xl font-bold text-card-foreground">
                {summary.members}
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UsersIcon />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            Across  the projects
          </p>
        </div>


        {/* Completion */}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md">

          <div className="flex items-start justify-between">

            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </p>

              <h3 className="mt-2 text-3xl font-bold text-card-foreground">
                {completionPercentage}%
              </h3>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ChartIcon />
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            {summary.tasks.done} of{" "}
            {summary.tasks.total} tasks completed
          </p>
        </div>
      </div>


      {/* =====================================================
          ANALYTICS
      ====================================================== */}

      <div className="grid gap-6 xl:grid-cols-2">

        {/* Task Overview */}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="font-semibold text-card-foreground">
                Task Overview
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Current task distribution
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <TaskIcon />
            </div>
          </div>

          <div className="mt-7 space-y-5">

            {/* TODO */}

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  To Do
                </span>

                <span className="font-medium text-card-foreground">
                  {summary.tasks.todo}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-slate-400 transition-all"
                  style={{
                    width:
                      summary.tasks.total > 0
                        ? `${(summary.tasks.todo / summary.tasks.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>


            {/* IN PROGRESS */}

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  In Progress
                </span>

                <span className="font-medium text-card-foreground">
                  {summary.tasks.inProgress}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{
                    width:
                      summary.tasks.total > 0
                        ? `${(summary.tasks.inProgress / summary.tasks.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>


            {/* DONE */}

            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Completed
                </span>

                <span className="font-medium text-card-foreground">
                  {summary.tasks.done}
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{
                    width:
                      summary.tasks.total > 0
                        ? `${(summary.tasks.done / summary.tasks.total) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>

          </div>
        </div>


        {/* Project Status */}

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="font-semibold text-card-foreground">
                Project Status
              </h3>

              <p className="mt-1 text-xs text-muted-foreground">
                Current project distribution
              </p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FolderIcon />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">

            {[
              {
                label: "Active",
                value: summary.projects.active,
                status: "ACTIVE" as const,
              },
              {
                label: "Planning",
                value: summary.projects.planning,
                status: "PLANNING" as const,
              },
              {
                label: "On Hold",
                value: summary.projects.onHold,
                status: "ON_HOLD" as const,
              },
              {
                label: "Completed",
                value: summary.projects.completed,
                status: "COMPLETED" as const,
              },
            ].map((item) => {

              const config =
                statusConfig[item.status];

              return (
                <div
                  key={item.status}
                  className="rounded-xl border border-border bg-muted/30 p-4"
                >
                  <div className="flex items-center gap-2">

                    <span
                      className={`h-2.5 w-2.5 rounded-full ${config.dot}`}
                    />

                    <span className="text-sm text-muted-foreground">
                      {item.label}
                    </span>
                  </div>

                  <p className="mt-3 text-2xl font-bold text-card-foreground">
                    {item.value}
                  </p>
                </div>
              );
            })}
          </div>

        </div>
      </div>


      {/* =====================================================
          PROJECTS
      ====================================================== */}

      <div className="rounded-2xl border border-border bg-card shadow-sm">

        <div className="flex flex-col gap-3 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h3 className="font-semibold text-card-foreground">
               Projects
            </h3>

            <p className="mt-1 text-xs text-muted-foreground">
              Projects the team currently working on
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/projects")
            }
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </button>
        </div>


        {projects.length === 0 ? (

          <div className="p-12 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FolderIcon />
            </div>

            <h4 className="mt-4 font-semibold text-card-foreground">
              No projects yet
            </h4>

            <p className="mt-1 text-sm text-muted-foreground">
              Create or join a project to get started.
            </p>

          </div>

        ) : (

          <div className="divide-y divide-border">

            {projects.map((project) => {

              const config =
                statusConfig[project.status];

              const completion =
                project.tasks > 0
                  ? Math.round(
                      (
                        // The global endpoint currently
                        // only returns total tasks per project.
                        // This is therefore represented
                        // as project workload.
                        project.tasks /
                        Math.max(
                          summary.tasks.total,
                          1
                        )
                      ) * 100
                    )
                  : 0;

              return (
                <button
                  key={project.id}
                  onClick={() =>
                    router.push(
                      `/projects/${project.id}`
                    )
                  }
                  className="group flex w-full flex-col gap-5 p-6 text-left transition hover:bg-muted/30 lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* Project information */}

                  <div className="flex min-w-0 items-start gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <FolderIcon />
                    </div>

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <h4 className="truncate font-semibold text-card-foreground">
                          {project.projectName}
                        </h4>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${config.badge}`}
                        >
                          {config.label}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-muted-foreground">
                        {project.companyName}
                      </p>

                    </div>
                  </div>


                  {/* Project metrics */}

                  <div className="flex flex-wrap items-center gap-6 lg:justify-end">

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Tasks
                      </p>

                      <p className="mt-1 font-semibold text-card-foreground">
                        {project.tasks}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Members
                      </p>

                      <p className="mt-1 font-semibold text-card-foreground">
                        {project.members}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Folders
                      </p>

                      <p className="mt-1 font-semibold text-card-foreground">
                        {project.folders}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition group-hover:border-primary group-hover:text-primary">
                      <ArrowIcon />
                    </div>

                  </div>

                </button>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}