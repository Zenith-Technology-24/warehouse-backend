import { createRoute } from "@hono/zod-openapi";
import { userSchema } from "../user.schema";

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
