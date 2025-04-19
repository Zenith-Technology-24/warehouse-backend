import { fetchDashboard } from "@/handler/dashboard.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const dashboard = new OpenAPIHono();

dashboard.use(authMiddleware as never)
dashboard.get('/', fetchDashboard as never);

export default dashboard;