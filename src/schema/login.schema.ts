import { z } from "@hono/zod-openapi";
import { RoleSchema } from "./role.schema";

export const LoginRequestSchema = z.object({
  username: z.string().min(3).describe("User login username"),
  password: z.string().min(6).describe("User login password"),
});

export const LoginResponseSchema = z.object({
  user: z
    .object({
      id: z.number(),
      username: z.string(),
      role: z.array(RoleSchema),
    })
    .describe("User information"),
  token: z.string().describe("JWT access token"),
});

export type LoginRequestType = z.infer<typeof LoginRequestSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
