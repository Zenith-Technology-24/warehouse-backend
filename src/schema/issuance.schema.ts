import { z } from "@hono/zod-openapi";


const issuanceInventoryItemSchema = z.object({
  id: z.string().optional(),
  item_name: z.string().optional(),
  location: z.string().optional(),
  supplier: z.string().optional(),
  quantity: z.number().optional(),
  price: z.union([z.string(), z.number()]).optional(),
  amount: z.union([z.string(), z.number()]).optional(),
  status: z.enum(["active", "archived"]).default("active"),
  unit: z.string().default("sets"),
  size: z.string().nullable().optional(),
  item_type_id: z.string().optional(), // Added to match Prisma schema
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});


const issuanceEndUserSchema = z.object({
  id: z.string({
    required_error: "End user ID is required",
  }),
  name: z.string().optional(),
  items: z
    .array(issuanceInventoryItemSchema)
    .min(1, "At least one item is required"),
});


export const issuanceCore = {
  directive_no: z.string({
    required_error: "Directive number is required",
  }).optional(),
  document_no: z.string({
    required_error: "Document number is required",
  }).optional(),
  expiry_date: z.string({
    required_error: "Expiry date is required",
  }).optional(),
  endUsers: z
    .array(issuanceEndUserSchema)
    .min(1, "At least one end user is required").optional(),
};


export const createIssuanceSchema = z.object({
  status: z.enum(["pending", "withdrawn", "archived"]).default("pending"),
  ...issuanceCore,
});


export const updateIssuanceSchema = z.object({
  status: z.enum(["pending", "withdrawn", "archived"]).default("pending"),
  ...issuanceCore,
});

export const getIssuanceBySchema = z.object({
  id: z.string({
    required_error: "Issuance ID is required",
  }),
});

export const getAllIssuancesSchema = z.object({
  limit: z.string().optional(),
  page: z.string().optional(),
  search: z.string().optional(),
  status: z.string().optional(),
});


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
        name: z.string().optional(),
      }),
      items: z.array(
        z.object({
          id: z.string(),
          quantity: z.number(),
          inventory: z.object({
            id: z.string(),
            itemName: z.string(),
            quantity: z.union([z.string(), z.number()]),
            price: z.union([z.string(), z.number()]),
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


export const getIssuanceSchema = z.object({
  data: z.array(issuanceResponseSchema),
  total: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
});


export type CreateIssuanceInput = z.TypeOf<typeof createIssuanceSchema>;
export type UpdateIssuanceInput = z.TypeOf<typeof updateIssuanceSchema>;
export type GetIssuanceInput = z.TypeOf<typeof getIssuanceSchema>;
export type GetAllIssuancesInput = z.TypeOf<typeof getAllIssuancesSchema>;
