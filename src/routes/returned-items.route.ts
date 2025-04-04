import { createReturnedItems, getReturnedItems } from "@/handler/returned-items.handler";
import { activityLogMiddleware } from "@/middleware/activity-log.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const returnedItems = new OpenAPIHono();

returnedItems.use(authMiddleware as never);
returnedItems.use(activityLogMiddleware as never)
returnedItems.get('/', getReturnedItems);
returnedItems.post('/', createReturnedItems as never);


export default returnedItems;
