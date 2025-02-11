import { createRoute, z } from "@hono/zod-openapi";

export const EndUserRoute = createRoute({
  method: "get",
  path: "/end-users",
  summary: "Get all end users",
  tags: ["End User"],
  responses: {
    "201": {
      description: "Issuance created",
      content: {
        "application/json": {
          schema: z.object({
            data: z.array(z.object({
              name: z.string(),
              id: z.string(),
            })),
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
