"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UserPlus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import api from "@/services/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: string;

  role: {
    id: string;
    name: string;
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

    role?: {
      id: string;
      name: string;
    };
  };

  role?: {
    id: string;
    name: string;
  };
}

interface ProjectMembersModalProps {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onMembersChanged?: () => void;
}

export default function ProjectMembersModal({
  projectId,
  open,
  onClose,
  onMembersChanged,
}: ProjectMembersModalProps) {
  const [members, setMembers] = useState<
    ProjectMember[]
  >([]);

  const [users, setUsers] = useState<User[]>([]);
const [memberToRemove, setMemberToRemove] =
  useState<ProjectMember | null>(null);
  const [selectedUserId, setSelectedUserId] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [adding, setAdding] =
    useState(false);

  const [removingId, setRemovingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState<string | null>(null);


  const fetchMembers = useCallback(async () => {
    const response = await api.get(
      `/projects/${projectId}/members`
    );

    setMembers(
      response.data?.data ?? []
    );
  }, [projectId]);


  const fetchUsers = useCallback(async () => {
    const response = await api.get(
      "/users"
    );

    setUsers(
      response.data?.data ?? []
    );
  }, []);


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchMembers(),
        fetchUsers(),
      ]);
    } catch (error: any) {
      console.error(
        "Failed to load project members:",
        error
      );

      setError(
        error?.response?.data?.message ||
          "Failed to load project members."
      );
    } finally {
      setLoading(false);
    }
  }, [
    fetchMembers,
    fetchUsers,
  ]);

  useEffect(() => {
    if (!open) {
      return;
    }

    loadData();
  }, [open, loadData]);


  const resetSelection = () => {
    setSelectedUserId("");
    setError(null);
  };


 const handleAddMember = async () => {
  if (!selectedUserId) {
    setError("Please select a user.");
    return;
  }

  const selectedUser = users.find(
    (user) => user.id === selectedUserId
  );

  if (!selectedUser) {
    setError("Selected user could not be found.");
    return;
  }

  if (!selectedUser.role?.id) {
    setError(
      "The selected user does not have a role assigned."
    );
    return;
  }

  try {
    setAdding(true);
    setError(null);

    await api.post(
      `/projects/${projectId}/members`,
      {
        userId: selectedUser.id,
        roleId: selectedUser.role.id,
      }
    );

    resetSelection();

    await fetchMembers();

    onMembersChanged?.();

  } catch (error: any) {
    console.error(
      "Failed to add project member:",
      error
    );

    setError(
      error?.response?.data?.message ||
        "Failed to add project member."
    );
  } finally {
    setAdding(false);
  }
};


const handleRemoveMember = async (
  member: ProjectMember
) => {
  try {
    setRemovingId(member.id);
    setError(null);

    await api.delete(
      `/projects/${projectId}/members/${member.userId}`
    );

    await fetchMembers();

    onMembersChanged?.();

    setMemberToRemove(null);
  } catch (error: any) {
    console.error(
      "Failed to remove project member:",
      error
    );

    setError(
      error?.response?.data?.message ||
        "Failed to remove project member."
    );
  } finally {
    setRemovingId(null);
  }
};

  if (!open) {
    return null;
  }

  // Don't show users who are already members.
  const memberIds = new Set(
    members.map(
      (member) => member.userId
    )
  );

  const availableUsers = users.filter(
    (user) => !memberIds.has(user.id)
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">

      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

        {/* ======================================================
            HEADER
        ====================================================== */}

        <div className="flex items-center justify-between border-b border-border px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-card-foreground">
                Project Members
              </h2>

              <p className="mt-0.5 text-xs text-muted-foreground">
                Manage the members working on this project.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* ======================================================
            CONTENT
        ====================================================== */}

        <div className="overflow-y-auto p-6">

          {error && (
            <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* ====================================================
              ADD MEMBER
          ==================================================== */}

          <div className="rounded-2xl border border-border bg-muted/20 p-5">

            <div className="flex items-center gap-2">

              <UserPlus className="h-4 w-4 text-primary" />

              <h3 className="text-sm font-semibold text-card-foreground">
                Add Member
              </h3>

            </div>

            <div className="mt-4">

              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                User
              </label>

              <select
                value={selectedUserId}
                onChange={(event) =>
                  setSelectedUserId(
                    event.target.value
                  )
                }
                disabled={
                  loading || adding
                }
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Select user
                </option>

                {availableUsers.map(
                  (user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.firstName}{" "}
                      {user.lastName}{" "}
                      — {user.role.name}
                    </option>
                  )
                )}
              </select>

            </div>

            <div className="mt-4 flex justify-end">

              <button
                type="button"
                disabled={
                  adding ||
                  !selectedUserId
                }
                onClick={handleAddMember}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlus className="h-4 w-4" />

                {adding
                  ? "Adding..."
                  : "Add Member"}
              </button>

            </div>

          </div>

          {/* ====================================================
              CURRENT MEMBERS
          ==================================================== */}

          <div className="mt-6">

            <div className="mb-3 flex items-center justify-between">

              <h3 className="text-sm font-semibold text-card-foreground">
                Current Members
              </h3>

              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {members.length}
              </span>

            </div>

            {loading ? (
              <div className="space-y-3">

                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-16 animate-pulse rounded-xl bg-muted"
                    />
                  )
                )}

              </div>
            ) : members.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">

                <Users className="mx-auto h-7 w-7 text-muted-foreground" />

                <p className="mt-3 text-sm font-medium text-card-foreground">
                  No project members
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Add a member using the form above.
                </p>

              </div>
            ) : (
              <div className="space-y-2">

                {members.map(
                  (member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4"
                    >

                      {/* USER INFO */}

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {member.user.firstName
                            .charAt(0)
                            .toUpperCase()}

                          {member.user.lastName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-medium text-card-foreground">
                            {member.user.firstName}{" "}
                            {member.user.lastName}
                          </p>

                          <p className="truncate text-xs text-muted-foreground">
                            {member.user.email}
                          </p>

                        </div>

                      </div>

                      {/* SYSTEM ROLE + REMOVE */}

                      <div className="flex shrink-0 items-center gap-3">

                        {member.user.role?.name && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            {member.user.role.name}
                          </span>
                        )}

                        <button
                          type="button"
                          title="Remove member"
                          disabled={
                            removingId ===
                            member.id
                          }
                         onClick={() =>
                                setMemberToRemove(member)
                                }
                          className="rounded-lg p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>

                      </div>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

        {/* ======================================================
            FOOTER
        ====================================================== */}

        <div className="flex justify-end border-t border-border px-6 py-4">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted"
          >
            Close
          </button>

        </div>

      </div>
      {memberToRemove && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">

      <div className="flex items-start gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Trash2 className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-card-foreground">
            Remove Project Member?
          </h3>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Are you sure you want to remove{" "}
            <span className="font-medium text-foreground">
              {memberToRemove.user.firstName}{" "}
              {memberToRemove.user.lastName}
            </span>{" "}
            from this project?
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            They will no longer be able to access tasks
            assigned through this project.
          </p>
        </div>

      </div>

      <div className="mt-6 flex justify-end gap-3">

        <button
          type="button"
          onClick={() =>
            setMemberToRemove(null)
          }
          disabled={removingId !== null}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:bg-muted disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={() =>
            handleRemoveMember(
              memberToRemove
            )
          }
          disabled={removingId !== null}
          className="inline-flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />

          {removingId !== null
            ? "Removing..."
            : "Remove Member"}
        </button>

      </div>

    </div>
  </div>
)}
    </div>
  );
}