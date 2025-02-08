import { createUser, getUserById, getUsers, updateUser } from "@/handler/user.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import {
  UserCreateRoute,
  UserGetByRoute,
  UserRoute,
  UserUpdateRoute,
} from "@/schema/z-routes/user.z";
import { OpenAPIHono } from "@hono/zod-openapi";

const user = new OpenAPIHono();

user.use(authMiddleware as never);

user.openapi(UserGetByRoute, getUserById as never);
user.openapi(UserRoute, getUsers as never);
user.openapi(UserCreateRoute, createUser as never);
user.openapi(UserUpdateRoute, updateUser as never);

export default user;
