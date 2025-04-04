import { UserService } from "@/services/user.service";
import { Prisma } from "@prisma/client";
import { Context } from "hono";

const userService = new UserService();

export const getUserById = async (c: Context) => {
  
  const id = c.req.param("id");
  return c.json(await userService.getUserById(id), 200);
};

export const getUsers = async (c: Context) => {
  return c.json(
    await userService.getUsers(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("limit") || "10", 10),
      c.req.query("search"),
      // @ts-expect-error wow
      c.req.query("status") ?? "active"
    ),
    200
  );
};

export const createUser = async (c: Context) => {
  
  try {
    const data = await c.req.json();
    return c.json(await userService.createUser(data), 201);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      
      if (e.code === "P2002") {
        return {
          message: "There is a unique constraint violation",
        };
      }
    }
  }
};

export const updateUser = async (c: Context) => {
  
  const id = c.req.param("id");
  const data = await c.req.json();
  return c.json(await userService.updateUser(id, data), 201);
};
