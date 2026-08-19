"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  permissionApi,
  Permission,
} from "@/features/permission/permission.api";

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface RolePermissionsModalProps {
  role: Role | null;
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function RolePermissionsModal({
  role,
  open,
  onClose,
  onSaved,
}: RolePermissionsModalProps) {
  const [permissions, setPermissions] = useState<
    Permission[]
  >([]);

  const [selectedPermissionIds, setSelectedPermissionIds] =
    useState<Set<string>>(new Set());

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expandedModules, setExpandedModules] =
    useState<Set<string>>(new Set());

  // ============================================================
  // LOAD PERMISSIONS
  // ============================================================

  useEffect(() => {
    if (!open || !role) {
      return;
    }

    const loadPermissions = async () => {
      try {
        setLoading(true);

        const [
          allPermissions,
          rolePermissions,
        ] = await Promise.all([
          permissionApi.getAll(),
          permissionApi.getRolePermissions(role.id),
        ]);

        setPermissions(allPermissions);

        setSelectedPermissionIds(
          new Set(
            rolePermissions.map(
              (permission) => permission.id
            )
          )
        );

        // Expand all modules initially
        setExpandedModules(
          new Set(
            allPermissions.map(
              (permission) => permission.module
            )
          )
        );
      } catch (error) {
        console.error(
          "Failed to load role permissions:",
          error
        );

        toast.error(
          "Failed to load role permissions."
        );
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [open, role]);

  // ============================================================
  // GROUP PERMISSIONS
  // ============================================================

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<
      Record<string, Permission[]>
    >((groups, permission) => {
      if (!groups[permission.module]) {
        groups[permission.module] = [];
      }

      groups[permission.module].push(permission);

      return groups;
    }, {});
  }, [permissions]);

  // ============================================================
  // TOGGLE MODULE
  // ============================================================

  const toggleModule = (module: string) => {
    setExpandedModules((current) => {
      const next = new Set(current);

      if (next.has(module)) {
        next.delete(module);
      } else {
        next.add(module);
      }

      return next;
    });
  };

  // ============================================================
  // TOGGLE PERMISSION
  // ============================================================

  const togglePermission = (
    permissionId: string
  ) => {
    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }

      return next;
    });
  };

  // ============================================================
  // SELECT ALL MODULE PERMISSIONS
  // ============================================================

  const toggleModulePermissions = (
    modulePermissions: Permission[]
  ) => {
    setSelectedPermissionIds((current) => {
      const next = new Set(current);

      const allSelected =
        modulePermissions.every((permission) =>
          next.has(permission.id)
        );

      modulePermissions.forEach((permission) => {
        if (allSelected) {
          next.delete(permission.id);
        } else {
          next.add(permission.id);
        }
      });

      return next;
    });
  };

  // ============================================================
  // SAVE
  // ============================================================

  const handleSave = async () => {
    if (!role) {
      return;
    }

    try {
      setSaving(true);

      await permissionApi.updateRolePermissions(
        role.id,
        {
          permissionIds: Array.from(
            selectedPermissionIds
          ),
        }
      );

      toast.success(
        "Role permissions updated successfully."
      );

      onSaved?.();
      onClose();
    } catch (error) {
      console.error(
        "Failed to update role permissions:",
        error
      );

      toast.error(
        "Failed to update role permissions."
      );
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // DON'T RENDER
  // ============================================================

  if (!open || !role) {
    return null;
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">

        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Manage Permissions
              </h2>

              <p className="text-sm text-muted-foreground">
                Configure permissions for{" "}
                <span className="font-medium text-foreground">
                  {role.name}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-[350px] items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading permissions...
              </div>
            </div>
          ) : permissions.length === 0 ? (
            <div className="flex min-h-[350px] items-center justify-center text-sm text-muted-foreground">
              No permissions available.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedPermissions).map(
                ([module, modulePermissions]) => {
                  const isExpanded =
                    expandedModules.has(module);

                  const selectedCount =
                    modulePermissions.filter(
                      (permission) =>
                        selectedPermissionIds.has(
                          permission.id
                        )
                    ).length;

                  const allSelected =
                    selectedCount ===
                    modulePermissions.length;

                  return (
                    <div
                      key={module}
                      className="overflow-hidden rounded-xl border border-border bg-card"
                    >
                      {/* MODULE HEADER */}

                      <div className="flex items-center justify-between px-4 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            toggleModule(module)
                          }
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}

                          <span className="text-sm font-semibold text-foreground">
                            {module
                              .replaceAll("_", " ")
                              .replace(
                                /\b\w/g,
                                (letter) =>
                                  letter.toUpperCase()
                              )}
                          </span>

                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                            {selectedCount}/
                            {modulePermissions.length}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleModulePermissions(
                              modulePermissions
                            )
                          }
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          {allSelected
                            ? "Clear all"
                            : "Select all"}
                        </button>
                      </div>

                      {/* PERMISSIONS */}

                      {isExpanded && (
                        <div className="border-t border-border bg-muted/20 p-4">
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {modulePermissions.map(
                              (permission) => {
                                const checked =
                                  selectedPermissionIds.has(
                                    permission.id
                                  );

                                return (
                                  <button
                                    key={
                                      permission.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      togglePermission(
                                        permission.id
                                      )
                                    }
                                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                                      checked
                                        ? "border-primary/40 bg-primary/5"
                                        : "border-border bg-card hover:bg-muted"
                                    }`}
                                  >
                                    <span
                                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                                        checked
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-input bg-background"
                                      }`}
                                    >
                                      {checked && (
                                        <Check className="h-3.5 w-3.5" />
                                      )}
                                    </span>

                                    <span className="min-w-0">
                                      <span className="block text-sm font-medium text-foreground">
                                        {permission.action
                                          .replaceAll(
                                            "_",
                                            " "
                                          )
                                          .replace(
                                            /\b\w/g,
                                            (
                                              letter
                                            ) =>
                                              letter.toUpperCase()
                                          )}
                                      </span>

                                      {permission.description && (
                                        <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                                          {
                                            permission.description
                                          }
                                        </span>
                                      )}
                                    </span>
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-4">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {selectedPermissionIds.size}
            </span>{" "}
            permissions selected
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={loading || saving}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}