import { ReturnedItemsService } from '@/services/returned-items.service';
import { Context } from "hono";

const returnedItemsService = new ReturnedItemsService();

export const getReturnedItems = async (c: Context) => {
    return c.json(
        await returnedItemsService.getReturnedItems(
            parseInt(c.req.query("page") || "1", 10),
            parseInt(c.req.query("limit") || "10", 10),
            c.req.query("search"),
            c.req.query("status")
        ),
        200
    );
};

export const createReturnedItems = async (c: Context) => {
    const data = await c.req.json();

    return c.json(await returnedItemsService.create(data), 201);
};

export const updateReturnedItems = async (c: Context) => {
    const id = c.req.param("id");
    const data = await c.req.json();
    return c.json(await returnedItemsService.update(id, data), 200);
};

export const getOneReturnedItem = async (c: Context) => {
    const id = c.req.param("id");
    return c.json(await returnedItemsService.findOne(id), 200)
}