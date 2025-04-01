import { z } from "@hono/zod-openapi";
import { issuanceCore } from "./issuance.schema";
import { inventoryIssuanceSchema } from "./inventory.schema";

export const endUserSchema = z.object({
    name: z.string().optional(),
    issuance: z.array(z.object({
        ...issuanceCore
    })),
    inventory: z.array(inventoryIssuanceSchema),
});

export const getEndUserSchema = z.object({
    id: z.string({
        required_error: "End user ID is required",
    }),
});

export const getAllEndUsersSchema = z.object({
    limit: z.string().optional(),
    page: z.string().optional(),
    search: z.string().optional(),
});

export const getEndUsersSchema = z.object({
    data: z.array(endUserSchema),
    total: z.number(),
    currentPage: z.number(),
    totalPages: z.number(),
});

export type CreateEndUserInput = z.TypeOf<typeof endUserSchema>;
export type GetEndUserInput = z.TypeOf<typeof getEndUserSchema>;
export type GetAllEndUsersInput = z.TypeOf<typeof getAllEndUsersSchema>;