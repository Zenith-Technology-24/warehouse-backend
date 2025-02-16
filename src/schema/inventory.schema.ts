import { z } from "@hono/zod-openapi";

export const inventorySchema = z.object({
  id: z.string().optional(),
  item_name: z.string(),
  location: z.string(),
  supplier: z.string(),
  quantity: z.number(),
  price: z.number(),
  amount: z.number(),
  status: z.enum(["active", "archived"]).default("active"),
  unit: z.enum(['prs', 'ea', 'sets']).default('ea'),
  size: z.number().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const inventoryIssuanceSchema = z.object({
  id: z.string().optional(),
  item_name: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.number().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["active", "archived"]).default("active"),
  unit: z.enum(['prs', 'ea', 'sets']).default('ea'),
  size: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});


export const createInventorySchema = z.object({
  item_name: z.string(),
  location: z.string(),
  supplier: z.string(),
  quantity: z.number(),
  price: z.union([z.string(), z.number()]),
  amount: z.union([z.string(), z.number()]),
  status: z.enum(["active", "archived"]).default("active"),
  unit: z.enum(['prs', 'ea', 'sets']).default('ea').optional(),
  size: z.string().nullable(),
});

export const inventoryGetSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

export const inventoryGetByIdSchema = z.object({
  id: z.string(),
});

export const updateInventorySchema = z.object({
  item_name: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.number().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["active", "archived"]).default("active"),
  unit: z.enum(['prs', 'ea', 'sets']).default('ea'),
  size: z.string().nullable().optional(),
});


export const getInventorySchema = z.object({
  data: z.array(inventorySchema),
  total: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});

export type InventoryType = z.infer<typeof inventorySchema>;
export type InventoriesResponseType = z.infer<typeof getInventorySchema>
export type UpdateInventoryInput = Partial<Omit<InventoryType, 'id' | 'createdAt' | 'updatedAt' | 'isArchived'>>;
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
