"use client";

import { useEffect, useState } from "react";
import { Folder, X } from "lucide-react";
import api from "@/services/api";

interface FolderModalProps {
  open: boolean;
  projectId: string;
  mode: "create" | "edit";
  folderId?: string | null;
  initialName?: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function FolderModal({
  open,
  projectId,
  mode,
  folderId,
  initialName = "",
  onClose,
  onSaved,
}: FolderModalProps) {
  const [name, setName] = useState(initialName);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initialName);
      setError("");
    }
  }, [open, initialName]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (!name.trim()) {
      setError("Folder name is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (mode === "create") {
        await api.post(
          `/projects/${projectId}/folders`,
          {
            name: name.trim(),
          }
        );
      } else {
        if (!folderId) {
          setError("Folder ID is missing.");
          return;
        }

        await api.put(
          `/projects/${projectId}/folders/${folderId}`,
          {
            name: name.trim(),
          }
        );
      }

      onSaved();
      onClose();
    } catch (error: any) {
      console.error(
        "Failed to save folder:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to save folder."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* Header */}

        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Folder className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {mode === "create"
                  ? "Create Folder"
                  : "Edit Folder"}
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                {mode === "create"
                  ? "Create a new project folder."
                  : "Update the folder name."}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 p-6">

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Folder Name
                <span className="ml-1 text-destructive">
                  *
                </span>
              </label>

              <input
                autoFocus
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                placeholder="e.g. Support Tickets"
                className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                loading ||
                !name.trim()
              }
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : mode === "create"
                  ? "Create Folder"
                  : "Save Changes"}
            </button>

          </div>
        </form>
      </div>
    </div>
  );
}