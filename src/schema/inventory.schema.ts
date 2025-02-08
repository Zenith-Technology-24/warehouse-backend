import { z } from "@hono/zod-openapi";

export const inventorySchema = z.object({
  id: z.string().optional(),
  item_name: z.string(),
  location: z.string(),
  supplier: z.string(),
  quantity: z.number(),
  price: z.number(),
  amount: z.number(),
  status: z.enum(["WITHDRAWN", "PENDING", "ACTIVE", "INACTIVE"]).default("PENDING"),
  size: z.string().nullable(),
  isArchived: z.boolean().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const createInventorySchema = z.object({
  item_name: z.string(),
  location: z.string(),
  supplier: z.string(),
  quantity: z.number(),
  price: z.number(),
  amount: z.number(),
  status: z.enum(["WITHDRAWN", "PENDING", "ACTIVE", "INACTIVE"]).default("PENDING"),
  size: z.string().nullable(),
});

export const inventoryGetSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
});

export const inventoryGetByIdSchema = z.object({
  id: z.string(),
});

export const updateInventorySchema = z.object({
  item_name: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  amount: z.number().optional(),
  status: z.enum(["WITHDRAWN", "PENDING"]).default("PENDING"),
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
