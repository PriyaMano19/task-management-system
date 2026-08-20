"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  message: string;

  confirmText?: string;
  cancelText?: string | null;

  variant?: "danger" | "primary";

  loading?: boolean;

  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel();
        }
      }}
    >
      <div
        className="
          w-full max-w-md
          rounded-2xl
          border border-border
          bg-card
          shadow-2xl
        "
      >
        {/* Header */}

        <div className="flex items-start justify-between border-b border-border p-6">

          <div className="flex items-start gap-4">

            <div
              className={`
                flex h-11 w-11 shrink-0
                items-center justify-center
                rounded-xl
                ${
                  variant === "danger"
                    ? "bg-red-500/10 text-red-600 dark:text-red-400"
                    : "bg-primary/10 text-primary"
                }
              `}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                {title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {message}
              </p>
            </div>

          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="
              rounded-lg
              p-2
              text-muted-foreground
              transition
              hover:bg-muted
              hover:text-foreground
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <X className="h-4 w-4" />
          </button>

        </div>

        {/* Actions */}

        <div className="flex justify-end gap-3 p-6">

       {cancelText !== null && (
                <button
                    type="button"
                    disabled={loading}
                    onClick={onCancel}
                    className="
                    rounded-xl
                    border border-border
                    px-5 py-2.5
                    text-sm font-medium
                    text-card-foreground
                    transition
                    hover:bg-muted
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                    "
                >
                    {cancelText}
                </button>
                )}

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`
              rounded-xl
              px-5 py-2.5
              text-sm font-medium
              text-white
              transition
              disabled:cursor-not-allowed
              disabled:opacity-60
              ${
                variant === "danger"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-primary hover:opacity-90"
              }
            `}
          >
            {loading ? "Please wait..." : confirmText}
          </button>

        </div>

      </div>
    </div>
  );
}