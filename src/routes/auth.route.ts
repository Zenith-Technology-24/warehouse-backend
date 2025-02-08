import { login, logout, session } from "@/handler/auth.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { LoginRoute } from "@/schema/z-routes/login.z";
import { LogoutRoute } from "@/schema/z-routes/logout.z";
import { SessionRoute } from "@/schema/z-routes/session.z";
import { OpenAPIHono } from "@hono/zod-openapi";

const auth = new OpenAPIHono();

auth.openapi(LoginRoute, login as never);

auth.use(authMiddleware as never)
auth.openapi(LogoutRoute, logout as never);
auth.openapi(SessionRoute, session as never);

export default auth;
