"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Shield,
  ShieldCheck,
  X,
  AlertTriangle,
  Loader2,
  Users,
} from "lucide-react";

import api from "@/services/api";
import RolePermissionsModal from "@/components/roles/RolePermissionsModal";

interface Role {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;

  _count?: {
    users?: number;
  };
}

interface RoleResponse {
  success: boolean;
  message?: string;
  data?: Role[];
}

interface RoleForm {
  name: string;
  description: string;
}

const initialForm: RoleForm = {
  name: "",
  description: "",
};

export default function RolesPage() {
 
  const [permissionRole, setPermissionRole] =
    useState<Role | null>(null);

  const [permissionModalOpen, setPermissionModalOpen] =
    useState(false);


  const [roles, setRoles] =
    useState<Role[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [search, setSearch] =
    useState("");

  const [menuId, setMenuId] =
    useState<string | null>(null);

 
  const [showFormModal, setShowFormModal] =
    useState(false);

  const [editingRole, setEditingRole] =
    useState<Role | null>(null);

  const [form, setForm] =
    useState<RoleForm>(initialForm);


  const [deleteRole, setDeleteRole] =
    useState<Role | null>(null);


  const openPermissions = (role: Role) => {
    setMenuId(null);
    setPermissionRole(role);
    setPermissionModalOpen(true);
  };

  const closePermissions = () => {
    setPermissionModalOpen(false);
    setPermissionRole(null);
  };


  const fetchRoles = useCallback(
    async () => {
      try {
        setLoading(true);
        setError(null);

        const response =
          await api.get<RoleResponse>(
            "/roles"
          );

        if (!response.data.success) {
          throw new Error(
            response.data.message ||
              "Failed to load roles."
          );
        }

        setRoles(
          response.data.data || []
        );
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            (err instanceof Error
              ? err.message
              : "Failed to load roles.")
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );


  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);


  const filteredRoles = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return roles;
    }

    return roles.filter(
      (role) =>
        role.name
          .toLowerCase()
          .includes(value) ||
        role.description
          ?.toLowerCase()
          .includes(value)
    );
  }, [roles, search]);


  const totalUsers = roles.reduce(
    (total, role) =>
      total +
      (role._count?.users ?? 0),
    0
  );


  const openCreateModal = () => {
    setEditingRole(null);
    setForm(initialForm);
    setError(null);
    setShowFormModal(true);
    setMenuId(null);
  };


  const openEditModal = (
    role: Role
  ) => {
    setEditingRole(role);

    setForm({
      name: role.name,
      description:
        role.description || "",
    });

    setError(null);
    setShowFormModal(true);
    setMenuId(null);
  };


  const closeFormModal = () => {
    if (saving) {
      return;
    }

    setShowFormModal(false);
    setEditingRole(null);
    setForm(initialForm);
  };

 
  const updateForm = (
    field: keyof RoleForm,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };


  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError(
        "Role name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.post("/roles", {
        name:
          form.name.trim(),

        description:
          form.description.trim() ||
          null,
      });

      setForm(initialForm);
      setShowFormModal(false);

      await fetchRoles();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create role."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleUpdate = async () => {
    if (!editingRole) {
      return;
    }

    if (!form.name.trim()) {
      setError(
        "Role name is required."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.put(
        `/roles/${editingRole.id}`,
        {
          name:
            form.name.trim(),

          description:
            form.description.trim() ||
            null,
        }
      );

      setForm(initialForm);
      setEditingRole(null);
      setShowFormModal(false);

      await fetchRoles();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update role."
      );
    } finally {
      setSaving(false);
    }
  };

 
  const handleSubmit = async () => {
    if (editingRole) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };


  const openDeleteConfirmation = (
    role: Role
  ) => {
    setDeleteRole(role);
    setMenuId(null);
    setError(null);
  };


  const handleDelete = async () => {
    if (!deleteRole) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);

      await api.delete(
        `/roles/${deleteRole.id}`
      );

      setDeleteRole(null);

      await fetchRoles();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete role."
      );

      setDeleteRole(null);
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="min-h-[calc(100vh-120px)] space-y-5">

  
      <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* TITLE */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-card-foreground sm:text-2xl">
                Roles
              </h1>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage system roles and access levels.
              </p>
            </div>

          </div>

          {/* STATISTICS */}

          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 sm:flex">

              <Shield className="h-4 w-4 text-primary" />

              <div>
                <p className="text-[10px] text-muted-foreground">
                  Total Roles
                </p>

                <p className="text-sm font-semibold">
                  {roles.length}
                </p>
              </div>

            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 md:flex">

              <Users className="h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-[10px] text-muted-foreground">
                  Assigned Users
                </p>

                <p className="text-sm font-semibold">
                  {totalUsers}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Role
            </button>

          </div>

        </div>
      </div>

   
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

        {/* SEARCH */}

        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="relative w-full max-w-xl">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search roles..."
              className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />

            {search && (
              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}

          </div>

          {!loading && (
            <p className="text-xs text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {filteredRoles.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {roles.length}
              </span>{" "}
              roles
            </p>
          )}

        </div>

        {/* ERROR */}

        {error && (
          <div className="m-4 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">

            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>
              {error}
            </span>

            <button
              type="button"
              onClick={() =>
                setError(null)
              }
              className="ml-auto"
            >
              <X className="h-4 w-4" />
            </button>

          </div>
        )}

        <div className="overflow-x-auto">

          <table className="w-full min-w-[850px]">

            <thead>
              <tr className="border-b border-border bg-muted/30">

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Description
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Users
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissions
                </th>

                <th className="w-16 px-5 py-3" />

              </tr>
            </thead>

            <tbody>

              {/* LOADING */}

              {loading ? (
                Array.from({
                  length: 6,
                }).map((_, index) => (
                  <tr
                    key={index}
                    className="border-b border-border"
                  >
                    <td
                      colSpan={5}
                      className="px-5 py-4"
                    >
                      <div className="h-10 animate-pulse rounded-lg bg-muted" />
                    </td>
                  </tr>
                ))
              ) : filteredRoles.length === 0 ? (

                /* EMPTY */

                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center"
                  >
                    <Shield className="mx-auto h-10 w-10 text-muted-foreground/40" />

                    <p className="mt-3 text-sm font-medium">
                      No roles found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Try another search term.
                    </p>
                  </td>
                </tr>

              ) : (

                /* DATA */

                filteredRoles.map(
                  (role) => (
                    <tr
                      key={role.id}
                      className="border-b border-border last:border-0 transition hover:bg-muted/20"
                    >

                      {/* ROLE */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Shield className="h-4 w-4" />
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-card-foreground">
                              {role.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted-foreground">
                              System role
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* DESCRIPTION */}

                      <td className="max-w-md px-5 py-4">

                        <p className="line-clamp-2 text-sm text-muted-foreground">
                          {role.description ||
                            "No description"}
                        </p>

                      </td>

                      {/* USERS */}

                      <td className="px-5 py-4">

                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium">

                          <Users className="h-3.5 w-3.5" />

                          {role._count?.users ??
                            0}{" "}
                          {(
                            role._count?.users ??
                            0
                          ) === 1
                            ? "user"
                            : "users"}

                        </span>

                      </td>

                      {/* PERMISSIONS */}

                      <td className="px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            openPermissions(role)
                          }
                          className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Manage Permissions
                        </button>

                      </td>

                      {/* ACTION */}

                      <td className="relative px-5 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            setMenuId(
                              menuId ===
                                role.id
                                ? null
                                : role.id
                            )
                          }
                          className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {menuId ===
                          role.id && (
                          <div className="absolute right-5 top-12 z-30 w-48 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">

                            {/* PERMISSIONS */}

                            <button
                              type="button"
                              onClick={() =>
                                openPermissions(
                                  role
                                )
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                            >
                              <ShieldCheck className="h-4 w-4" />
                              Permissions
                            </button>

                            {/* EDIT */}

                            <button
                              type="button"
                              onClick={() =>
                                openEditModal(
                                  role
                                )
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                            >
                              <Pencil className="h-4 w-4" />
                              Edit
                            </button>

                            {/* DELETE */}

                            <button
                              type="button"
                              onClick={() =>
                                openDeleteConfirmation(
                                  role
                                )
                              }
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete
                            </button>

                          </div>
                        )}

                      </td>

                    </tr>
                  )
                )
              )}

            </tbody>

          </table>

        </div>

      </div>

      {showFormModal && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !saving
            ) {
              closeFormModal();
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-border px-6 py-5">

              <div>

                <h2 className="text-lg font-semibold text-card-foreground">
                  {editingRole
                    ? "Edit Role"
                    : "Create Role"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {editingRole
                    ? "Update the role information."
                    : "Define a new system role."}
                </p>

              </div>

              <button
                type="button"
                disabled={saving}
                onClick={closeFormModal}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

            {/* FORM */}

            <div className="space-y-5 p-6">

              {/* ROLE NAME */}

              <div>

                <label className="text-xs font-medium">
                  Role Name
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </label>

                <input
                  value={form.name}
                  onChange={(e) =>
                    updateForm(
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="e.g. Project Manager"
                  className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

              </div>

              {/* DESCRIPTION */}

              <div>

                <label className="text-xs font-medium">
                  Description
                </label>

                <textarea
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    updateForm(
                      "description",
                      e.target.value
                    )
                  }
                  placeholder="Describe what this role can do..."
                  rows={4}
                  className="mt-1.5 w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

              </div>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">

              <button
                type="button"
                disabled={saving}
                onClick={closeFormModal}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  saving ||
                  !form.name.trim()
                }
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >

                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? editingRole
                    ? "Updating..."
                    : "Creating..."
                  : editingRole
                    ? "Update Role"
                    : "Create Role"}

              </button>

            </div>

          </div>

        </div>
      )}

   
      {deleteRole && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !deleting
            ) {
              setDeleteRole(null);
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">

            {/* ICON */}

            <div className="px-6 pt-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>

            </div>

            {/* CONTENT */}

            <div className="px-6 py-5">

              <h2 className="text-lg font-semibold text-card-foreground">
                Delete Role?
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">

                Are you sure you want to delete the{" "}

                <span className="font-semibold text-foreground">
                  {deleteRole.name}
                </span>{" "}
                role?

                <br />

                This action cannot be undone.

              </p>

              {(deleteRole._count?.users ??
                0) > 0 && (
                <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-600 dark:text-amber-400">

                  This role currently has{" "}
                  <strong>
                    {deleteRole._count?.users}
                  </strong>{" "}
                  assigned user
                  {(
                    deleteRole._count?.users ??
                    0
                  ) === 1
                    ? ""
                    : "s"}
                  . The role cannot be deleted until those users are reassigned.

                </div>
              )}

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteRole(null)
                }
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={handleDelete}
                className="flex items-center gap-2 rounded-xl bg-destructive px-5 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
              >

                {deleting && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete Role"}

              </button>

            </div>

          </div>

        </div>
      )}

   
      <RolePermissionsModal
        role={permissionRole}
        open={permissionModalOpen}
        onClose={closePermissions}
        onSaved={fetchRoles}
      />

    </div>
  );
}