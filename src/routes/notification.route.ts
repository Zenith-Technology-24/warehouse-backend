import { deleteAllNotification, deleteNotification, getNotifications, readNotification } from "@/handler/notification.handler";
import { activityLogMiddleware } from "@/middleware/activity-log.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const notification = new OpenAPIHono();

notification.use(authMiddleware as never);
notification.use(activityLogMiddleware as never)
notification.get('/:userId', getNotifications);
notification.put('/:id', readNotification)
notification.delete('/delete/:id', deleteNotification)
notification.delete('delete-all/:userId', deleteAllNotification)

export default notification;
