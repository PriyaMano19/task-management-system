"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";

import CreateTaskModal from "@/components/tasks/CreateTaskModal";
import { useParams } from "next/navigation";
import TaskDetailsModal from "@/components/tasks/TaskDetailsModal";
import FolderModal from "@/components/project-folders/FolderModal";
import {
  Folder,
  FolderPlus,
  Plus,
  Users,
  CheckCircle2,
  CirclePause,
  Clock3,
  Circle,
  AlertCircle,
  CalendarDays,
  User,
  Paperclip,
  MessageCircle,
  MoreHorizontal,
} from "lucide-react";

import api from "@/services/api";
import { authApi } from "@/features/auth/api/auth.api";


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


interface ProjectDashboardResponse {
  success: boolean;
  message?: string;

  data: {
    project: {
      id: string;
      companyName: string;
      projectName: string;
      description?: string | null;
      status: ProjectStatus;
      startDate?: string | null;
      endDate?: string | null;
    };

    statistics: {
      members: number;
      folders: number;

      tasks: {
        total: number;
        todo: number;
        inProgress: number;
        done: number;
      };
    };
  };
}


interface ProjectFolder {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;

  createdAt?: string;
  updatedAt?: string;

  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface FolderResponse {
  success: boolean;
  message?: string;
  data?: ProjectFolder[];
}


interface Task {
  id: string;

  folderId: string;

  title: string;

  description?: string | null;

  status: TaskStatus;

  priority: TaskPriority;

  assignedToId?: string | null;

  createdById: string;

  dueDate?: string | null;

  createdAt?: string;
  updatedAt?: string;

  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;

createdBy?: {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
} | null;

  _count?: {
    attachments?: number;
    comments?: number;
  };
}
interface ProjectMember {
  id: string;
  userId: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    status?: string;
  };

  role?: {
    id: string;
    name: string;
  };
}
interface TaskResponse {
  success: boolean;
  message?: string;

  data?: Task[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}


const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    dot: string;
    badge: string;
  }
