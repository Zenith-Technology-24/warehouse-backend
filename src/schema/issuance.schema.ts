import { z } from "@hono/zod-openapi";

// Define the inventory item schema for issuance
const issuanceInventoryItemSchema = z.object({
  inventoryId: z.string({
    required_error: "Inventory ID is required",
  }),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  itemName: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.number().optional(),
  price: z.number().optional(),
  amount: z.number().optional(),
  size: z.string().optional(),
  unit: z.enum(["prs", "ea", "sets"]).default("ea"),
  status: z.enum(["active", "archived"]).default("active"),
});

// Define the end user schema for issuance
const issuanceEndUserSchema = z.object({
  id: z.string({
    required_error: "End user ID is required",
  }),
  name: z.string({
    required_error: "End user name is required",
  }),
  items: z
    .array(issuanceInventoryItemSchema)
    .min(1, "At least one item is required"),
});

// Base schema for common issuance fields
export const issuanceCore = {
  directive_no: z.string({
    required_error: "Directive number is required",
  }),
  document_no: z.string({
    required_error: "Document number is required",
  }),
  expiry_date: z.string({
    required_error: "Expiry date is required",
  }),
  endUsers: z
    .array(issuanceEndUserSchema)
    .min(1, "At least one end user is required"),
};

// Create Issuance Schema
export const createIssuanceSchema = z.object({
  status: z.enum(["pending", "withdrawn", "archived"]).default("pending"),
  ...issuanceCore,
});

// Update Issuance Schema
export const updateIssuanceSchema = z.object({
  status: z.enum(["pending", "withdrawn", "archived"]).default("pending"),
  ...issuanceCore,
});

// Get Single Issuance Schema
export const getIssuanceBySchema = z.object({
  id: z.string({
    required_error: "Issuance ID is required",
  }),
});

// Get All Issuances Query Schema
export const getAllIssuancesSchema = z.object({
  limit: z.string().optional(),
  page: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});

// Response schema for a single issuance
const issuanceResponseSchema = z.object({
  id: z.string(),
  directive_no: z.string(),
  document_no: z.string(),
  expiry_date: z.string(),
  status: z.enum(["pending", "withdrawn", "archived"]),
  endUsers: z.array(
    z.object({
      id: z.string(),
      endUser: z.object({
        id: z.string(),
        name: z.string(),
      }),
      items: z.array(
        z.object({
          id: z.string(),
          quantity: z.number(),
          inventory: z.object({
            id: z.string(),
            itemName: z.string(),
            quantity: z.number(),
            price: z.number(),
            unit: z.string(),
          }),
        })
      ),
    })
  ),
  user: z.object({
    id: z.string(),
    firstname: z.string(),
    lastname: z.string(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Get issuance response schema
export const getIssuanceSchema = z.object({
  data: z.array(issuanceResponseSchema),
  total: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});

// Types
export type CreateIssuanceInput = z.TypeOf<typeof createIssuanceSchema>;
export type UpdateIssuanceInput = z.TypeOf<typeof updateIssuanceSchema>;
export type GetIssuanceInput = z.TypeOf<typeof getIssuanceSchema>;
export type GetAllIssuancesInput = z.TypeOf<typeof getAllIssuancesSchema>;
