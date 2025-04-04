import { createRoute, z } from "@hono/zod-openapi";
import { getAllReturnedItemsSchema, getReturnedItemsSchema } from "../returned-items.schema";

export const ReturnedItemsRoute = createRoute({
    method: "get",
    path: "/returned-items",
    tags: ["ReturnedItems"],
    request: {
        query: getAllReturnedItemsSchema,
    },
    responses: {
        "200": {
            description: "Returned item list",
            content: {
                "application/json": {
                    schema: getReturnedItemsSchema,
                },
            },
        },
    },
    security: [
        {
            Bearer: [],
        },
    ],
});