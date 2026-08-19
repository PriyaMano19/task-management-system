"use client";

import {
  CalendarDays,
  MessageCircle,
  Clock3,
  FileText,
  Paperclip,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
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

function formatDate(
  date?: string | null
) {
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

export default function TaskDetailsModal({
  task,
  open,
  projectId,
  onClose,
  onUpdated,
}: TaskDetailsModalProps) {
  const [title, setTitle] =
    useState("");

  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState<TaskStatus>("TODO");

  const [priority, setPriority] =
    useState<TaskPriority>("MEDIUM");

  const [assignedToId, setAssignedToId] =
    useState<string>("");

  const [dueDate, setDueDate] =
    useState("");

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

   const [error, setError] =
    useState<string | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentsLoading, setCommentsLoading] = useState(false);

    const [newComment, setNewComment] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);

    const [editingCommentId, setEditingCommentId] =
      useState<string | null>(null);

    const [editingCommentText, setEditingCommentText] =
      useState("");
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
const handleAddComment = async () => {
  const content = newComment.trim();

  if (!content || !task) {
    return;
  }

  try {
    setCommentSubmitting(true);

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

  try {
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
        current.map((comment) =>
          comment.id === commentId
            ? updatedComment
            : comment
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
  }
};
const handleDeleteComment = async (
  commentId: string
) => {
  if (!task) {
    return;
  }

  try {
    await api.delete(
      `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/comments/${commentId}`
    );

    setComments((current) =>
      current.filter(
        (comment) =>
          comment.id !== commentId
      )
    );
  } catch (error) {
    console.error(
      "Failed to delete comment:",
      error
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

    setError(null);
  }, [task, open]);


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

  const handleSave = async () => {
    if (!task) {
      return;
    }

    if (!title.trim()) {
      setError(
        "Task title is required."
      );

      return;
    }

    try {
      setSaving(true);
      setError(null);

     

      const { default: api } =
        await import("@/services/api");

    const response = await api.put(
  `/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}`,
  {
    title: title.trim(),

    description:
      description.trim() || null,

    status,

    priority,

    assignedToId:
      assignedToId || null,

    dueDate:
      dueDate
        ? new Date(
            `${dueDate}T00:00:00`
          ).toISOString()
        : null,
  }
);

      const updatedTask =
        response.data?.data;

      if (!updatedTask) {
        throw new Error(
          "Updated task was not returned."
        );
      }

      onUpdated();

      onClose();
    } catch (err: any) {
      console.error(
        "Failed to update task:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to update task."
      );
    } finally {
      setSaving(false);
    }
  };


  if (!open || !task) {
    return null;
  }
const formatFileSize = (
  bytes: number
) => {
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
};
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

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex items-start justify-between border-b border-border px-6 py-5">

          <div>

            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Edit Task
            </p>

            <h2 className="text-xl font-bold tracking-tight text-card-foreground">
              Task Details
            </h2>

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

        {/* =====================================================
            BODY
        ===================================================== */}

        <div className="flex-1 overflow-y-auto p-6">

          <div className="space-y-5">

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            {/* TITLE */}

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
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Enter task title"
              />

            </div>

            {/* DESCRIPTION */}

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
                rows={5}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Describe the task..."
              />

            </div>

            {/* STATUS + PRIORITY */}

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
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
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

            {/* ASSIGNEE + DUE DATE */}

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
                        setAssignedToId(event.target.value)
                    }
                    disabled={loadingMembers}
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                    <option value="">
                        Unassigned
                    </option>

                    {members.map((member) => (
                        <option
                        key={member.userId}
                        value={member.userId}
                        >
                        {member.user.firstName}{" "}
                        {member.user.lastName}
                        </option>
                    ))}
                    </select>

                    <User
                    className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    />

                </div>

                {loadingMembers && (
                    <p className="mt-1.5 text-xs text-muted-foreground">
                    Loading project members...
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
                      setDueDate(event.target.value)
                    }
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

              </div>

            </div>
              {/* =================================================
                  ATTACHMENTS
              ================================================= */}

              <section>

                <div className="mb-3 flex items-center justify-between">

                  <div>
                    <h3 className="text-sm font-semibold text-card-foreground">
                      Attachments
                    </h3>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {task.attachments?.length ?? 0} file
                      {(task.attachments?.length ?? 0) !== 1
                        ? "s"
                        : ""}
                    </p>
                  </div>

                </div>

                {task.attachments &&
                task.attachments.length > 0 ? (

                  <div className="space-y-2">

                    {task.attachments.map(
                      (attachment) => (
                        <div
                          key={attachment.id}
                          className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/20 p-4"
                        >

                          {/* FILE INFO */}

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

                          {/* ACTION */}

                          <a
                            href={`${process.env.NEXT_PUBLIC_API_URL}/projects/${projectId}/folders/${task.folderId}/tasks/${task.id}/attachments/${attachment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-lg border border-border px-3 py-2 text-xs font-medium text-card-foreground transition hover:bg-muted"
                          >
                            Download
                          </a>

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
  ) : comments.length === 0 ? (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <MessageCircle className="mx-auto h-5 w-5 text-muted-foreground" />

      <p className="mt-2 text-sm text-muted-foreground">
        No comments yet.
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-xl border border-border bg-muted/20 p-4"
        >
          <div className="flex items-start justify-between gap-3">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {comment.user.firstName
                  .charAt(0)}
                {comment.user.lastName
                  .charAt(0)}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-card-foreground">
                  {comment.user.firstName}{" "}
                  {comment.user.lastName}
                </p>

                <p className="text-xs text-muted-foreground">
                  {new Date(
                    comment.createdAt
                  ).toLocaleString()}
                </p>
              </div>

            </div>

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

          </div>

          {editingCommentId === comment.id ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={editingCommentText}
                onChange={(event) =>
                  setEditingCommentText(
                    event.target.value
                  )
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingCommentId(null);
                    setEditingCommentText("");
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
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-90"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm text-card-foreground">
              {comment.content}
            </p>
          )}
        </div>
      ))}
    </div>
  )}

  <div className="mt-4">
    <textarea
      value={newComment}
      onChange={(event) =>
        setNewComment(event.target.value)
      }
      placeholder="Write a comment..."
      rows={3}
      className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
    />

    <div className="mt-2 flex justify-end">
      <button
        type="button"
        onClick={handleAddComment}
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
            {/* CURRENT INFO */}

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

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : "Save Changes"}
          </button>

        </div>

      </div>
    </div>
  );
}