> = {
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


  const getApiErrorMessage = (
    error: unknown,
    fallback: string
  ) => {
    const apiError = error as {
      response?: {
        data?: {
          message?: string;
        };
      };
      message?: string;
    };

    return (
      apiError?.response?.data?.message ||
      apiError?.message ||
      fallback
    );
  };

const priorityConfig: Record<
  TaskPriority,
  {
    label: string;
    className: string;
  }
> = {
  LOW: {
    label: "Low",
    className:
      "bg-slate-500/10 text-slate-600 dark:text-slate-400",
  },

  MEDIUM: {
    label: "Medium",
    className:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },

  HIGH: {
    label: "High",
    className:
      "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },

  URGENT: {
    label: "Urgent",
    className:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};


export default function ProjectWorkspacePage() {
 const params = useParams();
const [selectedMemberId, setSelectedMemberId] =
  useState<string | null>(null);

const [projectMembers, setProjectMembers] =
  useState<ProjectMember[]>([]);
const [currentUserId, setCurrentUserId] = useState<string | null>(null);
const [loadingMembers, setLoadingMembers] =
  useState(false);
const projectId = String(params.projectId);

  const [project, setProject] =
    useState<
      ProjectDashboardResponse["data"]["project"] | null
    >(null);

  const [statistics, setStatistics] =
    useState<
      ProjectDashboardResponse["data"]["statistics"] | null
    >(null);

  const [folders, setFolders] =
    useState<ProjectFolder[]>([]);

  const [selectedFolderId, setSelectedFolderId] =
    useState<string | null>(null);

  const [tasks, setTasks] =
    useState<Task[]>([]);

  const [loadingProject, setLoadingProject] =
    useState(true);

  const [loadingFolders, setLoadingFolders] =
    useState(true);

  const [loadingTasks, setLoadingTasks] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [popupMessage, setPopupMessage] =
    useState<string | null>(null);

  const [draggedTaskId, setDraggedTaskId] =
    useState<string | null>(null);

  const [dragOverStatus, setDragOverStatus] =
    useState<TaskStatus | null>(null);

  const [updatingTaskId, setUpdatingTaskId] =
    useState<string | null>(null);

  const [selectedTask, setSelectedTask] =
    useState<Task | null>(null);

  const [taskModalOpen, setTaskModalOpen] =
    useState(false);

const [createTaskModalOpen, setCreateTaskModalOpen] =
  useState(false);

const [createTaskFolderId, setCreateTaskFolderId] =
  useState<string | null>(null);

  const [folderModalOpen, setFolderModalOpen] =
  useState(false);

const [folderModalMode, setFolderModalMode] =
  useState<"create" | "edit">("create");

const [editingFolderId, setEditingFolderId] =
  useState<string | null>(null);

const [editingFolderName, setEditingFolderName] =
  useState("");

  const [deleteFolderOpen, setDeleteFolderOpen] =
  useState(false);

const [deletingFolderId, setDeletingFolderId] =
  useState<string | null>(null);

const [deletingFolderName, setDeletingFolderName] =
  useState("");
const [openFolderMenuId, setOpenFolderMenuId] =
  useState<string | null>(null);

  const [membersModalOpen, setMembersModalOpen] =
  useState(false);

  const openDeleteFolder = (
  folderId: string,
  folderName: string
) => {
  setDeletingFolderId(folderId);
  setDeletingFolderName(folderName);
  setDeleteFolderOpen(true);
};

useEffect(() => {
  const loadCurrentUser = async () => {
    try {
      const response = await authApi.getCurrentUser();

      if (response?.success && response?.data?.id) {
        setCurrentUserId(response.data.id);
      }
    } catch (error) {
      console.error("Failed to load current user:", error);
    }
  };

  loadCurrentUser();
}, []);
  const fetchProjectDashboard =
    useCallback(async () => {
      try {
        setLoadingProject(true);

        const response =
          await api.get<ProjectDashboardResponse>(
            `/projects/${projectId}/dashboard`
          );

        const result = response.data;

        if (!result.success) {
          throw new Error(
            result.message ||
              "Failed to load project."
          );
        }

        setProject(
          result.data.project
        );

        setStatistics(
          result.data.statistics
        );
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Failed to load project."
          )
        );
      } finally {
        setLoadingProject(false);
      }
    }, [projectId]);

const openTaskDetails = (task: Task) => {
  setSelectedTask(task);
  setTaskModalOpen(true);
};

const closeTaskDetails = () => {
  setTaskModalOpen(false);
  setSelectedTask(null);
};
const openCreateFolder = () => {
  setFolderModalMode("create");
  setEditingFolderId(null);
  setEditingFolderName("");
  setFolderModalOpen(true);
};
const openEditFolder = (
  folderId: string,
  folderName: string
) => {
  setFolderModalMode("edit");
  setEditingFolderId(folderId);
  setEditingFolderName(folderName);
  setFolderModalOpen(true);
};
const fetchFolders = useCallback(async () => {
  try {
    setLoadingFolders(true);

    const response = await api.get<FolderResponse>(
      `/projects/${projectId}/folders`
    );

    const result = response.data;

    if (!result.success) {
      throw new Error(
        result.message ||
          "Failed to load folders."
      );
    }

    const fetchedFolders =
      result.data ?? [];

    setFolders(fetchedFolders);

    // Automatically select the first folder
    // when nothing is currently selected.
    if (fetchedFolders.length > 0) {
      setSelectedFolderId((current) => {
        const currentStillExists =
          current &&
          fetchedFolders.some(
            (folder) =>
              folder.id === current
          );

        return currentStillExists
          ? current
          : fetchedFolders[0].id;
      });
    } else {
      setSelectedFolderId(null);
      setTasks([]);
    }

    return fetchedFolders;
  } catch (err) {
    console.error(
      "Failed to load folders:",
      err
    );

    setError(
      getApiErrorMessage(
        err,
        "Failed to load folders."
      )
    );

    return [];
  } finally {
    setLoadingFolders(false);
  }
}, [projectId]);

const handleDeleteFolder = async () => {
  if (!deletingFolderId) {
    return;
  }

  try {
    await api.delete(
      `/projects/${projectId}/folders/${deletingFolderId}`
    );

    const deletedId =
      deletingFolderId;

    setDeleteFolderOpen(false);
    setDeletingFolderId(null);
    setDeletingFolderName("");

    const updatedFolders =
      await fetchFolders();

    await fetchProjectDashboard();

    if (selectedFolderId === deletedId) {
      if (updatedFolders.length > 0) {
        setSelectedFolderId(
          updatedFolders[0].id
        );
      } else {
        setSelectedFolderId(null);
        setTasks([]);
      }
    }

  } catch (error: any) {
    console.error(
      "Failed to delete folder:",
      error
    );

    setPopupMessage(
      getApiErrorMessage(
        error,
        "Failed to delete folder."
      )
    );
  }
};
const fetchProjectMembers = useCallback(
  async () => {
    try {
      setLoadingMembers(true);

      const response =
        await api.get(
          `/projects/${projectId}/members`
        );

      const result = response.data;

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to load project members."
        );
      }

      setProjectMembers(
        result.data || []
      );
    } catch (err) {
      console.error(
        "Failed to load project members:",
        err
      );
    } finally {
      setLoadingMembers(false);
    }
  },
  [projectId]
);
useEffect(() => {
  fetchProjectMembers();
}, [fetchProjectMembers]);

 const fetchTasks =
  useCallback(async () => {
    if (!selectedFolderId) {
      setTasks([]);
      return;
    }

    try {
      setLoadingTasks(true);

      const params = new URLSearchParams();

      params.set("limit", "100");

      if (selectedMemberId) {
        params.set(
          "assignedToId",
          selectedMemberId
        );
      }

      const response =
        await api.get<TaskResponse>(
          `/projects/${projectId}/folders/${selectedFolderId}/tasks?${params.toString()}`
        );

      const result = response.data;

      if (!result.success) {
        throw new Error(
          result.message ||
            "Failed to load tasks."
        );
      }

      setTasks(
        result.data || []
      );

    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to load tasks."
        )
      );
    } finally {
      setLoadingTasks(false);
    }
  }, [
    projectId,
    selectedFolderId,
    selectedMemberId,
  ]);
  useEffect(() => {
    fetchProjectDashboard();
  }, [
    fetchProjectDashboard,
  ]);

  useEffect(() => {
    fetchFolders();
  }, [
    fetchFolders,
  ]);

  useEffect(() => {
    fetchTasks();
  }, [
    fetchTasks,
  ]);


  const todoTasks =
    useMemo(
      () =>
        tasks.filter(
          (task) =>
            task.status === "TODO"
        ),
      [tasks]
    );

  const inProgressTasks =
    useMemo(
      () =>
        tasks.filter(
          (task) =>
            task.status ===
            "IN_PROGRESS"
        ),
      [tasks]
    );

  const holdTasks =
    useMemo(
      () =>
        tasks.filter(
          (task) =>
            task.status === "HOLD"
        ),
      [tasks]
    );

  const doneTasks =
    useMemo(
      () =>
        tasks.filter(
          (task) =>
            task.status === "DONE"
        ),
      [tasks]
    );


  const formatDate = (
    date?: string | null
  ) => {
    if (!date) {
      return null;
    }

    return new Date(
      date
    ).toLocaleDateString(
      "en-LK",
      {
        day: "2-digit",
        month: "short",
      }
    );
  };


  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    taskId: string
  ) => {
    setDraggedTaskId(taskId);

    event.dataTransfer.setData(
      "taskId",
      taskId
    );

    event.dataTransfer.effectAllowed =
      "move";
  };


  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverStatus(null);
  };


  const handleDragOver = (
    event: DragEvent<HTMLDivElement>,
    status: TaskStatus
  ) => {
    event.preventDefault();

    event.dataTransfer.dropEffect =
      "move";

    setDragOverStatus(status);
  };


  const handleDragLeave = (
    event: DragEvent<HTMLDivElement>
  ) => {
    const currentTarget =
      event.currentTarget;

    const relatedTarget =
      event.relatedTarget as Node | null;

    if (
      relatedTarget &&
      currentTarget.contains(
        relatedTarget
      )
    ) {
      return;
    }

    setDragOverStatus(null);
  };


  const handleTaskDrop = async (
    event: DragEvent<HTMLDivElement>,
    newStatus: TaskStatus
  ) => {
    event.preventDefault();

    const taskId =
      event.dataTransfer.getData(
        "taskId"
      ) || draggedTaskId;

    setDragOverStatus(null);
    setDraggedTaskId(null);

    if (!taskId) {
      return;
    }

    const task =
      tasks.find(
        (item) =>
          item.id === taskId
      );

    if (!task) {
      return;
    }

    // Already in this column
    if (
      task.status === newStatus
    ) {
      return;
    }

    const previousStatus =
      task.status;



    setTasks(
      (currentTasks) =>
        currentTasks.map(
          (item) =>
            item.id === taskId
              ? {
                  ...item,
                  status: newStatus,
                }
              : item
        )
    );

    setUpdatingTaskId(taskId);

    try {
      await api.put(
        `/projects/${projectId}/folders/${selectedFolderId}/tasks/${taskId}`,
        {
          status: newStatus,
        }
      );

      // Refresh statistics too
      await fetchProjectDashboard();
    } catch (err) {
      console.error(
        "Failed to update task status:",
        err
      );


      setTasks(
        (currentTasks) =>
          currentTasks.map(
            (item) =>
              item.id === taskId
                ? {
                    ...item,
                    status:
                      previousStatus,
                  }
                : item
          )
      );

      setPopupMessage(
        getApiErrorMessage(
          err,
          "Failed to update task status."
        )
      );
    } finally {
      setUpdatingTaskId(null);
    }
  };


 if (loadingProject) {
  return (
    <div className="flex min-h-[500px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />

        <p className="text-sm text-muted-foreground">
          Loading project...
        </p>
      </div>
    </div>
  );
}



  if (error && !project) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">

          <AlertCircle className="mx-auto h-8 w-8 text-red-500" />

          <h2 className="mt-4 text-lg font-semibold text-card-foreground">
            Unable to load project
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>

          <button
            onClick={async () => {
              setError(null);

              await Promise.all([
                fetchProjectDashboard(),
                fetchFolders(),
              ]);
            }}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try Again
          </button>

        </div>
      </div>
    );
  }

  if (!project) {
    return null;
  }

  const status =
    statusConfig[
      project.status
    ];


  const renderTaskColumn = (
    title: string,
    columnTasks: Task[],
    icon: ReactNode,
    columnStatus: TaskStatus
  ) => {
    const isDragOver =
      dragOverStatus ===
      columnStatus;

    return (
      <div
        onDragOver={(event) =>
          handleDragOver(
            event,
            columnStatus
          )
        }
        onDragLeave={
          handleDragLeave
        }
        onDrop={(event) =>
          handleTaskDrop(
            event,
            columnStatus
          )
        }
        className={`
          flex
          min-h-[500px]
          min-w-[280px]
          flex-1
          flex-col
          rounded-2xl
          p-3
          transition-all
          duration-200
          ${
            isDragOver
              ? "bg-primary/10 ring-2 ring-primary/30"
              : "bg-muted/40"
          }
        `}
      >

       
        <div className="mb-3 flex items-center justify-between px-2 py-1">

          <div className="flex items-center gap-2">

            {icon}

            <h3 className="text-sm font-semibold text-card-foreground">
              {title}
            </h3>

            <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {columnTasks.length}
            </span>

          </div>

          <button
            type="button"
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground"
            title={`Add task to ${title}`}
          >
            <Plus className="h-4 w-4" />
          </button>

        </div>

       
        {isDragOver && (
          <div className="mb-3 rounded-xl border-2 border-dashed border-primary/40 bg-primary/5 px-4 py-5 text-center">
            <p className="text-xs font-medium text-primary">
              Drop task here
            </p>
          </div>
        )}

       
        <div className="flex flex-1 flex-col gap-3">

          {columnTasks.map(
            (task) => {

              const priority =
                priorityConfig[
                  task.priority
                ];

              const isUpdating =
                updatingTaskId ===
                task.id;

              const isDragging =
                draggedTaskId ===
                task.id;

              return (
               <button
                    key={task.id}
                    type="button"
                   onClick={(event) => {
                      if (draggedTaskId) {
                        return;
                      }

                      openTaskDetails(task);
                    }}
                    draggable
                    onDragStart={(event) =>
                      handleDragStart(
                        event,
                        task.id
                      )
                    }
                    onDragEnd={handleDragEnd}
                    className="w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >

                  {/* TITLE */}

                  <div className="flex items-start justify-between gap-3">

                    <h4 className="line-clamp-2 text-sm font-semibold text-card-foreground">
                      {task.title}
                    </h4>

                    <MoreHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />

                  </div>

                  {/* DESCRIPTION */}

                  {task.description && (
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {task.description}
                    </p>
                  )}

                  {/* PRIORITY */}

                  <div className="mt-3">
                    <span
                      className={`
                        inline-flex
                        rounded-full
                        px-2
                        py-1
                        text-[11px]
                        font-medium
                        ${priority.className}
                      `}
                    >
                      {priority.label}
                    </span>
                  </div>

                  {/* BOTTOM */}

              

              <div className="mt-4 border-t border-border pt-3">

                <div className="flex items-center justify-between gap-3">

                  {/* PEOPLE */}

                  <div className="flex items-center gap-2">

                    {/* ASSIGNEE */}

                    {task.assignedTo ? (
                      <div
                        className="flex items-center gap-1.5"
                        title={`Assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName}`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                          {task.assignedTo.firstName
                            .charAt(0)}
                          {task.assignedTo.lastName
                            .charAt(0)}
                        </div>

                        <span className="max-w-[80px] truncate text-xs text-muted-foreground">
                          {task.assignedTo.firstName}
                        </span>
                      </div>
                    ) : (
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground"
                        title="Unassigned"
                      >
                        <User className="h-3.5 w-3.5" />
                      </div>
                    )}

                    {/* REPORTER */}

                    {task.createdBy && (
                      <div
                        className="flex items-center gap-1.5"
                        title={`Reported by ${task.createdBy.firstName} ${task.createdBy.lastName}`}
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                          {task.createdBy.firstName
                            .charAt(0)}
                          {task.createdBy.lastName
                            .charAt(0)}
                        </div>

                        <span className="max-w-[80px] truncate text-xs text-muted-foreground">
                          {task.createdBy.firstName}
                        </span>
                      </div>
                    )}

                    {/* ATTACHMENTS */}

                    {(task._count?.attachments ?? 0) >
                      0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Paperclip className="h-3.5 w-3.5" />

                        {task._count?.attachments}
                      </span>
                    )}

                    {/* COMMENTS */}

                    {(task._count?.comments ?? 0) >
                      0 && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="h-3.5 w-3.5" />

                        {task._count?.comments}
                      </span>
                    )}

                  </div>

                  {/* DUE DATE */}

                  {task.dueDate && (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />

                      {formatDate(task.dueDate)}
                    </span>
                  )}

                </div>

                {/* PEOPLE LABEL */}

                <div className="mt-1.5 flex items-center gap-4 text-[10px] text-muted-foreground/70">

                  {task.assignedTo && (
                    <span>
                      Assignee
                    </span>
                  )}

                  {task.createdBy && (
                    <span>
                      Reporter
                    </span>
                  )}

                </div>

              </div>

                </button>
              );
            }
          )}

          {/* EMPTY COLUMN */}

          {columnTasks.length ===
            0 &&
            !isDragOver && (
              <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">

                <div>

                  <p className="text-xs font-medium text-muted-foreground">
                    No tasks
                  </p>

                  <p className="mt-1 text-[11px] text-muted-foreground/70">
                    Drag a task here
                  </p>

                </div>

              </div>
            )}

        </div>

      </div>
    );
  };



  return (
    <div className="flex min-h-[calc(100vh-120px)] flex-col gap-5">

  
      <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* PROJECT */}

          <div className="min-w-0">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">

                <Folder className="h-5 w-5" />

              </div>

              <div className="min-w-0">

                <h1 className="truncate text-xl font-bold text-card-foreground sm:text-2xl">
                  {project.projectName}
                </h1>

                <p className="mt-0.5 text-sm text-muted-foreground">
                  {project.companyName}
                </p>

              </div>

            </div>

          </div>

          {/* STATISTICS */}

          <div className="flex flex-wrap items-center gap-2">

            {/* STATUS */}

            <div
              className={`
                flex
                items-center
                gap-2
                rounded-xl
                px-3
                py-2
                text-xs
                font-medium
                ${status.badge}
              `}
            >
              <span
                className={`
                  h-1.5
                  w-1.5
                  rounded-full
                  ${status.dot}
                `}
              />

              {status.label}

            </div>

           
            {/* FOLDERS */}

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">

              <Folder className="h-4 w-4 text-muted-foreground" />

              <div>

                <p className="text-[10px] text-muted-foreground">
                  Folders
                </p>

                <p className="text-sm font-semibold text-card-foreground">
                  {statistics?.folders ??
                    0}
                </p>

              </div>

            </div>

            {/* TASKS */}

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">

              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />

              <div>

                <p className="text-[10px] text-muted-foreground">
                  Tasks
                </p>

                <p className="text-sm font-semibold text-card-foreground">
                  {statistics?.tasks
                    .total ?? 0}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-row">

       
        <aside className="w-full shrink-0 border-b border-border bg-muted/20 lg:w-64 lg:border-b-0 lg:border-r">

          <div className="flex h-full flex-col">

            {/* SIDEBAR HEADER */}

            <div className="flex items-center justify-between border-b border-border px-4 py-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Folders
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  {folders.length} folder
                  {folders.length !== 1
                    ? "s"
                    : ""}
                </p>

              </div>

             <button
              type="button"
              title="Create folder"
              onClick={openCreateFolder}
              className="rounded-lg p-2 text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <FolderPlus className="h-4 w-4" />
            </button>

            </div>

            {/* FOLDER LIST */}

            <div className="flex gap-1 overflow-x-auto p-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">

            {folders.map((folder) => {
  const selected =
    selectedFolderId === folder.id;

  return (
    <div
      key={folder.id}
      className={`
        flex
        min-w-0
        items-center
        gap-1
        rounded-xl
        transition
        ${
          selected
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-card-foreground hover:bg-background"
        }
      `}
    >
      {/* Folder selection */}
      <button
        type="button"
        onClick={() =>
          setSelectedFolderId(folder.id)
        }
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
      >
        <Folder
          className={`
            h-4 w-4 shrink-0
            ${
              selected
                ? "text-primary-foreground"
                : "text-muted-foreground"
            }
          `}
        />

        <span className="truncate text-sm font-medium">
          {folder.name}
        </span>
      </button>

             <div className="relative mr-2">
  <button
    type="button"
    title="Folder actions"
    onClick={() => {
      setOpenFolderMenuId(
        openFolderMenuId === folder.id
          ? null
          : folder.id
      );
    }}
    className={`
      rounded-lg p-1.5 transition
      ${
        selected
          ? "text-primary-foreground hover:bg-white/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }
    `}
  >
    <MoreHorizontal className="h-4 w-4" />
  </button>

  {openFolderMenuId === folder.id && (
    <div className="absolute right-0 top-full z-30 mt-1 w-32 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg">

      <button
        type="button"
        onClick={() => {
          setOpenFolderMenuId(null);

          openEditFolder(
            folder.id,
            folder.name
          );
        }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs text-card-foreground hover:bg-muted"
      >
        Edit
      </button>

      <button
        type="button"
        onClick={() => {
          setOpenFolderMenuId(null);

          openDeleteFolder(
            folder.id,
            folder.name
          );
        }}
        className="w-full rounded-lg px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
      >
        Delete
      </button>

    </div>
  )}
</div>
            </div>
          );
        })}

              {/* NO FOLDERS */}

              {!loadingFolders &&
                folders.length ===
                  0 && (
                  <div className="px-3 py-8 text-center">

                    <Folder className="mx-auto h-7 w-7 text-muted-foreground/50" />

                    <p className="mt-3 text-xs text-muted-foreground">
                      No folders yet.
                    </p>

                   <button
                    type="button"
                    onClick={openCreateFolder}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create Folder
                  </button>

                  </div>
                )}

            </div>

            {/* NEW FOLDER */}

            {folders.length > 0 && (
              <div className="hidden border-t border-border p-3 lg:block">

                <button
                    type="button"
                    onClick={openCreateFolder}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs font-medium text-muted-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >
                  <FolderPlus className="h-4 w-4" />
                  New Folder
                </button>

              </div>
            )}

          </div>

        </aside>

        {/* ======================================================
            KANBAN
        ====================================================== */}

        <main className="min-w-0 flex-1 overflow-auto">

          {/* KANBAN HEADER */}

        <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-5 py-4 backdrop-blur">

  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

    {/* LEFT */}
    <div>
      <h2 className="text-base font-semibold text-card-foreground">
        {folders.find(
          (folder) =>
            folder.id === selectedFolderId
        )?.name || "Select a folder"}
      </h2>

      <p className="mt-0.5 text-xs text-muted-foreground">
        {tasks.length} task
        {tasks.length !== 1 ? "s" : ""}
      </p>
    </div>

    {/* RIGHT */}
    <div className="flex flex-wrap items-center gap-3">

      {/* MEMBER FILTER */}

      <div className="flex items-center gap-2">

        <span className="text-xs font-medium text-muted-foreground">
          Members
        </span>

        <div className="flex items-center">

          {/* ALL */}

          <button
            type="button"
            title="All members"
            onClick={() =>
              setSelectedMemberId(null)
            }
            className={`
              relative z-10 flex h-9 w-9 items-center justify-center
              rounded-full border-2 text-xs font-semibold
              transition
              ${
                selectedMemberId === null
                  ? "border-primary bg-primary text-primary-foreground ring-2 ring-primary/20"
                  : "border-border bg-muted text-muted-foreground hover:border-primary/50"
              }
            `}
          >
            All
          </button>

          {/* MEMBERS */}

          <div className="ml-1 flex items-center">

            {projectMembers.map(
              (member) => {
                const user =
                  member.user;

                const initials =
                  `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
                    .toUpperCase();

                const selected =
                  selectedMemberId ===
                  member.userId;

                return (
                  <button
                    key={member.id}
                    type="button"
                    title={`${user.firstName} ${user.lastName}`}
                    onClick={() =>
                      setSelectedMemberId(
                        selected
                          ? null
                          : member.userId
                      )
                    }
                    className={`
                      -ml-1.5 flex h-9 w-9 items-center
                      justify-center rounded-full border-2
                      text-xs font-semibold transition
                      first:ml-0
                      ${
                        selected
                          ? "z-20 border-primary bg-primary text-primary-foreground ring-2 ring-primary/20"
                          : "border-card bg-primary/10 text-primary hover:z-10 hover:border-primary/50"
                      }
                    `}
                  >
                    {initials}
                  </button>
                );
              }
            )}

          </div>

        </div>

        {/* CLEAR FILTER */}

        {selectedMemberId && (
          <button
            type="button"
            title="Clear member filter"
            onClick={() =>
              setSelectedMemberId(null)
            }
            className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Clear
          </button>
        )}

      </div>

      {/* ADD TASK */}

      <button
        type="button"
        disabled={!selectedFolderId}
        onClick={() => {
          setCreateTaskFolderId(
            selectedFolderId
          );

          setCreateTaskModalOpen(true);
        }}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
        Add Task
      </button>

    </div>

  </div>

</div>

          {/* KANBAN */}

          <div className="min-w-[1200px] p-4">

            {loadingTasks ? (

              <div className="flex min-h-[500px] items-center justify-center">

                <p className="text-sm text-muted-foreground">
                  Loading tasks...
                </p>

              </div>

            ) : !selectedFolderId ? (

              <div className="flex min-h-[500px] items-center justify-center">

                <div className="text-center">

                  <Folder className="mx-auto h-10 w-10 text-muted-foreground/40" />

                  <p className="mt-4 text-sm font-medium text-card-foreground">
                    Select a folder
                  </p>

                  <p className="mt-1 text-xs text-muted-foreground">
                    Choose a folder from the sidebar to view its tasks.
                  </p>

                </div>

              </div>

            ) : (

              <div className="flex gap-4">

                {/* TODO */}

                {renderTaskColumn(
                  "To Do",
                  todoTasks,
                  <Circle className="h-4 w-4 text-muted-foreground" />,
                  "TODO"
                )}

                {/* IN PROGRESS */}

                {renderTaskColumn(
                  "In Progress",
                  inProgressTasks,
                  <Clock3 className="h-4 w-4 text-blue-500" />,
                  "IN_PROGRESS"
                )}

                {/* HOLD */}

                {renderTaskColumn(
                  "Hold",
                  holdTasks,
                  <CirclePause className="h-4 w-4 text-amber-500" />,
                  "HOLD"
                )}

                {/* DONE */}

                {renderTaskColumn(
                  "Done",
                  doneTasks,
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
                  "DONE"
                )}

              </div>
            )}

          </div>

        </main>

      </div>

      {deleteFolderOpen && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">

      <div className="p-6">

        <h2 className="text-lg font-semibold text-card-foreground">
          Delete Folder?
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-medium text-card-foreground">
            "{deletingFolderName}"
          </span>
          ?
        </p>

        <p className="mt-2 text-xs text-muted-foreground">
          This action cannot be undone.
        </p>

      </div>

      <div className="flex justify-end gap-3 border-t border-border px-6 py-4">

        <button
          type="button"
          onClick={() => {
            setDeleteFolderOpen(false);
            setDeletingFolderId(null);
            setDeletingFolderName("");
          }}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDeleteFolder}
          className="rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Delete Folder
        </button>

      </div>

    </div>
  </div>
)}
 {popupMessage && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="project-error-title"
      className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl"
    >
      <div className="p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="project-error-title"
              className="text-base font-semibold text-card-foreground"
            >
              Something went wrong
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {popupMessage}
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end border-t border-border px-6 py-4">
        <button
          type="button"
          onClick={() => setPopupMessage(null)}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  </div>
)}
 <TaskDetailsModal
  task={selectedTask}
  open={taskModalOpen}
  projectId={projectId}
  currentUserId={currentUserId}
  onClose={closeTaskDetails}
  onUpdated={() => {
    fetchTasks();
    fetchProjectDashboard();
  }}
/>
<CreateTaskModal
  open={createTaskModalOpen}
  projectId={projectId}
  folderId={createTaskFolderId ?? ""}
  onClose={() => {
    setCreateTaskModalOpen(false);
    setCreateTaskFolderId(null);
  }}
  onCreated={() => {
    fetchTasks();
    fetchProjectDashboard();
  }}
/>
<FolderModal
  open={folderModalOpen}
  projectId={projectId}
  mode={folderModalMode}
  folderId={editingFolderId}
  initialName={editingFolderName}
  onClose={() => {
    setFolderModalOpen(false);
    setEditingFolderId(null);
    setEditingFolderName("");
  }}
  onSaved={async () => {
    await fetchFolders();
    await fetchProjectDashboard();
  }}
/>
    </div>
  );
}