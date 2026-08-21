"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  ListTodo,
  Loader2,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

import api from "@/services/api";


type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";

type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "HOLD"
  | "DONE";

type TaskPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT";

interface DashboardTask {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;

  folder: {
    id: string;
    name: string;

    project: {
      id: string;
      companyName: string;
      projectName: string;
    };
  };

  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface UpcomingTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;

  folder: {
    name: string;

    project: {
      id: string;
      projectName: string;
      companyName: string;
    };
  };
}

interface DashboardProject {
  id: string;
  companyName: string;
  projectName: string;
  status: ProjectStatus;
  members: number;
  folders: number;
  tasks: number;
}

interface PersonalDashboard {
  summary: {
    projects: number;
    tasks: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionPercentage: number;
  };

  taskProgress: {
    todo: number;
    inProgress: number;
    hold: number;
    done: number;
  };

  tasks: DashboardTask[];

  upcomingDeadlines: UpcomingTask[];

  projects: DashboardProject[];
}


const projectStatusConfig = {
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


function LoadingSkeleton() {
  return (
    <div className="space-y-6 pb-8 animate-pulse">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <div className="h-4 w-28 rounded-lg bg-muted" />
          <div className="h-8 w-64 rounded-lg bg-muted" />
          <div className="h-4 w-96 max-w-full rounded-lg bg-muted" />
        </div>

        <div className="h-12 w-12 rounded-2xl bg-muted" />
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-32 rounded-2xl bg-muted"
          />
        ))}
      </div>

      {/* Progress / deadlines */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-80 rounded-2xl bg-muted" />
        <div className="h-80 rounded-2xl bg-muted lg:col-span-2" />
      </div>

      {/* Projects */}
      <div className="h-80 rounded-2xl bg-muted" />
    </div>
  );
}


export default function MyWorkPage() {
  const router = useRouter();

  const [dashboard, setDashboard] =
    useState<PersonalDashboard | null>(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);


  const fetchDashboard = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        const response =
          await api.get("/dashboard/me");

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Failed to load your dashboard."
          );
        }

        setDashboard(response.data.data);
        setError(null);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to load your dashboard.";

        setError(message);

        if (showRefreshing) {
          toast.error(message);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );


