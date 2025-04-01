/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/generic/prisma";
import { UserGetUsersResponse } from "@/schema/user.schema";
import { Role, User } from "@prisma/client";
import argon2 from "argon2";

const statusTable: { [key in "active" | "deactivated"]: string } = {
  active: "active",
  deactivated: "inactive",
};
export class UserService {
  
  async getUserById(
    id: string
  ): Promise<Omit<User, "password"> & { roles: Role[] }> {
    const user = await prisma.user.findFirst({
      
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
      select: {
        username: true,
        roles: true,
        email: true,
        id: true,
        firstname: true,
        lastname: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async getUsers(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: keyof typeof statusTable
  ): Promise<UserGetUsersResponse> {
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
        where: {
          ...where,
          status: status ? statusTable[status] : "active",
        } as never,
        skip,
        take: pageSize,
        select: {
          username: true,
          roles: true,
          email: true,
          id: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          updatedAt: true,
          status: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.user.count({ where: where as any }),
    ]);

    return {
      // @ts-expect-error malformed types
      data: users,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async createUser(
    data: Omit<User, "id" | "createdAt" | "updatedAt" | "roles"> & {
      role: string;
      confirm_password: string;
    }
  ): Promise<
    (Omit<User, "password"> & { roles: Role[] }) | { message: string }
  > {
    try {
      const role = await prisma.role.findUniqueOrThrow({
        where: {
          name: data.role,
        },
      });

      if (data.password !== data.confirm_password) {
        throw new Error("Password and confirm password do not match");
      }

      
      data.password = await argon2.hash(data.password);

      
      const newData = {
        ...data,
        confirm_password: undefined,
        role: undefined,
      };

      return await prisma.user.create({
        data: {
          ...newData,
          email: `${newData.firstname.toLocaleLowerCase()}.${newData.lastname.toLocaleLowerCase()}@wisce.com`,
          username: data.username,
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
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async updateUser(
    id: string,
    data: Omit<User, "id" | "createdAt" | "updatedAt" | "roles"> & {
      role: string;
      confirm_password: string;
    }
  ): Promise<(Omit<User, "password"> & { roles: Role[] }) | null> {
    const userExists = await prisma.user.findUnique({
      where: { id },
    });

    if (!userExists) {
      return null;
    }

    if (data.password && data.password !== "") {
      
      if (data.password !== data.confirm_password) {
        throw new Error("Password and confirm password do not match");
      }
      data.password = await argon2.hash(data.password);
    }

    const newData = {
      ...data,
      role: undefined,
      password: data.password ? data.password : undefined,
      confirm_password: undefined,
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
        createdAt: true,
        updatedAt: true,
        roles: true,
      },
    });
  }
}
