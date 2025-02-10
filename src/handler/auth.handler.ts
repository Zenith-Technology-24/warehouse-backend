import prisma from "@/generic/prisma";
import type { LoginRequestType } from "@/schema/login.schema";
import type { Context } from "hono";
import argon2 from "argon2";
import { jwtSign } from "@/utils/auth";
import type { User } from "@prisma/client";
import { AuthService } from "@/services/auth.service";

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
