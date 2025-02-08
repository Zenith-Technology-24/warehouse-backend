import prisma from "@/generic/prisma";
import { UserService } from "@/services/user.service";
import { Context } from "hono";

const userService = new UserService();

export const getUserById = async (c: Context) => {
  // Get user by id
  const id = c.req.param("id");
  return c.json(await userService.getUserById(id), 200);
};

export const getUsers = async (c: Context) => {
  return c.json(
    await userService.getUsers(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("pageSize") || "10", 10),
      c.req.query("search")
    ),
    200
  );
};

export const createUser = async (c: Context) => {
  // Create user
  const data = await c.req.json();
  return c.json(await userService.createUser(data), 201);
};

export const updateUser = async (c: Context) => {
  // Update user
  const id = c.req.param("id");
  const data = await c.req.json();
  return c.json(await userService.updateUser(id, data), 201);
};
