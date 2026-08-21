"use client";
import {
  CalendarDays,
  MessageCircle,
  Paperclip,
  X,
  Upload,
  Download,
  Trash2,
  Loader2,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Send,
  Type,
  Bold,
  List,
  ListOrdered,
  Palette,
  Code2,
  Undo2,
  Redo2,
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "@/services/api";

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

interface TaskAttachment {
  id: string;
  taskId: string;
  originalName: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  fileSize: number;
  uploadedById: string;
  createdAt: string;

  uploadedBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
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

  attachments?: TaskAttachment[];
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

interface ProjectMember {
  id: string;
  userId: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status?: string;
  };

  role?: {
    id: string;
    name: string;
  };
}

interface TaskDetailsModalProps {
  task: Task | null;
  open: boolean;
  projectId: string;
  currentUserId: string | null;
  onClose: () => void;
  onUpdated: () => void;
}

const statusOptions: {
  value: TaskStatus;
  label: string;
}[] = [
  {
    value: "TODO",
    label: "To Do",
  },
  {
    value: "IN_PROGRESS",
    label: "In Progress",
  },
  {
    value: "HOLD",
    label: "Hold",
  },
  {
    value: "DONE",
    label: "Done",
  },
];

const priorityOptions: {
  value: TaskPriority;
  label: string;
}[] = [
  {
    value: "LOW",
    label: "Low",
  },
  {
    value: "MEDIUM",
    label: "Medium",
  },
  {
    value: "HIGH",
    label: "High",
  },
  {
    value: "URGENT",
    label: "Urgent",
  },
];

function formatDate(date?: string | null) {
  if (!date) {
    return "Not set";
  }

  return new Date(date).toLocaleDateString(
    "en-LK",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(1)} MB`;
  }

  return `${(
    bytes /
    (1024 * 1024 * 1024)
  ).toFixed(1)} GB`;
}

function getApiErrorMessage(
  error: unknown,
  fallback: string
) {
  const axiosError = error as {
    response?: {
      data?: {
        message?: string;
      };
    };
  };

  return (
    axiosError?.response?.data?.message ||
    fallback
  );
}

export default function TaskDetailsModal({
  task,
  open,
  projectId,
  currentUserId,
  onClose,
  onUpdated,
}: TaskDetailsModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const descriptionEditorRef =
    useRef<HTMLDivElement | null>(null);

  const [status, setStatus] =
    useState<TaskStatus>("TODO");

  const [priority, setPriority] =
    useState<TaskPriority>("MEDIUM");

  const [assignedToId, setAssignedToId] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [saving, setSaving] =
    useState(false);
    const [attachmentUploading, setAttachmentUploading] =
  useState(false);

const [attachmentDeletingId, setAttachmentDeletingId] =
  useState<string | null>(null);

 
  const [attachments, setAttachments] =
    useState<TaskAttachment[]>([]);

  const [attachmentToDelete, setAttachmentToDelete] =
    useState<TaskAttachment | null>(null);

  const [error, setError] =
    useState<string | null>(null);

  const [comments, setComments] =
    useState<Comment[]>([]);

  const [commentsLoading, setCommentsLoading] =
    useState(false);

  const [newComment, setNewComment] =
    useState("");

  const [commentSubmitting, setCommentSubmitting] =
    useState(false);

  const [editingCommentId, setEditingCommentId] =
    useState<string | null>(null);

  const [editingCommentText, setEditingCommentText] =
    useState("");
  const [showDeleteTaskConfirmation, setShowDeleteTaskConfirmation] =
  useState(false);
  /*
   * ============================================================
   * USER PERMISSIONS
   * ============================================================
   *
   * Reporter:
   * - Edit task details
   * - Change status
   * - Upload attachment
   * - Add comments
   * - Edit/delete own comments
   *
   * Assignee:
   * - Cannot edit task details
   * - Change status
   * - Upload attachment
   * - Add comments
   * - Edit/delete own comments
   *
   * Other members:
   * - View task
   * - Add comments
   * - Edit/delete own comments
   */

  const isAssignee =
    !!task?.assignedToId &&
    task.assignedToId === currentUserId;

  const isReporter =
    task?.createdById === currentUserId;

  const canEditTaskDetails =
    isReporter;

  const canChangeStatus =
    isReporter || isAssignee;

  const canUploadAttachment =
    isReporter || isAssignee;

  const canDeleteTask =
  isReporter;
  
  const runDescriptionCommand = (
    command: string,
    value?: string
  ) => {
    if (!canEditTaskDetails || saving) {
      return;
    }

    descriptionEditorRef.current?.focus();

    document.execCommand(
      command,
      false,
      value
    );

    if (descriptionEditorRef.current) {
      setDescription(
        descriptionEditorRef.current.innerHTML
      );
    }
  };


  const handleDescriptionInput = (
    event: React.FormEvent<HTMLDivElement>
  ) => {
    setDescription(
      event.currentTarget.innerHTML
    );
  };

  const getDescriptionHtml = (
    value: string
  ) => {
    if (!value.trim()) {
      return "";
    }

    // Existing descriptions may be plain text.
    // Preserve them as readable HTML.
    if (!/<[a-z][\s\S]*>/i.test(value)) {
      return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br />");
    }

    return value;
  };

  useEffect(() => {
    if (!open || !task) {
      return;
    }

    const loadComments = async () => {
      try {
        setCommentsLoading(true);

        const response = await api.get(
          `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/comments`
        );

        setComments(
          response.data?.data ?? []
        );
      } catch (error) {
        console.error(
          "Failed to load comments:",
          error
        );

        setComments([]);
      } finally {
        setCommentsLoading(false);
      }
    };

    loadComments();
  }, [open, task, projectId]);

  const handleDeleteTask = async () => {
  if (!task || !canDeleteTask) {
    return;
  }

  try {
    setSaving(true);
    setError(null);

    await api.delete(
      `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}`
    );

    onUpdated();
    onClose();

  } catch (error) {
    console.error(
      "Failed to delete task:",
      error
    );

    setError(
      getApiErrorMessage(
        error,
        "Failed to delete task."
      )
    );
  } finally {
    setSaving(false);
  }
};
  const handleAddComment = async () => {
    const content =
      newComment.trim();

    if (!content || !task) {
      return;
    }

    try {
      setCommentSubmitting(true);
      setError(null);

      const response = await api.post(
        `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/comments`,
        {
          content,
        }
      );

      const createdComment =
        response.data?.data;

      if (createdComment) {
        setComments((current) => [
          ...current,
          createdComment,
        ]);
      }

      setNewComment("");
    } catch (error) {
      console.error(
        "Failed to add comment:",
        error
      );

      setError(
        getApiErrorMessage(
          error,
          "Failed to add comment."
        )
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

 

  const handleUpdateComment = async (
    commentId: string
  ) => {
    const content =
      editingCommentText.trim();

    if (!content || !task) {
      return;
    }

    const comment = comments.find(
      (item) => item.id === commentId
    );

    if (!comment) {
      return;
    }

   
    if (comment.userId !== currentUserId) {
      setError(
        "You can only edit your own comments."
      );
      return;
    }

    try {
      setError(null);

      const response = await api.put(
        `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/comments/${commentId}`,
        {
          content,
        }
      );

      const updatedComment =
        response.data?.data;

      if (updatedComment) {
        setComments((current) =>
          current.map((item) =>
            item.id === commentId
              ? updatedComment
              : item
          )
        );
      }

      setEditingCommentId(null);
      setEditingCommentText("");
    } catch (error) {
      console.error(
        "Failed to update comment:",
        error
      );

      setError(
        getApiErrorMessage(
          error,
          "Failed to update comment."
        )
      );
    }
  };



  const handleDeleteComment = async (
    commentId: string
  ) => {
    if (!task) {
      return;
    }

    const comment = comments.find(
      (item) => item.id === commentId
    );

    if (!comment) {
      return;
    }

    // Only comment author can delete
    if (comment.userId !== currentUserId) {
      setError(
        "You can only delete your own comments."
      );
      return;
    }

    try {
      setError(null);

      await api.delete(
        `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/comments/${commentId}`
      );

      setComments((current) =>
        current.filter(
          (item) =>
            item.id !== commentId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete comment:",
        error
      );

      setError(
        getApiErrorMessage(
          error,
          "Failed to delete comment."
        )
      );
    }
  };



  useEffect(() => {
    if (!task || !open) {
      return;
    }

    setTitle(task.title);

    setDescription(
      task.description ?? ""
    );

    requestAnimationFrame(() => {
      if (descriptionEditorRef.current) {
        descriptionEditorRef.current.innerHTML =
          getDescriptionHtml(
            task.description ?? ""
          );
      }
    });

    setStatus(task.status);

    setPriority(task.priority);

    setAssignedToId(
      task.assignedToId ?? ""
    );

    setDueDate(
      task.dueDate
        ? task.dueDate.slice(0, 10)
        : ""
    );

   
    setAttachments([]);
    setAttachmentToDelete(null);
    setAttachmentDeletingId(null);

    setError(null);

    setEditingCommentId(null);
    setEditingCommentText("");
    setNewComment("");
  }, [open, task?.id]);

 
  useEffect(() => {
    if (!open || !projectId) {
      return;
    }

    const loadMembers = async () => {
      try {
        setLoadingMembers(true);

        const response = await api.get(
          `/projects/${projectId}/members`
        );

        setMembers(
          response.data?.data ?? []
        );
      } catch (error) {
        console.error(
          "Failed to load project members:",
          error
        );

        setMembers([]);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMembers();
  }, [open, projectId]);

  

  const refreshAttachments = async () => {
    if (!task) {
      return;
    }

    try {
      const response = await api.get(
        `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/attachments`,
        {
         
          params: {
            _t: Date.now(),
          },
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      setAttachments(response.data?.data ?? []);
    } catch (error) {
      console.error("Failed to refresh attachments:", error);
      throw error;
    }
  };

 
  useEffect(() => {
    if (!open || !task) {
      return;
    }

    refreshAttachments().catch((error) => {
      setError(
        getApiErrorMessage(
          error,
          "Failed to load attachments."
        )
      );
    });
  }, [open, task?.id, projectId]);

 

const handleSave = async () => {
    if (!task) {
        return;
    }

    try {
        setSaving(true);
        setError(null);

        const payload: Record<string, unknown> = {};

      
        if (canEditTaskDetails) {
            payload.title = title.trim();

            payload.description =
                description.trim() || null;

            payload.priority = priority;

            payload.assignedToId =
                assignedToId || null;

           
           payload.dueDate = dueDate
              ? new Date(
                  `${dueDate}T00:00:00`
                ).toISOString()
              : null;
        }

       
        if (canChangeStatus) {
            payload.status = status;
        }

        if (Object.keys(payload).length === 0) {
            return;
        }

        await api.put(
            `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}`,
            payload
        );

        onUpdated();
        onClose();

    } catch (error) {
        console.error(
            "Failed to update task:",
            error
        );

        setError(
            getApiErrorMessage(
                error,
                "Failed to update task."
            )
        );
    } finally {
        setSaving(false);
    }
};

const handleAttachmentUpload = async (
  event: ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];

  if (!file || !task) {
    event.target.value = "";
    return;
  }

  try {
    setAttachmentUploading(true);
    setError(null);

    const formData = new FormData();

    formData.append(
      "attachment",
      file
    );

  await api.post(
  `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/attachments`,
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  }
);
   

    await refreshAttachments();

  } catch (error) {
    console.error(
      "Failed to upload attachment:",
      error
    );

    setError(
      getApiErrorMessage(
        error,
        "Failed to upload attachment."
      )
    );
  } finally {
    setAttachmentUploading(false);

    // Allow selecting same file again
    event.target.value = "";
  }
};
const handleDeleteAttachment = async (
  attachmentId: string
) => {
  if (!task) {
    return;
  }

  try {
    setAttachmentDeletingId(attachmentId);
    setError(null);

    await api.delete(
      `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/attachments/${attachmentId}`
    );

    // Remove it immediately from the currently open modal.
    setAttachments((current) =>
      current.filter(
        (item) => item.id !== attachmentId
      )
    );

    // Re-fetch from the backend so the modal is guaranteed to
    // show the actual persisted attachment state.
    await refreshAttachments();

    // Keep this change local to the modal. The parent task is updated only
    // when the user explicitly clicks Save Changes.
    setAttachmentToDelete(null);
  } catch (error) {
    console.error(
      "Failed to delete attachment:",
      error
    );

    setError(
      getApiErrorMessage(
        error,
        "Failed to delete attachment."
      )
    );
  } finally {
    setAttachmentDeletingId(null);
  }
};

const openDeleteAttachmentConfirmation = (
  attachmentId: string
) => {
  const attachment =
    attachments.find(
      (item) => item.id === attachmentId
    );

  if (!attachment) {
    return;
  }

  setError(null);
  setAttachmentToDelete(attachment);
};

  const getInitials = (
    firstName?: string,
    lastName?: string
  ) => {
    return `${firstName?.charAt(0) ?? ""}${lastName?.charAt(0) ?? ""}`
      .toUpperCase();
  };

  const statusLabel =
    statusOptions.find(
      (option) => option.value === status
    )?.label ?? status;

  const priorityLabel =
    priorityOptions.find(
      (option) => option.value === priority
    )?.label ?? priority;

  const priorityClass = {
    LOW: "border-border bg-muted/40 text-muted-foreground",
    MEDIUM:
      "border-blue-200 bg-blue-500/10 text-blue-600",
    HIGH:
      "border-orange-200 bg-orange-500/10 text-orange-600",
    URGENT:
      "border-red-200 bg-red-500/10 text-destructive",
  }[priority];

  const statusClass = {
    TODO:
      "border-border bg-muted/40 text-card-foreground",
    IN_PROGRESS:
      "border-blue-200 bg-blue-500/10 text-blue-600",
    HOLD:
      "border-amber-200 bg-amber-500/10 text-amber-300",
    DONE:
      "border-emerald-200 bg-emerald-500/10 text-emerald-400",
  }[status];

  if (!open || !task) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !saving &&
          !attachmentToDelete &&
          !showDeleteTaskConfirmation
        ) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex h-[96vh] w-full max-w-[1450px] flex-col
          overflow-hidden rounded-2xl border border-border
          bg-card text-card-foreground shadow-2xl
        "
      >
        {/* ====================================================== */}
        {/* HEADER / BREADCRUMB                                   */}
        {/* ====================================================== */}
        <header className="shrink-0 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-7">
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban className="h-4 w-4 shrink-0" />

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="shrink-0 transition hover:text-card-foreground disabled:opacity-50"
              >
                Projects
              </button>

              <span>/</span>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="shrink-0 transition hover:text-card-foreground disabled:opacity-50"
              >
                Project
              </button>

              <span>/</span>

              <span className="truncate text-card-foreground">
                Task
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                className="hidden rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground sm:block"
                title="More actions"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                aria-label="Close task"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="px-5 pb-5 sm:px-7 sm:pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {isReporter && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
                      Reporter
                    </span>
                  )}

                  {isAssignee && (
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-semibold text-blue-600">
                      Assignee
                    </span>
                  )}

                  {!isReporter && !isAssignee && (
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                      Project Member
                    </span>
                  )}

                  <span className="text-xs text-muted-foreground">
                    #{task.id.slice(-8)}
                  </span>
                </div>

                {canEditTaskDetails ? (
                  <input
                    value={title}
                    onChange={(event) =>
                      setTitle(event.target.value)
                    }
                    disabled={saving}
                    className="
                      w-full max-w-4xl bg-transparent
                      text-lg font-bold tracking-tight
                      text-card-foreground outline-none
                      placeholder:text-muted-foreground
                      sm:text-3xl lg:text-[34px]
                    "
                    placeholder="Task title"
                  />
                ) : (
                  <h2 className="max-w-4xl text-lg font-bold tracking-tight text-card-foreground sm:text-3xl lg:text-[34px]">
                    {task.title}
                  </h2>
                )}

                <p className="mt-2 text-sm text-muted-foreground">
                  Task details and activity
                </p>
              </div>

              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {canChangeStatus ? (
                  <div className="relative">
                    <select
                      value={status}
                      onChange={(event) =>
                        setStatus(
                          event.target.value as TaskStatus
                        )
                      }
                      disabled={saving}
                      className={`
                        appearance-none rounded-lg border
                        px-3 py-2 pr-9 text-sm font-semibold
                        outline-none transition
                        disabled:cursor-not-allowed disabled:opacity-60
                        ${statusClass}
                      `}
                    >
                      {statusOptions.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                          className="bg-card text-card-foreground"
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
                  </div>
                ) : (
                  <span
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold ${statusClass}`}
                  >
                    {statusLabel}
                  </span>
                )}

                <span
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${priorityClass}`}
                >
                  {priorityLabel}
                </span>

                {status === "DONE" && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    Done
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ====================================================== */}
        {/* MAIN CONTENT                                            */}
        {/* ====================================================== */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className="grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_350px]">
            {/* ================================================== */}
            {/* LEFT / MAIN                                         */}
            {/* ================================================== */}
            <main className="min-h-0 overflow-y-auto">
              <div className="mx-auto w-full max-w-5xl space-y-8 px-5 py-6 sm:px-7 lg:px-9 lg:py-8">
                {error && (
                  <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* DESCRIPTION */}
                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      Description
                    </h3>

                    {!canEditTaskDetails && (
                      <span className="text-xs text-muted-foreground">
                        Read only
                      </span>
                    )}
                  </div>

                  {canEditTaskDetails ? (
                    <div className="overflow-hidden rounded-xl border border-border bg-background">
                      {/* Description toolbar */}
                      <div className="flex flex-wrap items-center gap-1 border-b border-border px-2 py-2">
                        <button
                          type="button"
                          title="Text"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "formatBlock",
                              "p"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Type className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Bold"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "bold"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Bold className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Bulleted list"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "insertUnorderedList"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <List className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Numbered list"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "insertOrderedList"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <ListOrdered className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Text color"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "foreColor",
                              "#2563eb"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Palette className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Code"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "formatBlock",
                              "pre"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Code2 className="h-4 w-4" />
                        </button>

                     

                        <button
                          type="button"
                          title="Undo"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "undo"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Undo2 className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          title="Redo"
                          onMouseDown={(event) =>
                            event.preventDefault()
                          }
                          onClick={() =>
                            runDescriptionCommand(
                              "redo"
                            )
                          }
                          disabled={saving}
                          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                        >
                          <Redo2 className="h-4 w-4" />
                        </button>

                      
                      </div>

                      {/* Description editor */}
                      <div
                        ref={descriptionEditorRef}
                        contentEditable={!saving}
                        suppressContentEditableWarning
                        onInput={
                          handleDescriptionInput
                        }
                        data-placeholder="Add a description..."
                        className="
                          min-h-[150px] w-full
                          px-4 py-4
                          text-sm leading-6
                          text-card-foreground
                          outline-none
                          [&:empty]:before:pointer-events-none
                          [&:empty]:before:text-muted-foreground
                          [&:empty]:before:content-[attr(data-placeholder)]
                          [&_a]:text-primary
                          [&_a]:underline
                          [&_pre]:my-2
                          [&_pre]:rounded-lg
                          [&_pre]:bg-muted
                          [&_pre]:p-3
                          [&_pre]:font-mono
                          [&_ul]:list-disc
                          [&_ul]:pl-6
                          [&_ol]:list-decimal
                          [&_ol]:pl-6
                        "
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-background px-4 py-4">
                      {description.trim() ? (
                        /<[a-z][\s\S]*>/i.test(
                          description
                        ) ? (
                          <div
                            className="
                              text-sm leading-7 text-card-foreground
                              [&_a]:text-primary
                              [&_a]:underline
                              [&_pre]:my-2
                              [&_pre]:rounded-lg
                              [&_pre]:bg-muted
                              [&_pre]:p-3
                              [&_pre]:font-mono
                              [&_ul]:list-disc
                              [&_ul]:pl-6
                              [&_ol]:list-decimal
                              [&_ol]:pl-6
                            "
                            dangerouslySetInnerHTML={{
                              __html:
                                description,
                            }}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-7 text-card-foreground">
                            {description}
                          </p>
                        )
                      ) : (
                        <p className="text-sm italic text-muted-foreground">
                          No description added.
                        </p>
                      )}
                    </div>
                  )}
                </section>

                {/* ATTACHMENTS */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        Attachments
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {attachments.length}{" "}
                        {attachments.length === 1
                          ? "file"
                          : "files"}
                      </p>
                    </div>

                    {canUploadAttachment && (
                      <label
                        className={`
                          inline-flex items-center gap-2 rounded-lg
                          border border-border bg-white/5
                          px-3 py-2 text-xs font-semibold
                          text-card-foreground transition
                          ${
                            attachmentUploading
                              ? "cursor-not-allowed opacity-50"
                              : "cursor-pointer hover:bg-muted"
                          }
                        `}
                      >
                        {attachmentUploading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Upload className="h-3.5 w-3.5" />
                        )}

                        {attachmentUploading
                          ? "Uploading..."
                          : "Add attachment"}

                        <input
                          type="file"
                          className="hidden"
                          disabled={attachmentUploading}
                          onChange={
                            handleAttachmentUpload
                          }
                        />
                      </label>
                    )}
                  </div>

                  {attachments.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {attachments.map((attachment) => (
                        <div
                          key={attachment.id}
                          className="
                            group flex min-w-0 items-center
                            justify-between gap-3 rounded-xl
                            border border-border bg-background
                            p-3.5 transition hover:border-border
                          "
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                              <Paperclip className="h-4 w-4" />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-sm font-medium text-card-foreground"
                                title={
                                  attachment.originalName
                                }
                              >
                                {attachment.originalName}
                              </p>

                              <p className="mt-1 truncate text-xs text-muted-foreground">
                                {formatFileSize(
                                  attachment.fileSize
                                )}{" "}
                                •{" "}
                                {attachment.uploadedBy
                                  ? `Uploaded by ${attachment.uploadedBy.firstName} ${attachment.uploadedBy.lastName}`
                                  : "Uploaded"}
                              </p>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  const response =
                                    await api.get(
                                      `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/attachments/${attachment.id}`,
                                      {
                                        responseType:
                                          "blob",
                                      }
                                    );

                                  const blobUrl =
                                    window.URL.createObjectURL(
                                      new Blob([
                                        response.data,
                                      ])
                                    );

                                  const link =
                                    document.createElement(
                                      "a"
                                    );

                                  link.href = blobUrl;
                                  link.download =
                                    attachment.originalName;

                                  document.body.appendChild(
                                    link
                                  );

                                  link.click();
                                  link.remove();

                                  window.URL.revokeObjectURL(
                                    blobUrl
                                  );
                                } catch (error) {
                                  console.error(
                                    "Failed to download attachment:",
                                    error
                                  );

                                  setError(
                                    getApiErrorMessage(
                                      error,
                                      "Failed to download attachment."
                                    )
                                  );
                                }
                              }}
                              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>

                            {canUploadAttachment && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteAttachmentConfirmation(
                                    attachment.id
                                  )
                                }
                                disabled={
                                  attachmentDeletingId ===
                                  attachment.id
                                }
                                className="rounded-lg p-2 text-muted-foreground transition hover:bg-red-500/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                                title="Delete"
                              >
                                {attachmentDeletingId ===
                                attachment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Trash2 className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                      <Paperclip className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No attachments
                      </p>
                    </div>
                  )}
                </section>

                {/* COMMENTS / ACTIVITY */}
                <section>
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-card-foreground">
                        Activity
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {comments.length}{" "}
                        {comments.length === 1
                          ? "comment"
                          : "comments"}
                      </p>
                    </div>

                    <MessageCircle className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {commentsLoading ? (
                    <div className="rounded-xl border border-border bg-background p-8 text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Loading comments...
                      </p>
                    </div>
                  ) : comments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center">
                      <MessageCircle className="mx-auto h-5 w-5 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No comments yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {comments.map((comment) => {
                        const isCommentAuthor =
                          comment.userId ===
                          currentUserId;

                        return (
                          <div
                            key={comment.id}
                            className="rounded-xl border border-border bg-background p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                  {getInitials(
                                    comment.user.firstName,
                                    comment.user.lastName
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-card-foreground">
                                    {comment.user.firstName}{" "}
                                    {comment.user.lastName}

                                    {isCommentAuthor && (
                                      <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                        You
                                      </span>
                                    )}
                                  </p>

                                  <p className="text-xs text-muted-foreground">
                                    {new Date(
                                      comment.createdAt
                                    ).toLocaleString(
                                      "en-LK"
                                    )}
                                  </p>
                                </div>
                              </div>

                              {isCommentAuthor && (
                                <div className="flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(
                                        comment.id
                                      );
                                      setEditingCommentText(
                                        comment.content
                                      );
                                    }}
                                    className="rounded-lg px-2 py-1 text-xs text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteComment(
                                        comment.id
                                      )
                                    }
                                    className="rounded-lg px-2 py-1 text-xs text-destructive transition hover:bg-red-500/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>

                            {editingCommentId ===
                            comment.id ? (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={
                                    editingCommentText
                                  }
                                  onChange={(event) =>
                                    setEditingCommentText(
                                      event.target.value
                                    )
                                  }
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-border bg-card px-3 py-2 text-sm text-card-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                                />

                                <div className="flex justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCommentId(
                                        null
                                      );
                                      setEditingCommentText(
                                        ""
                                      );
                                    }}
                                    className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-card-foreground"
                                  >
                                    Cancel
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateComment(
                                        comment.id
                                      )
                                    }
                                    disabled={
                                      !editingCommentText.trim()
                                    }
                                    className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-card-foreground">
                                {comment.content}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <textarea
                      value={newComment}
                      onChange={(event) =>
                        setNewComment(
                          event.target.value
                        )
                      }
                      placeholder="Add a comment..."
                      rows={3}
                      className="w-full resize-none bg-transparent text-sm leading-6 text-card-foreground outline-none placeholder:text-muted-foreground"
                    />

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={handleAddComment}
                        disabled={
                          commentSubmitting ||
                          !newComment.trim()
                        }
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {commentSubmitting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}

                        {commentSubmitting
                          ? "Adding..."
                          : "Add comment"}
                      </button>
                    </div>
                  </div>
                </section>

                {/* CREATED / UPDATED */}
                <section className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Created
                    </p>
                    <p className="mt-2 text-sm font-medium text-card-foreground">
                      {formatDate(task.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/20 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Last updated
                    </p>
                    <p className="mt-2 text-sm font-medium text-card-foreground">
                      {formatDate(task.updatedAt)}
                    </p>
                  </div>
                </section>
              </div>
            </main>

            {/* ================================================== */}
            {/* RIGHT / DETAILS                                    */}
            {/* ================================================== */}
            <aside className="min-h-0 overflow-y-auto border-t border-border bg-card lg:border-l lg:border-t-0">
              <div className="space-y-7 p-5 sm:p-5">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-card-foreground">
                      Details
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* ASSIGNEE */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Assignee
                      </p>

                      {canEditTaskDetails ? (
                        <div className="relative">
                          <select
                            value={assignedToId}
                            onChange={(event) =>
                              setAssignedToId(
                                event.target.value
                              )
                            }
                            disabled={
                              loadingMembers || saving
                            }
                            className="
                              w-full appearance-none rounded-xl
                              border border-border bg-background
                              px-3 py-3 pr-9 text-sm text-card-foreground
                              outline-none focus:border-primary
                              focus:ring-2 focus:ring-primary/20
                              disabled:cursor-not-allowed disabled:opacity-60
                            "
                          >
                            <option
                              value=""
                              className="bg-background"
                            >
                              Unassigned
                            </option>

                            {members.map((member) => (
                              <option
                                key={member.userId}
                                value={member.userId}
                                className="bg-background"
                              >
                                {member.user.firstName}{" "}
                                {member.user.lastName}
                              </option>
                            ))}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {task.assignedTo
                              ? getInitials(
                                  task.assignedTo
                                    .firstName,
                                  task.assignedTo
                                    .lastName
                                )
                              : "—"}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-card-foreground">
                              {task.assignedTo
                                ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
                                : "Unassigned"}
                            </p>

                            {task.assignedTo?.email && (
                              <p className="truncate text-xs text-muted-foreground">
                                {task.assignedTo.email}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* PRIORITY */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Priority
                      </p>

                      {canEditTaskDetails ? (
                        <select
                          value={priority}
                          onChange={(event) =>
                            setPriority(
                              event.target.value as TaskPriority
                            )
                          }
                          disabled={saving}
                          className="
                            w-full rounded-xl border border-border
                            bg-background px-3 py-3 text-sm text-card-foreground
                            outline-none focus:border-primary
                            focus:ring-2 focus:ring-primary/20
                            disabled:cursor-not-allowed disabled:opacity-60
                          "
                        >
                          {priorityOptions.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                                className="bg-background"
                              >
                                {option.label}
                              </option>
                            )
                          )}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex rounded-lg border px-3 py-2 text-sm font-medium ${priorityClass}`}
                        >
                          {priorityLabel}
                        </span>
                      )}
                    </div>

                    {/* STATUS */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Status
                      </p>

                      {canChangeStatus ? (
                        <div className="relative">
                          <select
                            value={status}
                            onChange={(event) =>
                              setStatus(
                                event.target.value as TaskStatus
                              )
                            }
                            disabled={saving}
                            className={`
                              w-full appearance-none rounded-xl
                              border px-3 py-3 pr-9 text-sm font-medium
                              outline-none transition
                              disabled:cursor-not-allowed disabled:opacity-60
                              ${statusClass}
                            `}
                          >
                            {statusOptions.map(
                              (option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                  className="bg-background text-card-foreground"
                                >
                                  {option.label}
                                </option>
                              )
                            )}
                          </select>

                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
                        </div>
                      ) : (
                        <span
                          className={`inline-flex rounded-lg border px-3 py-2 text-sm font-medium ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      )}
                    </div>

                    {/* DUE DATE */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Due date
                      </p>

                      {canEditTaskDetails ? (
                        <div className="relative">
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(event) =>
                              setDueDate(
                                event.target.value
                              )
                            }
                            disabled={saving}
                            className="
                              w-full rounded-xl border border-border
                              bg-background px-3 py-3 text-sm text-card-foreground
                              outline-none focus:border-primary
                              focus:ring-2 focus:ring-primary/20
                              disabled:cursor-not-allowed disabled:opacity-60
                            "
                          />

                          <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-card-foreground">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          {formatDate(task.dueDate)}
                        </div>
                      )}
                    </div>

                    {/* REPORTER */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Reporter
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-semibold text-blue-600">
                          {task.createdBy
                            ? getInitials(
                                task.createdBy.firstName,
                                task.createdBy.lastName
                              )
                            : "—"}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {task.createdBy
                              ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                              : "Unknown"}
                          </p>

                          {task.createdBy?.email && (
                            <p className="truncate text-xs text-muted-foreground">
                              {task.createdBy.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* TASK ID */}
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Task ID
                      </p>

                      <p className="break-all rounded-lg bg-background px-3 py-2 text-xs text-muted-foreground">
                        {task.id}
                      </p>
                    </div>

                    {/* CREATED / UPDATED */}
                    <div className="border-t border-border pt-5">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Created
                          </p>
                          <p className="mt-1 text-sm text-card-foreground">
                            {formatDate(task.createdAt)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Last updated
                          </p>
                          <p className="mt-1 text-sm text-card-foreground">
                            {formatDate(task.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PERMISSION SUMMARY */}
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Your access
                  </p>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Edit details
                      </span>
                      <span
                        className={
                          canEditTaskDetails
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }
                      >
                        {canEditTaskDetails
                          ? "Allowed"
                          : "View only"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Change status
                      </span>
                      <span
                        className={
                          canChangeStatus
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }
                      >
                        {canChangeStatus
                          ? "Allowed"
                          : "View only"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Attachments
                      </span>
                      <span
                        className={
                          canUploadAttachment
                            ? "text-emerald-400"
                            : "text-muted-foreground"
                        }
                      >
                        {canUploadAttachment
                          ? "Allowed"
                          : "View only"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* ====================================================== */}
        {/* FOOTER                                                 */}
        {/* ====================================================== */}
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-card px-5 py-4 sm:px-7">
          <div>
            {canDeleteTask && (
              <button
                type="button"
                onClick={() =>
                  setShowDeleteTaskConfirmation(true)
                }
                disabled={saving}
                className="
                  inline-flex items-center gap-2 rounded-lg
                  border border-red-500/20 px-3 py-2.5
                  text-sm font-medium text-destructive transition
                  hover:bg-red-500/10
                  disabled:cursor-not-allowed disabled:opacity-50
                "
              >
                <Trash2 className="h-4 w-4" />
                Delete task
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-lg border border-border
                px-3.5 py-2 text-sm font-medium text-card-foreground
                transition hover:bg-muted hover:text-card-foreground
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              Close
            </button>

            {(canEditTaskDetails || canChangeStatus) && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="
                  inline-flex items-center gap-2 rounded-lg
                  bg-primary px-4 py-2 text-sm font-semibold
                  text-primary-foreground shadow-sm transition
                  hover:opacity-90
                  disabled:cursor-not-allowed disabled:opacity-60
                "
              >
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {saving
                  ? "Saving..."
                  : "Save changes"}
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* ======================================================== */}
      {/* DELETE ATTACHMENT CONFIRMATION                           */}
      {/* ======================================================== */}
      {attachmentToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !attachmentDeletingId
            ) {
              setAttachmentToDelete(null);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">
                  Delete attachment
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-card-foreground">
                    "{attachmentToDelete.originalName}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!attachmentDeletingId) {
                    setAttachmentToDelete(null);
                  }
                }}
                disabled={!!attachmentDeletingId}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setAttachmentToDelete(null)
                }
                disabled={!!attachmentDeletingId}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() =>
                  handleDeleteAttachment(
                    attachmentToDelete.id
                  )
                }
                disabled={
                  attachmentDeletingId ===
                  attachmentToDelete.id
                }
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-card-foreground transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {attachmentDeletingId ===
                attachmentToDelete.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE TASK CONFIRMATION                                 */}
      {/* ======================================================== */}
      {showDeleteTaskConfirmation && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !saving
            ) {
              setShowDeleteTaskConfirmation(false);
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-destructive">
                <Trash2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold">
                  Delete task
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Are you sure you want to delete{" "}
                  <span className="font-medium text-card-foreground">
                    "{task.title}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowDeleteTaskConfirmation(false)
                }
                disabled={saving}
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-card-foreground disabled:opacity-50"
                aria-label="Close confirmation"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() =>
                  setShowDeleteTaskConfirmation(false)
                }
                disabled={saving}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDeleteTask}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-card-foreground transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete task
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
