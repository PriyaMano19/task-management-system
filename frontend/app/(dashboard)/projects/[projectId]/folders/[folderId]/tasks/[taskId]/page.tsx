"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";

import api from "@/services/api";
import { RootState } from "@/store";

import TaskDetailsModal from "@/components/tasks/TaskDetailsModal";

interface Task {
  id: string;
  folderId: string;
  title: string;
  description?: string | null;

  status:
    | "TODO"
    | "IN_PROGRESS"
    | "HOLD"
    | "DONE";

  priority:
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "URGENT";

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

  attachments?: any[];
}

export default function TaskPage() {

  const params = useParams();
  const router = useRouter();

  const projectId = params.projectId as string;
  const folderId = params.folderId as string;
  const taskId = params.taskId as string;

  /*
   * Get the logged-in user from Redux
   */
  const {
    user,
    isAuthenticated,
    initialized,
    loading: authLoading,
  } = useSelector(
    (state: RootState) => state.auth
  );

  const [task, setTask] =
    useState<Task | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  /*
   * ----------------------------------------------------------
   * LOAD TASK
   * ----------------------------------------------------------
   */

  const loadTask = async () => {

    try {

      setLoading(true);
      setError(null);

      const response = await api.get(
        `/projects/${projectId}/folders/${folderId}/tasks/${taskId}`
      );

      const taskData =
        response.data?.data;

      if (!taskData) {
        throw new Error(
          "Task not found."
        );
      }

      setTask(taskData);

    } catch (error: any) {

      console.error(
        "Failed to load task:",
        error
      );

      setError(
        error?.response?.data?.message ||
        "Failed to load task."
      );

    } finally {

      setLoading(false);

    }
  };


  /*
   * ----------------------------------------------------------
   * LOAD AFTER AUTHENTICATION
   * ----------------------------------------------------------
   */

  useEffect(() => {

    /*
     * Don't load the task until authentication
     * has finished initializing.
     */
    if (!initialized || authLoading) {
      return;
    }

    /*
     * ProtectedRoute should normally handle
     * this case, but keep this guard here too.
     */
    if (!isAuthenticated || !user) {
      return;
    }

    if (
      !projectId ||
      !folderId ||
      !taskId
    ) {
      return;
    }

    loadTask();

  }, [
    initialized,
    authLoading,
    isAuthenticated,
    user,
    projectId,
    folderId,
    taskId,
  ]);


  /*
   * ----------------------------------------------------------
   * AUTH LOADING
   * ----------------------------------------------------------
   */

  if (
    !initialized ||
    authLoading
  ) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="text-sm text-muted-foreground">
          Loading...
        </div>

      </div>
    );
  }


  /*
   * ----------------------------------------------------------
   * TASK LOADING
   * ----------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">

        <div className="text-sm text-muted-foreground">
          Loading task...
        </div>

      </div>
    );
  }


  /*
   * ----------------------------------------------------------
   * ERROR
   * ----------------------------------------------------------
   */

  if (error || !task) {

    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">

        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">

          <h2 className="text-lg font-semibold text-card-foreground">
            Task not found
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            {error ||
              "The requested task could not be found."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                `/projects/${projectId}`
              )
            }
            className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Go Back
          </button>

        </div>

      </div>
    );
  }


  /*
   * ----------------------------------------------------------
   * TASK DETAILS
   * ----------------------------------------------------------
   */

  return (
    <TaskDetailsModal
      task={task}
      open={true}
      projectId={projectId}

      /*
       * THIS IS THE IMPORTANT CHANGE
       */
      currentUserId={
        user?.id ?? null
      }

      /*
       * Close the task page and return
       * to the project.
       */
      onClose={() =>
        router.push(
          `/projects/${projectId}`
        )
      }

      /*
       * Reload task after update.
       */
      onUpdated={loadTask}
    />
  );
}