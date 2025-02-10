import { z } from "@hono/zod-openapi";
import { inventoryIssuanceSchema } from "./inventory.schema";

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
  is_archived: z.boolean().default(false),
  inventoryItems: z.array(inventoryIssuanceSchema),
};

// Create Issuance Schema
export const createIssuanceSchema = z.object({
  ...issuanceCore,
});

// Update Issuance Schema
export const updateIssuanceSchema = z.object({
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
});

// get the response
export const getIssuanceSchema = z.object({
  data: z.array(z.object({...issuanceCore})),
  total: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});

// Types
export type CreateIssuanceInput = z.TypeOf<typeof createIssuanceSchema>;
export type UpdateIssuanceInput = z.TypeOf<typeof updateIssuanceSchema>;
export type GetIssuanceInput = z.TypeOf<typeof getIssuanceSchema>;
export type GetAllIssuancesInput = z.TypeOf<typeof getAllIssuancesSchema>;
