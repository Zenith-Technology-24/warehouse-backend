import { z } from "@hono/zod-openapi";

const returnedItemsResponseSchema = z.object({
    id: z.string(),
    itemName: z.string(),
    returned_date_time: z.string(),
    personnel: z.string(),
    notes: z.string(),
    created_at: z.string(),
    updated_at: z.string(),
});

export const getAllReturnedItemsSchema = z.object({
    limit: z.string().optional(),
    page: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
});

export const getReturnedItemsSchema = z.object({
    data: z.array(returnedItemsResponseSchema),
    total: z.number(),
    currentPage: z.number(),
    totalPages: z.number(),
});