import { userRepository } from "./user.repository";
import { roleRepository } from "../roles/role.repository";
import {
  CreateUserDto,
  UpdateUserDto,
} from "./user.types";
import bcrypt from "bcrypt";
import { AppError } from "../../shared/errors/AppError";
class UserService {
  async getUsers() {
    return userRepository.findAll();
  }

  async getUserById(id: string) {
    return userRepository.findById(id);
  }
 async createUser(data: CreateUserDto) {

    const existingUser =
      await userRepository.findByEmail(
        data.email
      );

    if (existingUser) {
      throw new AppError(
        "A user with this email already exists.",
        409
      );
    }

    const role =
      await roleRepository.findById(
        data.roleId
      );

    if (!role) {
      throw new AppError(
        "Role not found.",
        404
      );
    }

    const hashedPassword =
      await bcrypt.hash(
        data.password,
        12
      );

    return userRepository.create({
      ...data,
      password: hashedPassword,
    });
  }


  async updateUser(
    id: string,
    data: UpdateUserDto
  ) {
    const existingUser =
      await userRepository.findById(
        id
      );

    if (!existingUser) {
      throw new AppError(
        "User not found.",
        404
      );
    }

    // Check email uniqueness
    if (data.email) {
      const userWithEmail =
        await userRepository.findByEmail(
          data.email
        );

      if (
        userWithEmail &&
        userWithEmail.id !== id
      ) {
        throw new AppError(
          "A user with this email already exists.",
          409
        );
      }
    }

    // Check role
    if (data.roleId) {
      const role =
        await roleRepository.findById(
          data.roleId
        );

      if (!role) {
        throw new AppError(
          "Role not found.",
          404
        );
      }
    }

    const updateData: UpdateUserDto & {
      password?: string;
    } = {
      ...data,
    };

    // Hash new password only when supplied
    if (data.password) {
      updateData.password =
        await bcrypt.hash(
          data.password,
          12
        );
    }

    return userRepository.update(
      id,
      updateData
    );
  }


  async deleteUser(id: string) {

    const user =
      await userRepository.findById(
        id
      );

    if (!user) {
      throw new AppError(
        "User not found.",
        404
      );
    }

    const dependencies =
      await userRepository
        .getDependencyCounts(id);

    const hasDependencies =
      Object.values(
        dependencies
      ).some(
        (count) => count > 0
      );

    if (hasDependencies) {
      throw new AppError(
        "This user cannot be deleted because they are associated with existing projects or tasks.",
        409
      );
    }

    await userRepository.delete(id);
  }
}

export const userService =
  new UserService();