useEffect(() => {
  fetchDashboard();

  const interval = setInterval(() => {
    fetchDashboard();
  }, 5000);

  return () => {
    clearInterval(interval);
  };
}, [fetchDashboard]);

  const completionPercentage = useMemo(() => {
    if (!dashboard) return 0;

    return Math.min(
      Math.max(
        dashboard.summary.completionPercentage,
        0
      ),
      100
    );
  }, [dashboard]);


  if (loading) {
    return <LoadingSkeleton />;
  }


  if (error || !dashboard) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-border
          bg-card
          p-8
          text-center
          shadow-sm
        ">

          <div className="
            mx-auto
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            bg-red-500/10
            text-red-500
          ">
            <AlertCircle className="h-6 w-6" />
          </div>

          <h2 className="
            mt-4
            text-lg
            font-semibold
            text-card-foreground
          ">
            Unable to load your workspace
          </h2>

          <p className="
            mt-2
            text-sm
            text-muted-foreground
          ">
            {error ||
              "Something went wrong while loading your dashboard."}
          </p>

          <button
            onClick={() => fetchDashboard(true)}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-primary
              px-4
              py-2.5
              text-sm
              font-medium
              text-primary-foreground
              transition
              hover:opacity-90
            "
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>

        </div>
      </div>
    );
  }

  const {
    summary,
    taskProgress,
    upcomingDeadlines,
    projects,
  } = dashboard;


  return (
    <div className="space-y-6 pb-8">

   
      <div className="
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <div>

          <p className="
            text-sm
            font-medium
            text-primary
          ">
            My Workspace
          </p>

          <h1 className="
            mt-1
            text-2xl
            font-bold
            tracking-tight
            text-foreground
            sm:text-3xl
          ">
            Your Work Overview
          </h1>

          <p className="
            mt-2
            text-sm
            text-muted-foreground
          ">
            Track your projects, tasks, progress and
            upcoming deadlines in one place.
          </p>

        </div>

        <div className="
          flex
          items-center
          gap-3
        ">

          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-border
              bg-card
              px-3.5
              py-2.5
              text-sm
              font-medium
              text-card-foreground
              shadow-sm
              transition
              hover:bg-muted
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            Refresh
          </button>

          <div className="
            hidden
            h-11
            w-11
            items-center
            justify-center
            rounded-xl
            bg-primary/10
            text-primary
            sm:flex
          ">
            <ListTodo className="h-5 w-5" />
          </div>

        </div>

      </div>

  
      <div className="
        grid
        gap-4
        sm:grid-cols-2
        xl:grid-cols-5
      ">

        <SummaryCard
          title="My Projects"
          value={summary.projects}
          icon={FolderKanban}
          description="Projects you're part of"
          iconStyle="blue"
        />

        <SummaryCard
          title="Assigned Tasks"
          value={summary.tasks}
          icon={ListTodo}
          description="Tasks assigned to you"
          iconStyle="violet"
        />

        <SummaryCard
          title="In Progress"
          value={summary.inProgress}
          icon={PlayCircle}
          description="Currently working on"
          iconStyle="blue"
        />

        <SummaryCard
          title="Completed"
          value={summary.completed}
          icon={CheckCircle2}
          description="Successfully completed"
          iconStyle="emerald"
        />

        <SummaryCard
          title="Overdue"
          value={summary.overdue}
          icon={AlertCircle}
          description="Need your attention"
          iconStyle="red"
          danger={summary.overdue > 0}
        />

      </div>

  
      <div className="grid gap-6 lg:grid-cols-3">

  
        <div className="
          rounded-2xl
          border
          border-border
          bg-card
          p-6
          shadow-sm
          lg:col-span-1
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div>
              <h3 className="
                font-semibold
                text-card-foreground
              ">
                Task Progress
              </h3>

              <p className="
                mt-1
                text-xs
                text-muted-foreground
              ">
                Your current task distribution
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-muted
              text-muted-foreground
            ">
              <CheckCircle2 className="h-5 w-5" />
            </div>

          </div>

          {/* Completion */}

          <div className="
            mt-7
            flex
            items-center
            gap-6
          ">

            <CompletionCircle
              percentage={completionPercentage}
            />

            <div className="
              flex-1
              space-y-4
            ">

              <ProgressRow
                label="To Do"
                value={taskProgress.todo}
                icon={Circle}
                color="slate"
              />

              <ProgressRow
                label="In Progress"
                value={taskProgress.inProgress}
                icon={PlayCircle}
                color="blue"
              />

              <ProgressRow
                label="On Hold"
                value={taskProgress.hold}
                icon={PauseCircle}
                color="amber"
              />

              <ProgressRow
                label="Done"
                value={taskProgress.done}
                icon={CheckCircle2}
                color="emerald"
              />

            </div>

          </div>

        </div>

 
        <div className="
          rounded-2xl
          border
          border-border
          bg-card
          p-6
          shadow-sm
          lg:col-span-2
        ">

          <div className="
            flex
            items-center
            justify-between
          ">

            <div>
              <h3 className="
                font-semibold
                text-card-foreground
              ">
                Upcoming Deadlines
              </h3>

              <p className="
                mt-1
                text-xs
                text-muted-foreground
              ">
                Tasks that need your attention
              </p>
            </div>

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-muted
              text-muted-foreground
            ">
              <CalendarDays className="h-5 w-5" />
            </div>

          </div>

          <div className="
            mt-5
            space-y-3
          ">

            {upcomingDeadlines.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No upcoming deadlines"
                description="You're all caught up."
              />
            ) : (
              upcomingDeadlines.map((task) => (
                <DeadlineItem
                  key={task.id}
                  task={task}
                />
              ))
            )}

          </div>

        </div>

      </div>

   
      <div className="
        rounded-2xl
        border
        border-border
        bg-card
        shadow-sm
      ">

        <div className="
          flex
          flex-col
          gap-3
          border-b
          border-border
          p-6
          sm:flex-row
          sm:items-center
          sm:justify-between
        ">

          <div>
            <h3 className="
              font-semibold
              text-card-foreground
            ">
              My Projects
            </h3>

            <p className="
              mt-1
              text-xs
              text-muted-foreground
            ">
              Projects you're currently working on
            </p>
          </div>

          <button
            onClick={() => router.push("/projects")}
            className="
              text-sm
              font-medium
              text-primary
              hover:underline
            "
          >
            View all
          </button>

        </div>

        {projects.length === 0 ? (

          <div className="p-12 text-center">

            <div className="
              mx-auto
              flex
              h-12
              w-12
              items-center
              justify-center
              rounded-xl
              bg-muted
              text-muted-foreground
            ">
              <FolderKanban className="h-5 w-5" />
            </div>

            <h4 className="
              mt-4
              font-semibold
              text-card-foreground
            ">
              No projects yet
            </h4>

            <p className="
              mt-1
              text-sm
              text-muted-foreground
            ">
              You haven't been added to any projects.
            </p>

          </div>

        ) : (

          <div className="
            divide-y
            divide-border
          ">

            {projects.map((project) => (
              <ProjectRow
                key={project.id}
                project={project}
                onClick={() =>
                  router.push(
                    `/projects/${project.id}`
                  )
                }
              />
            ))}

          </div>

        )}

      </div>

    </div>
  );
}


