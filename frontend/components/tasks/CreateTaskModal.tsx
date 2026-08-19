"use client";

import { useEffect, useState } from "react";
import {
  X,
  Upload,
  FileText,
  User,
  CalendarDays,
} from "lucide-react";
import api from "@/services/api";

interface ProjectMember {
  id: string;
  userId: string;

  user: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };

  role?: {
    id: string;
    name: string;
  };
}

interface CreateTaskModalProps {
  open: boolean;
  projectId: string;
  folderId: string;
  onClose: () => void;
  onCreated: () => void;
}

const statuses = [
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

const priorities = [
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

export default function CreateTaskModal({
  open,
  projectId,
  folderId,
  onClose,
  onCreated,
}: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");

  const [status, setStatus] =
    useState("TODO");

  const [priority, setPriority] =
    useState("MEDIUM");

  const [assignedToId, setAssignedToId] =
    useState("");

  const [dueDate, setDueDate] =
    useState("");

  const [members, setMembers] =
    useState<ProjectMember[]>([]);

  const [loadingMembers, setLoadingMembers] =
    useState(false);

  const [files, setFiles] =
    useState<File[]>([]);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


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


  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("TODO");
    setPriority("MEDIUM");
    setAssignedToId("");
    setDueDate("");
    setFiles([]);
    setError("");
  };

  const handleClose = () => {
    if (submitting) {
      return;
    }

    resetForm();
    onClose();
  };


  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFiles =
      Array.from(
        event.target.files ?? []
      );

    setFiles((currentFiles) => [
      ...currentFiles,
      ...selectedFiles,
    ]);

    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((currentFiles) =>
      currentFiles.filter(
        (_, fileIndex) =>
          fileIndex !== index
      )
    );
  };

  const formatFileSize = (
    bytes: number
  ) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(
        bytes / 1024
      ).toFixed(1)} KB`;
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


  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Task title is required.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const formData = new FormData();

      formData.append(
        "title",
        title.trim()
      );

      if (description.trim()) {
        formData.append(
          "description",
          description.trim()
        );
      }

      formData.append(
        "status",
        status
      );

      formData.append(
        "priority",
        priority
      );

      if (assignedToId) {
        formData.append(
          "assignedToId",
          assignedToId
        );
      }

      if (dueDate) {
        formData.append(
          "dueDate",
          new Date(
            `${dueDate}T00:00:00`
          ).toISOString()
        );
      }

      files.forEach((file) => {
        formData.append(
          "attachments",
          file
        );
      });

      await api.post(
        `/projects/${projectId}/folders/${folderId}/tasks`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      resetForm();
      onCreated();
      onClose();

    } catch (error: any) {
      console.error(
        "Failed to create task:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to create task."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="flex items-center justify-between border-b border-border px-6 py-5">

          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Create Task
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Create a new task for this folder.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* =====================================================
            BODY
        ===================================================== */}

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto"
        >
          <div className="space-y-6 p-6">

            {/* ERROR */}

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* TITLE */}

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Task Title
                <span className="ml-1 text-destructive">
                  *
                </span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Enter task title"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
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
                placeholder="Describe the task..."
                rows={4}
                className="w-full resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* STATUS + PRIORITY */}

            <div className="grid gap-4 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Status
                </label>

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {statuses.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-card-foreground">
                  Priority
                </label>

                <select
                  value={priority}
                  onChange={(event) =>
                    setPriority(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {priorities.map(
                    (item) => (
                      <option
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
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
                      setAssignedToId(
                        event.target.value
                      )
                    }
                    disabled={
                      loadingMembers
                    }
                    className="w-full appearance-none rounded-xl border border-input bg-background px-4 py-3 pr-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
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
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />

                </div>
              </div>

            </div>

            {/* ATTACHMENTS */}

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Attachments
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-foreground">

                <Upload className="h-5 w-5" />

                <span>
                  Click to upload files
                </span>

                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={
                    handleFileChange
                  }
                />

              </label>

              {files.length > 0 && (
                <div className="mt-3 space-y-2">

                  {files.map(
                    (file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3"
                      >

                        <div className="flex min-w-0 items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <FileText className="h-4 w-4" />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-medium text-card-foreground">
                              {file.name}
                            </p>

                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(
                                file.size
                              )}
                            </p>

                          </div>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFile(
                              index
                            )
                          }
                          className="shrink-0 rounded-lg px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                        >
                          Remove
                        </button>

                      </div>
                    )
                  )}

                </div>
              )}
            </div>

          </div>

          {/* ===================================================
              FOOTER
          =================================================== */}

          <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">

            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                !title.trim()
              }
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Creating..."
                : "Create Task"}
            </button>

          </div>
        </form>

      </div>
    </div>
  );
}