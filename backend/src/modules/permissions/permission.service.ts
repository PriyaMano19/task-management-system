import { AppError } from "../../shared/errors/AppError";
import { permissionRepository } from "./permission.repository";
import { roleRepository } from "../roles/role.repository";
import { UpdateRolePermissionsDto } from "./permission.types";

class PermissionService {
  async getPermissions() {
    return permissionRepository.findAll();
  }

async getRolePermissions(roleId: string) {
  const role = await roleRepository.findById(roleId);

  if (!role) {
    throw new AppError("Role not found.", 404);
  }

  const rolePermissions =
    await permissionRepository.findRolePermissions(roleId);

  return rolePermissions.map(
    (item) => item.permission
  );
}

  async updateRolePermissions(
    roleId: string,
    data: UpdateRolePermissionsDto
  ) {
    const role = await roleRepository.findById(roleId);

    if (!role) {
      throw new AppError("Role not found.", 404);
    }

    const permissions =
      await permissionRepository.findAll();

    const validPermissionIds = new Set(
      permissions.map(
        (permission) => permission.id
      )
    );

    const invalidPermission =
      data.permissionIds.find(
        (id) => !validPermissionIds.has(id)
      );

    if (invalidPermission) {
      throw new AppError(
        "One or more permissions are invalid.",
        400
      );
    }

    return permissionRepository.replaceRolePermissions(
      roleId,
      data.permissionIds
    );
  }
}

export const permissionService =
  new PermissionService();