function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconStyle,
  danger = false,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconStyle:
    | "blue"
    | "violet"
    | "emerald"
    | "red";
  danger?: boolean;
}) {
  const iconClasses = {
    blue:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",

    violet:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",

    emerald:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",

    red:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <div className="
      rounded-2xl
      border
      border-border
      bg-card
      p-5
      shadow-sm
      transition
      hover:shadow-md
    ">

      <div className="
        flex
        items-start
        justify-between
      ">

        <div>

          <p className="
            text-sm
            font-medium
            text-muted-foreground
          ">
            {title}
          </p>

          <h3
            className={`
              mt-2
              text-3xl
              font-bold
              ${
                danger
                  ? "text-red-500"
                  : "text-card-foreground"
              }
            `}
          >
            {value}
          </h3>

        </div>

        <div className={`
          flex
          h-11
          w-11
          items-center
          justify-center
          rounded-xl
          ${iconClasses[iconStyle]}
        `}>
          <Icon className="h-5 w-5" />
        </div>

      </div>

      <p className="
        mt-4
        text-xs
        text-muted-foreground
      ">
        {description}
      </p>

    </div>
  );
}


function CompletionCircle({
  percentage,
}: {
  percentage: number;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  const offset =
    circumference -
    (percentage / 100) * circumference;

  return (
    <div className="
      relative
      h-32
      w-32
      shrink-0
    ">

      <svg
        className="
          h-full
          w-full
          -rotate-90
        "
        viewBox="0 0 100 100"
      >

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          className="text-muted"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          className="text-primary transition-all duration-500"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />

      </svg>

      <div className="
        absolute
        inset-0
        flex
        flex-col
        items-center
        justify-center
      ">

        <span className="
          text-2xl
          font-bold
          text-card-foreground
        ">
          {percentage}%
        </span>

        <span className="
          text-[10px]
          text-muted-foreground
        ">
          completed
        </span>

      </div>

    </div>
  );
}


function ProgressRow({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "slate" | "blue" | "amber" | "emerald";
}) {
  const colorClasses = {
    slate:
      "text-slate-500 dark:text-slate-400",

    blue:
      "text-blue-500 dark:text-blue-400",

    amber:
      "text-amber-500 dark:text-amber-400",

    emerald:
      "text-emerald-500 dark:text-emerald-400",
  };

  return (
    <div className="
      flex
      items-center
      justify-between
    ">

      <div className="
        flex
        items-center
        gap-2
      ">

        <Icon
          className={`h-4 w-4 ${colorClasses[color]}`}
        />

        <span className="
          text-sm
          text-muted-foreground
        ">
          {label}
        </span>

      </div>

      <span className="
        text-sm
        font-semibold
        text-card-foreground
      ">
        {value}
      </span>

    </div>
  );
}

function DeadlineItem({
  task,
}: {
  task: UpcomingTask;
}) {
  const date = new Date(task.dueDate);

  const formattedDate =
    date.toLocaleDateString("en-LK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="
      flex
      items-center
      gap-4
      rounded-xl
      border
      border-border
      bg-muted/20
      p-4
      transition
      hover:bg-muted/40
    ">

      <div className="
        flex
        h-10
        w-10
        shrink-0
        items-center
        justify-center
        rounded-xl
        bg-primary/10
        text-primary
      ">
        <CalendarDays className="h-5 w-5" />
      </div>

      <div className="
        min-w-0
        flex-1
      ">

        <p className="
          truncate
          text-sm
          font-semibold
          text-card-foreground
        ">
          {task.title}
        </p>

        <p className="
          mt-1
          truncate
          text-xs
          text-muted-foreground
        ">
          {task.folder.project.projectName}
          {" · "}
          {task.folder.name}
        </p>

      </div>

      <div className="text-right">

        <p className="
          text-sm
          font-semibold
          text-card-foreground
        ">
          {formattedDate}
        </p>

        <div className="mt-1">
          <PriorityBadge
            priority={task.priority}
          />
        </div>

      </div>

    </div>
  );
}


function ProjectRow({
  project,
  onClick,
}: {
  project: DashboardProject;
  onClick: () => void;
}) {
  const config =
    projectStatusConfig[project.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        flex
        w-full
        flex-col
        gap-5
        p-6
        text-left
        transition
        hover:bg-muted/30
        lg:flex-row
        lg:items-center
        lg:justify-between
      "
    >

      {/* Project information */}

      <div className="
        flex
        min-w-0
        items-start
        gap-4
      ">

        <div className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-primary/10
          text-primary
        ">
          <FolderKanban className="h-5 w-5" />
        </div>

        <div className="min-w-0">

          <div className="
            flex
            flex-wrap
            items-center
            gap-2
          ">

            <h4 className="
              truncate
              font-semibold
              text-card-foreground
            ">
              {project.projectName}
            </h4>

            <span className={`
              rounded-full
              px-2.5
              py-1
              text-[11px]
              font-medium
              ${config.badge}
            `}>
              {config.label}
            </span>

          </div>

          <p className="
            mt-1
            truncate
            text-sm
            text-muted-foreground
          ">
            {project.companyName}
          </p>

        </div>

      </div>

      {/* Project metrics */}

      <div className="
        flex
        flex-wrap
        items-center
        gap-6
        lg:justify-end
      ">

        <ProjectMetric
          icon={ListTodo}
          label="Tasks"
          value={project.tasks}
        />

        <ProjectMetric
          icon={Users}
          label="Members"
          value={project.members}
        />

        <ProjectMetric
          icon={FolderKanban}
          label="Folders"
          value={project.folders}
        />

        <div className="
          flex
          h-9
          w-9
          items-center
          justify-center
          rounded-lg
          border
          border-border
          text-muted-foreground
          transition
          group-hover:border-primary
          group-hover:text-primary
        ">
          <ArrowUpRight className="h-4 w-4" />
        </div>

      </div>

    </button>
  );
}


function ProjectMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="
      flex
      items-center
      gap-2
    ">

      <Icon className="
        h-4
        w-4
        text-muted-foreground
      " />

      <div>

        <p className="
          text-xs
          text-muted-foreground
        ">
          {label}
        </p>

        <p className="
          mt-1
          font-semibold
          text-card-foreground
        ">
          {value}
        </p>

      </div>

    </div>
  );
}


function PriorityBadge({
  priority,
}: {
  priority: TaskPriority;
}) {
  const config = {
    LOW:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400",

    MEDIUM:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",

    HIGH:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400",

    URGENT:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  };

  return (
    <span className={`
      rounded-full
      px-2.5
      py-1
      text-[10px]
      font-semibold
      ${config[priority]}
    `}>
      {priority}
    </span>
  );
}


function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="
      flex
      flex-col
      items-center
      justify-center
      rounded-xl
      border
      border-dashed
      border-border
      bg-muted/20
      px-6
      py-10
      text-center
    ">

      <div className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-xl
        bg-muted
        text-muted-foreground
      ">
        <Icon className="h-5 w-5" />
      </div>

      <h4 className="
        mt-4
        text-sm
        font-semibold
        text-card-foreground
      ">
        {title}
      </h4>

      <p className="
        mt-1
        text-xs
        text-muted-foreground
      ">
        {description}
      </p>

    </div>
  );
}