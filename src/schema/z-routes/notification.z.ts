import { createRoute, z } from "@hono/zod-openapi";
import { getNotificationsSchema } from "../notifications.schema";

export const NotificationsRoute = createRoute({
    method: "get",
    path: "/notification",
    tags: ["Notification"],
    request: {
        query: getNotificationsSchema,
    },
    responses: {
        "200": {
            description: "Notification list",
            content: {
                "application/json": {
                    schema: getNotificationsSchema,
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