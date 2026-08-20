"use client";
import {
  CalendarDays,
  MessageCircle,
  Clock3,
  Paperclip,
  User,
  X,
  Upload,
  Download,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  ChangeEvent,
  useEffect,
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

  if (!open || !task) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

     

        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Task
            </p>

            <h2 className="text-xl font-bold tracking-tight text-card-foreground">
              Task Details
            </h2>

            <div className="mt-2 flex flex-wrap gap-2">
              {isReporter && (
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Reporter
                </span>
              )}

              {isAssignee && (
                <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600">
                  Assignee
                </span>
              )}

              {!isReporter &&
                !isAssignee && (
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    Project Member
                  </span>
                )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

       
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

          
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Task Title
              </label>

              <input
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                disabled={
                  !canEditTaskDetails
                }
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70"
                placeholder="Enter task title"
              />

              {!canEditTaskDetails && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Only the reporter can edit
                  the task title.
                </p>
              )}
            </div>

            {/* =================================================
                DESCRIPTION
            ================================================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                disabled={
                  !canEditTaskDetails
                }
                rows={5}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70"
                placeholder="Describe the task..."
              />
            </div>

           

            <div className="grid gap-4 sm:grid-cols-2">

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Status
                </label>

                <div className="relative">
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(
                        event.target
                          .value as TaskStatus
                      )
                    }
                    disabled={
                      !canChangeStatus
                    }
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70"
                  >
                    {statusOptions.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>

                  <Clock3 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                {canChangeStatus && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    You can change the
                    task status.
                  </p>
                )}
              </div>

              {/* PRIORITY */}

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target
                        .value as TaskPriority
                    )
                  }
                  disabled={
                    !canEditTaskDetails
                  }
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70"
                >
                  {priorityOptions.map(
                    (option) => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {option.label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

        

            <div className="grid gap-4 sm:grid-cols-2">

              {/* ASSIGNEE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Assigned To
                </label>

                <div className="relative">
                  <select
                    value={assignedToId}
                    onChange={(event) =>
                      setAssignedToId(
                        event.target.value
                      )
                    }
                    disabled={
                      loadingMembers ||
                      !canEditTaskDetails
                    }
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70"
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {members.map(
                      (member) => (
                        <option
                          key={
                            member.userId
                          }
                          value={
                            member.userId
                          }
                        >
                          {
                            member.user
                              .firstName
                          }{" "}
                          {
                            member.user
                              .lastName
                          }
                        </option>
                      )
                    )}
                  </select>

                  <User className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                {loadingMembers && (
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Loading project
                    members...
                  </p>
                )}
              </div>

              {/* DUE DATE */}

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Due Date
                </label>

                <div className="relative">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) =>
                      setDueDate(
                        event.target.value
                      )
                    }
                    disabled={
                      !canEditTaskDetails
                    }
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70"
                  />

                  <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            </div>


            <section>
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Reporter
                    </p>

                    <p className="mt-1 text-sm font-semibold text-card-foreground">
                      {task.createdBy
                        ? `${task.createdBy.firstName} ${task.createdBy.lastName}`
                        : "Unknown"}
                    </p>

                    {task.createdBy
                      ?.email && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {
                          task.createdBy
                            .email
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </section>

        

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-card-foreground">
                  Attachments
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {attachments.length}{" "}
                  file
                  {attachments.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              {canUploadAttachment && (
                <label
                  className={`inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground transition ${
                    attachmentUploading
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer hover:opacity-90"
                  }`}
                >
                  {attachmentUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}

                  {attachmentUploading
                    ? "Uploading..."
                    : "Add Attachment"}

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
              <div className="space-y-2">
                {attachments.map(
                  (attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Paperclip className="h-4 w-4" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-card-foreground">
                            {attachment.originalName}
                          </p>

                          <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                            <span>
                              {formatFileSize(
                                attachment.fileSize
                              )}
                            </span>

                            <span>•</span>

                            <span>
                              {attachment.uploadedBy
                                ? `Uploaded by ${attachment.uploadedBy.firstName} ${attachment.uploadedBy.lastName}`
                                : "Uploaded"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {/* DOWNLOAD */}
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
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-card-foreground transition hover:bg-muted"
                        >
                          <Download className="h-3.5 w-3.5" />
                         
                        </button>

                       {/* DELETE - REPORTER OR ASSIGNEE ONLY */}
                            {canUploadAttachment && (
                              <button
                                type="button"
                                onClick={() =>
                                  openDeleteAttachmentConfirmation(
                                    attachment.id
                                  )
                                }
                                disabled={
                                  attachmentDeletingId === attachment.id
                                }
                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                              >
                                {attachmentDeletingId === attachment.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <Paperclip className="mx-auto h-5 w-5 text-muted-foreground" />

                <p className="mt-2 text-sm text-muted-foreground">
                  No attachments
                </p>
              </div>
            )}
          </section>
           

            <section>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-card-foreground">
                  Comments
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {comments.length}{" "}
                  {comments.length === 1
                    ? "comment"
                    : "comments"}
                </p>
              </div>

              {commentsLoading ? (
                <div className="rounded-xl border border-border p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Loading comments...
                  </p>
                </div>
              ) : comments.length ===
                0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <MessageCircle className="mx-auto h-5 w-5 text-muted-foreground" />

                  <p className="mt-2 text-sm text-muted-foreground">
                    No comments yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map(
                    (comment) => {
                      const isCommentAuthor =
                        comment.userId ===
                        currentUserId;

                      return (
                        <div
                          key={
                            comment.id
                          }
                          className="rounded-xl border border-border bg-muted/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {comment.user.firstName.charAt(
                                  0
                                )}
                                {comment.user.lastName.charAt(
                                  0
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-sm font-medium text-card-foreground">
                                  {
                                    comment
                                      .user
                                      .firstName
                                  }{" "}
                                  {
                                    comment
                                      .user
                                      .lastName
                                  }

                                  {isCommentAuthor && (
                                    <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                                      You
                                    </span>
                                  )}
                                </p>

                                <p className="text-xs text-muted-foreground">
                                  {new Date(
                                    comment.createdAt
                                  ).toLocaleString()}
                                </p>
                              </div>
                            </div>

                            {/* ONLY COMMENT AUTHOR CAN EDIT/DELETE */}

                            {isCommentAuthor && (
                              <div className="flex items-center gap-1">
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
                                  className="rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
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
                                  className="rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
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
                                onChange={(
                                  event
                                ) =>
                                  setEditingCommentText(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                rows={3}
                                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                                  className="rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
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
                            <p className="mt-3 whitespace-pre-wrap text-sm text-card-foreground">
                              {
                                comment.content
                              }
                            </p>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              )}

              {/* ADD COMMENT */}

              <div className="mt-4">
                <textarea
                  value={newComment}
                  onChange={(event) =>
                    setNewComment(
                      event.target.value
                    )
                  }
                  placeholder="Write a comment..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />

                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={
                      handleAddComment
                    }
                    disabled={
                      commentSubmitting ||
                      !newComment.trim()
                    }
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {commentSubmitting
                      ? "Adding..."
                      : "Add Comment"}
                  </button>
                </div>
              </div>
            </section>

           

            <div className="rounded-xl bg-muted/40 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Created
                  </p>

                  <p className="mt-1 text-sm font-medium text-card-foreground">
                    {formatDate(
                      task.createdAt
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Last Updated
                  </p>

                  <p className="mt-1 text-sm font-medium text-card-foreground">
                    {formatDate(
                      task.updatedAt
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

       

       <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">

              {/* DELETE TASK - REPORTER ONLY */}
              {canDeleteTask && (
                <button
                  type="button"
                  onClick={() =>
                    setShowDeleteTaskConfirmation(true)
                  }
                  disabled={saving}
                  className="mr-auto inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Task
                </button>
              )}

              {/* CLOSE */}
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Close
              </button>

              {/* SAVE */}
              {(canEditTaskDetails || canChangeStatus) && (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}

            </div>
      </div>

     

      {attachmentToDelete && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (!attachmentDeletingId) {
                setAttachmentToDelete(null);
              }
            }
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-semibold text-card-foreground">
                  Delete Attachment
                </h3>

                <p className="mt-2 text-sm text-muted-foreground">
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
                className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setAttachmentToDelete(null)}
                disabled={!!attachmentDeletingId}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
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
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
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
      {/* DELETE TASK CONFIRMATION */}
{showDeleteTaskConfirmation && (
  <div
    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
    onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        if (!saving) {
          setShowDeleteTaskConfirmation(false);
        }
      }
    }}
  >
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">

      <div className="flex items-start gap-4">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
          <Trash2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">

          <h3 className="text-base font-semibold text-card-foreground">
            Delete Task
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Are you sure you want to delete this task?
            This action cannot be undone.
          </p>

        </div>

        <button
          type="button"
          onClick={() =>
            setShowDeleteTaskConfirmation(false)
          }
          disabled={saving}
          className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
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
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDeleteTask}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              Delete Task
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