import { createRoute } from "@hono/zod-openapi";

export const LogoutRoute = createRoute({
  method: "get",
  path: "/logout",
  tags: ["Authentication"],
  summary: "User logout endpoint",

  responses: {
    "200": {
      description: "Logout successful",
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
