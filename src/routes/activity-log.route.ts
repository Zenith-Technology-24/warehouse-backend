import { getActivityLogs, exportActivityLogs } from "@/handler/activity-log.handler";
import { activityLogMiddleware } from "@/middleware/activity-log.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const activityLog = new OpenAPIHono();

activityLog.use(authMiddleware as never)
activityLog.use(activityLogMiddleware as never)
activityLog.get('/', getActivityLogs as never);
activityLog.post('/export', exportActivityLogs as never);
export default activityLog;