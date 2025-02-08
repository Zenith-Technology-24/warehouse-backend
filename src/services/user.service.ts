import prisma from "@/generic/prisma";
import { Role, User } from "@prisma/client";
import argon2 from "argon2";
export class UserService {
  // Get user by id
  async getUserById(id: string): Promise<User | null> {
    return await prisma.user.findFirst({
      // Get user by username, email or id
      where: {
        OR: [
          {
            id,
          },
          {
            username: id,
          },
          {
            email: id,
          },
        ],
      },
    });
  }

  async getUsers(
    page: number = 1,
    pageSize: number = 10,
    search?: string
  ): Promise<{ users: User[]; total: number; pages: number }> {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { firstname: { contains: search, mode: "insensitive" } },
            { lastname: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
            { username: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: where as any,
        skip,
        take: pageSize,
        include: {
          roles: true,
        },
        orderBy: {
          firstname: "asc",
        },
      }),
      prisma.user.count({ where: where as any }),
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / pageSize),
    };
  }

  async createUser(
    data: Omit<User, "id" | "createdAt" | "updatedAt" | "roles"> & {
      role: string;
      confirm_password: string;
    }
  ): Promise<Omit<User, "password"> & { roles: Role[] }> {
    const role = await prisma.role.findUniqueOrThrow({
      where: {
        name: data.role,
      },
    });

    if (data.password !== data.confirm_password) {
      throw new Error("Password and confirm password do not match");
    }

    // Hash the password
    data.password = await argon2.hash(data.password);

    // remove confirm_password from the data object
    const newData = {
      ...data,
      confirm_password: undefined,
      role: undefined,
    };

    return await prisma.user.create({
      data: {
        ...newData,
        email: `${newData.firstname.toLocaleLowerCase()}.${newData.lastname.toLocaleLowerCase()}@wisce.com`,
        username: `${newData.firstname.toLocaleLowerCase()}.${newData.lastname.toLocaleLowerCase()}`,
        roles: {
          connect: {
            id: role.id,
          },
        },
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstname: true,
        lastname: true,
        status: true,
        roles: true,
      },
    });
  }

  async updateUser(
    id: string,
    data: Partial<User>
  ): Promise<(Omit<User, "password"> & { roles: Role[] }) | null> {

    if (data.password) {
      // Hash the password
      data.password = await argon2.hash(data.password);
    }

    const newData = {
      ...data,
      role: undefined
    };

    return await prisma.user.update({
      where: {
        id,
      },
      data: {
        ...newData,
      },
      select: {
        id: true,
        username: true,
        email: true,
        firstname: true,
        lastname: true,
        status: true,
        roles: true,
      },
    });
  }
}
