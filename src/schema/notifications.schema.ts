import { z } from "@hono/zod-openapi";

export const getNotificationsSchema = z.object({
    userId: z.string().optional()
});