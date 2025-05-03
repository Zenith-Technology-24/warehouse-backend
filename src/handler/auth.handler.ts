import prisma from "@/generic/prisma";
import type { LoginRequestType } from "@/schema/login.schema";
import type { Context } from "hono";
import argon2 from "argon2";
import { jwtSign } from "@/utils/auth";
import type { User } from "@prisma/client";
import { AuthService } from "@/services/auth.service";

interface UpdateUserRequest {
  username?: string;
  current_password?: string;
  password?: string;
  confirm_password?: string;
  firstname?: string;
  lastname?: string;
}


export const login = async (c: Context) => {
  const data: LoginRequestType = await c.req.json<LoginRequestType>();
  console.log(data);
  const user = await prisma.user.findUnique({
    where: {
      username: data.username
    },
    include: {
      roles: true
    }
  });

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  const verify = await argon2.verify(user.password, data.password);

  if (!verify) {
    return c.json({ error: "User not found" }, 404);
  }

  const token = await jwtSign(user);

  return c.json({
    user: {
      ...user,
      password: undefined,
    },
    token,
  });
};

export const logout = async (c: Context & { user: User; token: string }) => {
  const user = c.user;
  const token: string = c.token;
  const userId = user.id;
  const encodedSecret = token.split(".")[2];
  new AuthService().deleteToken(userId, encodedSecret);
  return c.json({ message: "Logged out successfully" });
};

export const session = async (c: Context & { user: User }) => {
  const user = c.user;
  return c.json({
    user: {
      ...user,
      password: undefined,
    },
  });
};



export const updateUser = async (c: Context & { user: User }) => {
  // const currentUser = c.user;
  const currentUser = await prisma.user.findUnique({
    where: {
      id: c.user.id,
    },
    include: {
      roles: true,
    },
  });
  const data: UpdateUserRequest = await c.req.json<UpdateUserRequest>();

  
  if (data.password || data.current_password || data.confirm_password) {
    
    if (!data.current_password || !data.password || !data.confirm_password) {
      return c.json(
        { error: "All password fields are required for password update" },
        400
      );
    }

    
    const isValidPassword = await argon2.verify(
      currentUser?.password  || "",
      data.current_password
    );
    if (!isValidPassword) {
      return c.json({ error: "Current password is incorrect" }, 400);
    }

    
    if (data.password !== data.confirm_password) {
      return c.json({ error: "New passwords do not match" }, 400);
    }

    
    data.password = await argon2.hash(data.password);
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        username: data.username,
        password: data.password,
        lastname: data.lastname,
        firstname: data.firstname,
      },
      include: {
        roles: true,
      },
    });

    return c.json({
      user: {
        ...updatedUser,
        password: undefined,
      },
    });
  } catch (error) {
    return c.json(
      { message: "Failed to update user. Username or email might already exist", error },
      400
    );
  }
};