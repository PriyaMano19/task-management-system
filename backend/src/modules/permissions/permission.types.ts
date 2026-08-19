export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  description?: string | null;
}

export interface RolePermission {
  permissionId: string;
}

export interface UpdateRolePermissionsDto {
  permissionIds: string[];
}