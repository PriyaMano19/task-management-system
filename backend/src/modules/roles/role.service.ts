import { roleRepository } from "./role.repository";

import {
  CreateRoleDto,
  UpdateRoleDto,
} from "./role.types";

import { AppError } from "../../shared/errors/AppError";

class RoleService {

  
  async getRoles() {
    return roleRepository.findAll();
  }

  
  async getRoleById(id: string) {
    const role =
      await roleRepository.findById(id);

    if (!role) {
      throw new AppError(
        "Role not found.",
        404
      );
    }

    return role;
  }

  
  async createRole(
    data: CreateRoleDto
  ) {
    const existingRole =
      await roleRepository.findByName(
        data.name
      );

    if (existingRole) {
      throw new AppError(
        "A role with this name already exists.",
        409
      );
    }

    return roleRepository.create(
      data
    );
  }

  
  async updateRole(
    id: string,
    data: UpdateRoleDto
  ) {
    const role =
      await roleRepository.findById(
        id
      );

    if (!role) {
      throw new AppError(
        "Role not found.",
        404
      );
    }

    if (data.name) {
      const existingRole =
        await roleRepository.findByName(
          data.name
        );

      if (
        existingRole &&
        existingRole.id !== id
      ) {
        throw new AppError(
          "A role with this name already exists.",
          409
        );
      }
    }

    return roleRepository.update(
      id,
      data
    );
  }


  async deleteRole(id: string) {

    const role =
      await roleRepository.findById(
        id
      );

    if (!role) {
      throw new AppError(
        "Role not found.",
        404
      );
    }

    const dependencies =
      await roleRepository
        .getDependencyCounts(id);

    if (
      dependencies.users > 0 ||
      dependencies.projectMembers > 0
    ) {
      throw new AppError(
        "This role cannot be deleted because it is assigned to users or project members.",
        409
      );
    }

    await roleRepository.delete(id);
  }
}

export const roleService =
  new RoleService();