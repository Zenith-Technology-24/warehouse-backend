import { z } from "@hono/zod-openapi";
import { RoleSchema } from "./role.schema";

export const userSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstname: z.string(),
  username: z.string().nullable(),
  lastname: z.string(),
  roles: z.array(RoleSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

export const userGetByIdSchema = z.object({
  id: z.string(),
});

export const userGetUsersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const userGetUsersResponseSchema = z.object({
  data: z.array(userSchema),
  total: z.number(),
  currentPage: z.number(),
  totalPages: z.number()
});

export const userCreateSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  username: z.string(),
  password: z.string(),
  confirm_password: z.string(),
  role: z.string(),
});

export const userUpdateSchema = z.object({
  firstname: z.string().optional(),
  lastname: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

// Create type from schema
export type User = z.infer<typeof userSchema>;
export type UserGetById = z.infer<typeof userGetByIdSchema>;
export type UserGetUsers = z.infer<typeof userGetUsersSchema>;
export type UserGetUsersResponse = z.infer<typeof userGetUsersResponseSchema>;
export type UserCreate = z.infer<typeof userCreateSchema>;

