import { createReturnedItems, exportReturnedItems, getOneReturnedItem, getReturnedItems, updateReturnedItems } from "@/handler/returned-items.handler";
import { activityLogMiddleware } from "@/middleware/activity-log.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const returnedItems = new OpenAPIHono();

returnedItems.use(authMiddleware as never);
returnedItems.use(activityLogMiddleware as never)
returnedItems.get('/', getReturnedItems);
returnedItems.post('/', createReturnedItems as never);
returnedItems.put('/:id', updateReturnedItems as never);
returnedItems.get('/:id', getOneReturnedItem);
returnedItems.post('/export', exportReturnedItems as never);

export default returnedItems;
