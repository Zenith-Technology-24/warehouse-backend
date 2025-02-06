/* eslint-disable @typescript-eslint/no-explicit-any */
import { AppDataSource } from "../database/data-source";
import { Role } from "../models/role.entity";
import { User } from "../models/user.entity";
import * as bcrypt from "bcrypt";

export class UserService {
  private userRepository = AppDataSource.getRepository(User);

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async createUser(
    userData: Partial<User> & { confirm_password?: string }
  ): Promise<User> {
    const adminRole = await AppDataSource.getRepository(Role).findOneBy({
      name: "admin",
    });

    if (!userData.firstname || !userData.lastname || !userData.password) {
      throw new Error("Firstname, Lastname and Password is required");
    }

    if (userData.password !== userData.confirm_password) {
      throw new Error("Passwords do not match");
    }

    const user = this.userRepository.create({
      ...userData,
      username: `${String(userData.firstname).trim().toLowerCase()}.${String(
        userData.lastname
      )
        .trim()
        .toLowerCase()}`,
      roles: adminRole ? [adminRole] : [],
    });

    return await this.userRepository.save(user);
  }

  async updateUser(id: number, user: any): Promise<User | null> {
    const existingUser = (await this.userRepository.findOne({
      where: { id },
    })) as any;
    if (!existingUser) {
      return null;
    }
    existingUser.firstname = user.firstname;
    existingUser.lastname = user.lastname;
    existingUser.email = user.email;

    if (user.current_password && user.new_password && user.confirm_password) {
      const isCurrentPasswordCorrect = await bcrypt.compare(
        user.current_password,
        existingUser.password
      );
      if (!isCurrentPasswordCorrect) {
        throw new Error("Current password is incorrect");
      }

      if (user.new_password !== user.confirm_password) {
        throw new Error("New password and confirm password do not match");
      }

      const hashedNewPassword = await bcrypt.hash(user.new_password, 10);
      existingUser.password = hashedNewPassword;
    }

    Object.assign(existingUser, user);

    return this.userRepository.save(existingUser);
  }
}
