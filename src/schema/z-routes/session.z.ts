import { createRoute } from "@hono/zod-openapi";
import { updateUserRequestSchema, userSchema } from "../user.schema";
import { z } from "zod";

export const SessionRoute = createRoute({
  method: "get",
  path: "/session",
  tags: ["Authentication"],
  summary: "Get session information",

  responses: {
    "200": {
      description: "Session information",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
    "401": {
      description: "Authentication failed",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              message: { type: "string" },
            },
          },
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

export const UpdateUserRoute = createRoute({
  method: "put",
  path: "/user/update",
  tags: ["Authentication"],
  summary: "Update authenticated user information",
  description: "Update user profile including optional password change",
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateUserRequestSchema,
        },
      },
    },
  },
  responses: {
    "200": {
      description: "User updated successfully",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
    "400": {
      description: "Validation error",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
    },
    "401": {
      description: "Unauthorized",
      content: {
        "application/json": {
          schema: z.object({
            error: z.string(),
          }),
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