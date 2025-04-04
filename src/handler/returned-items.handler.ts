import { ReturnedItemsService } from '@/services/returned-items.service';
import { Context } from "hono";

const returnedItemsService = new ReturnedItemsService();

export const getReturnedItems = async (c: Context) => {
    return c.json(
        await returnedItemsService.getReturnedItems(
            parseInt(c.req.query("page") || "1", 10),
            parseInt(c.req.query("limit") || "10", 10),
            c.req.query("search")
        ),
        200
    );
};

export const createReturnedItems = async (c: Context) => {
    const data = await c.req.json();

    return c.json(await returnedItemsService.create(data), 201);
};