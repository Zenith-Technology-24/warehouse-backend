import { z } from "@hono/zod-openapi";

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(z.array(z.string())),
  createdAt: z.date(),
  updatedAt: z.date(),
});
