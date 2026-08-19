import { api } from "@/services/api";

export interface Permission {
  id: string;
  module: string;
  action: string;
  name: string;
  description?: string | null;
}

export interface UpdateRolePermissionsRequest {
  permissionIds: string[];
}

export const permissionApi = {
  getAll: async (): Promise<Permission[]> => {
    const response = await api.get("/permissions");

    return response.data.data;
  },

  getRolePermissions: async (
    roleId: string
  ): Promise<Permission[]> => {
    const response = await api.get(
      `/permissions/roles/${roleId}`
    );

    return response.data.data;
  },

  updateRolePermissions: async (
    roleId: string,
    data: UpdateRolePermissionsRequest
  ): Promise<Permission[]> => {
    const response = await api.put(
      `/permissions/roles/${roleId}`,
      data
    );

    return response.data.data;
  },
};