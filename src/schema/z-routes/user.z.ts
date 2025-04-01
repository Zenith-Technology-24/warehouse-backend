import { createRoute } from "@hono/zod-openapi";
import {
  userCreateSchema,
  userGetByIdSchema,
  userGetUsersResponseSchema,
  userGetUsersSchema,
  userSchema,
  userUpdateSchema,
} from "../user.schema";

export const UserRoute = createRoute({
  method: "get",
  path: "/users",
  tags: ["User"],
  request: {
    query: userGetUsersSchema,
  },
  responses: {
    "200": {
      description: "User list",
      content: {
        "application/json": {
          schema: userGetUsersResponseSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});

export const UserGetByRoute = createRoute({
  method: "get",
  path: "/users/{id}",
  tags: ["User"],
  request: {
    params: userGetByIdSchema,
  },
  responses: {
    "200": {
      description: "User by id",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});

export const UserCreateRoute = createRoute({
  method: "post",
  path: "/users",
  tags: ["User"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: userCreateSchema,
        },
      },
    },
  },
  responses: {
    "201": {
      description: "User created",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});

export const UserUpdateRoute = createRoute({
  method: "put",
  path: "/users/{id}",
  tags: ["User"],
  request: {
    params: userGetByIdSchema,
    body: {
      content: {
        "application/json": {
          schema: userUpdateSchema,
        },
      },
    },
  },
  responses: {
    "201": {
      description: "User created",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});
