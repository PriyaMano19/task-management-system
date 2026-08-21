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
  Users,
  UserCheck,
  UserX,
  X,
  AlertTriangle,
  Loader2,
} from "lucide-react";

import api from "@/services/api";


interface Role {
  id: string;
  name: string;
  description?: string | null;
  _count?: {
    users: number;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status?: "ACTIVE" | "INACTIVE" | string;
  role?: Role | null;
  createdAt?: string;
}

interface UserResponse {
  success: boolean;
  message?: string;
  data?: User[];
}

interface RoleResponse {
  success: boolean;
  message?: string;
  data?: Role[];
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: string;
  status: "ACTIVE" | "INACTIVE";
}


const initialForm: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  roleId: "",
  status: "ACTIVE",
};


export default function UsersPage() {

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

 
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");


  const [showFormModal, setShowFormModal] =
    useState(false);

  const [editingUser, setEditingUser] =
    useState<User | null>(null);

  const [form, setForm] =
    useState<FormState>(initialForm);


  const [menuId, setMenuId] =
    useState<string | null>(null);


  const [deleteUser, setDeleteUser] =
    useState<User | null>(null);

  const [deleting, setDeleting] =
    useState(false);


  const fetchUsers = useCallback(async () => {
    const response =
      await api.get<UserResponse>("/users");

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Failed to load users."
      );
    }

    setUsers(response.data.data || []);
  }, []);


  const fetchRoles = useCallback(async () => {
    const response =
      await api.get<RoleResponse>("/roles");

    if (!response.data.success) {
      throw new Error(
        response.data.message ||
          "Failed to load roles."
      );
    }

    setRoles(response.data.data || []);
  }, []);


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await Promise.all([
        fetchUsers(),
        fetchRoles(),
      ]);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          (err instanceof Error
            ? err.message
            : "Failed to load users.")
      );
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, fetchRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

 
  const filteredUsers = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return users.filter((user) => {
      const fullName =
        `${user.firstName} ${user.lastName}`
          .toLowerCase();

      const matchesSearch =
        !value ||
        fullName.includes(value) ||
        user.email
          .toLowerCase()
          .includes(value);

      const matchesRole =
        roleFilter === "ALL" ||
        user.role?.id === roleFilter;

      const normalizedStatus =
        user.status?.toUpperCase() ||
        "ACTIVE";

      const matchesStatus =
        statusFilter === "ALL" ||
        normalizedStatus === statusFilter;

      return (
        matchesSearch &&
        matchesRole &&
        matchesStatus
      );
    });
  }, [
    users,
    search,
    roleFilter,
    statusFilter,
  ]);


  const openCreateModal = () => {
    setEditingUser(null);
    setForm(initialForm);
    setError(null);
    setShowFormModal(true);
    setMenuId(null);
  };


  const openEditModal = (user: User) => {
    setEditingUser(user);

    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: "",
      roleId: user.role?.id || "",
      status:
        user.status?.toUpperCase() ===
        "INACTIVE"
          ? "INACTIVE"
          : "ACTIVE",
    });

    setError(null);
    setShowFormModal(true);
    setMenuId(null);
  };

 
  const closeFormModal = () => {
    if (saving) return;

    setShowFormModal(false);
    setEditingUser(null);
    setForm(initialForm);
  };

 
  const updateForm = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

 
  const handleCreate = async () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.password.trim() ||
      !form.roleId
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.post("/users", {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email.trim(),

        password:
          form.password,

        roleId:
          form.roleId,

        status:
          form.status,
      });

      setShowFormModal(false);
      setEditingUser(null);
      setForm(initialForm);

      await fetchUsers();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to create user."
      );
    } finally {
      setSaving(false);
    }
  };

 
  const handleUpdate = async () => {
    if (!editingUser) return;

    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.email.trim() ||
      !form.roleId
    ) {
      setError(
        "Please complete all required fields."
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: {
        firstName: string;
        lastName: string;
        email: string;
        roleId: string;
        status: "ACTIVE" | "INACTIVE";
        password?: string;
      } = {
        firstName:
          form.firstName.trim(),

        lastName:
          form.lastName.trim(),

        email:
          form.email.trim(),

        roleId:
          form.roleId,

        status:
          form.status,
      };

      // Only send password when user entered one
      if (form.password.trim()) {
        payload.password =
          form.password;
      }

      await api.put(
        `/users/${editingUser.id}`,
        payload
      );

      setShowFormModal(false);
      setEditingUser(null);
      setForm(initialForm);

      await fetchUsers();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to update user."
      );
    } finally {
      setSaving(false);
    }
  };

 
  const handleSubmit = async () => {
    if (editingUser) {
      await handleUpdate();
    } else {
      await handleCreate();
    }
  };


  const openDeleteConfirmation = (
    user: User
  ) => {
    setDeleteUser(user);
    setMenuId(null);
    setError(null);
  };

 
  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      setDeleting(true);
      setError(null);

      await api.delete(
        `/users/${deleteUser.id}`
      );

      setDeleteUser(null);

      await fetchUsers();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete user."
      );

      setDeleteUser(null);
    } finally {
      setDeleting(false);
    }
  };


  const getInitials = (user: User) =>
    `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
      .toUpperCase();

  const activeCount =
    users.filter(
      (user) =>
        !user.status ||
        user.status.toUpperCase() ===
          "ACTIVE"
    ).length;

  const inactiveCount =
    users.length - activeCount;


  return (
    <div className="min-h-[calc(100vh-120px)] space-y-5">

   
      <div className="rounded-2xl border border-border bg-card px-6 py-5 shadow-sm">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          {/* TITLE */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-bold text-card-foreground sm:text-2xl">
                Users
              </h1>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Manage users and their system access.
              </p>
            </div>

          </div>

          {/* STATISTICS + BUTTON */}

          <div className="flex items-center gap-3">

            {/* TOTAL */}

            <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 sm:flex">

              <Users className="h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-[10px] text-muted-foreground">
                  Total Users
                </p>

                <p className="text-sm font-semibold">
                  {users.length}
                </p>
              </div>

            </div>

            {/* ACTIVE */}

            <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 md:flex">

              <UserCheck className="h-4 w-4 text-emerald-500" />

              <div>
                <p className="text-[10px] text-muted-foreground">
                  Active
                </p>

                <p className="text-sm font-semibold">
                  {activeCount}
                </p>
              </div>

            </div>

            {/* INACTIVE */}

            <div className="hidden items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 xl:flex">

              <UserX className="h-4 w-4 text-slate-400" />

              <div>
                <p className="text-[10px] text-muted-foreground">
                  Inactive
                </p>

                <p className="text-sm font-semibold">
                  {inactiveCount}
                </p>
              </div>

            </div>

            {/* ADD USER */}

            <button
              type="button"
              onClick={openCreateModal}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>

          </div>

        </div>

      </div>

 
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">

        {/* FILTER BAR */}

        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <input
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search by name or email..."
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

          {/* ROLE FILTER */}

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value
              )
            }
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">
              All Roles
            </option>

            {roles.map((role) => (
              <option
                key={role.id}
                value={role.id}
              >
                {role.name}
              </option>
            ))}
          </select>

          {/* STATUS FILTER */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="ALL">
              All Status
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="INACTIVE">
              Inactive
            </option>
          </select>

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
                  User
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Role
                </th>

                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
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
              ) : filteredUsers.length === 0 ? (

                /* EMPTY */

                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-16 text-center"
                  >

                    <Users className="mx-auto h-10 w-10 text-muted-foreground/40" />

                    <p className="mt-3 text-sm font-medium">
                      No users found
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Try changing your search or filters.
                    </p>

                  </td>
                </tr>

              ) : (

                /* USERS */

                filteredUsers.map(
                  (user) => {

                    const isActive =
                      !user.status ||
                      user.status.toUpperCase() ===
                        "ACTIVE";

                    return (
                      <tr
                        key={user.id}
                        className="border-b border-border last:border-0 transition hover:bg-muted/20"
                      >

                        {/* USER */}

                        <td className="px-5 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                              {getInitials(user)}
                            </div>

                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-card-foreground">
                                {user.firstName}{" "}
                                {user.lastName}
                              </p>

                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {isActive
                                  ? "Active account"
                                  : "Inactive account"}
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* EMAIL */}

                        <td className="px-5 py-4 text-sm text-muted-foreground">
                          {user.email}
                        </td>

                        {/* ROLE */}

                        <td className="px-5 py-4">

                          {user.role ? (
                            <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                              {user.role.name}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No role
                            </span>
                          )}

                        </td>

                        {/* STATUS */}

                        <td className="px-5 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                              isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-slate-500/10 text-slate-500"
                            }`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isActive
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />

                            {isActive
                              ? "Active"
                              : "Inactive"}

                          </span>

                        </td>

                        {/* ACTION */}

                        <td className="relative px-5 py-4">

                          <button
                            type="button"
                            onClick={() =>
                              setMenuId(
                                menuId ===
                                  user.id
                                  ? null
                                  : user.id
                              )
                            }
                            className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>

                          {menuId ===
                            user.id && (
                            <div className="absolute right-5 top-12 z-30 w-36 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-xl">

                              {/* EDIT */}

                              <button
                                type="button"
                                onClick={() =>
                                  openEditModal(
                                    user
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
                                    user
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
                    );
                  }
                )
              )}

            </tbody>

          </table>

        </div>

        {/* FOOTER */}

        {!loading &&
          filteredUsers.length > 0 && (
            <div className="border-t border-border px-5 py-3">

              <p className="text-xs text-muted-foreground">

                Showing{" "}

                <span className="font-medium text-foreground">
                  {filteredUsers.length}
                </span>{" "}

                of{" "}

                <span className="font-medium text-foreground">
                  {users.length}
                </span>{" "}

                users

              </p>

            </div>
          )}

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
                  {editingUser
                    ? "Edit User"
                    : "Create User"}
                </h2>

                <p className="mt-1 text-xs text-muted-foreground">
                  {editingUser
                    ? "Update user information and system access."
                    : "Add a new user to the system."}
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

            <div className="space-y-4 p-6">

              {/* FIRST / LAST */}

              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label className="text-xs font-medium">
                    First Name
                    <span className="ml-1 text-destructive">
                      *
                    </span>
                  </label>

                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      updateForm(
                        "firstName",
                        e.target.value
                      )
                    }
                    placeholder="First name"
                    className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />

                </div>

                <div>

                  <label className="text-xs font-medium">
                    Last Name
                    <span className="ml-1 text-destructive">
                      *
                    </span>
                  </label>

                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      updateForm(
                        "lastName",
                        e.target.value
                      )
                    }
                    placeholder="Last name"
                    className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />

                </div>

              </div>

              {/* EMAIL */}

              <div>

                <label className="text-xs font-medium">
                  Email
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    updateForm(
                      "email",
                      e.target.value
                    )
                  }
                  placeholder="user@example.com"
                  className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

              </div>

              {/* PASSWORD */}

              <div>

                <label className="text-xs font-medium">

                  Password

                  {!editingUser && (
                    <span className="ml-1 text-destructive">
                      *
                    </span>
                  )}

                </label>

                <input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    updateForm(
                      "password",
                      e.target.value
                    )
                  }
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current password"
                      : "Minimum 8 characters"
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />

                {editingUser && (
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Leave blank if you don't want to change the password.
                  </p>
                )}

              </div>

              {/* ROLE */}

              <div>

                <label className="text-xs font-medium">
                  Role
                  <span className="ml-1 text-destructive">
                    *
                  </span>
                </label>

                <select
                  value={form.roleId}
                  onChange={(e) =>
                    updateForm(
                      "roleId",
                      e.target.value
                    )
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >

                  <option value="">
                    Select role
                  </option>

                  {roles.map((role) => (
                    <option
                      key={role.id}
                      value={role.id}
                    >
                      {role.name}
                    </option>
                  ))}

                </select>

              </div>

              {/* STATUS */}

              <div>

                <label className="text-xs font-medium">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    updateForm(
                      "status",
                      e.target.value
                    )
                  }
                  className="mt-1.5 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                >

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                </select>

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
                disabled={saving}
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >

                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}

                {saving
                  ? editingUser
                    ? "Updating..."
                    : "Creating..."
                  : editingUser
                    ? "Update User"
                    : "Create User"}

              </button>

            </div>

          </div>

        </div>
      )}


      {deleteUser && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !deleting
            ) {
              setDeleteUser(null);
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
                Delete User?
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">

                Are you sure you want to delete{" "}

                <span className="font-semibold text-foreground">
                  {deleteUser.firstName}{" "}
                  {deleteUser.lastName}
                </span>
                ?

                <br />

                This action cannot be undone.

              </p>

            </div>

            {/* FOOTER */}

            <div className="flex justify-end gap-3 border-t border-border px-6 py-4">

              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setDeleteUser(null)
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
                  : "Delete User"}

              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}