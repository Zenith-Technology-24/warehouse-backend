import { login, logout, session, updateUser } from "@/handler/auth.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { LoginRoute } from "@/schema/z-routes/login.z";
import { LogoutRoute } from "@/schema/z-routes/logout.z";
import { SessionRoute, UpdateUserRoute } from "@/schema/z-routes/session.z";
import { OpenAPIHono } from "@hono/zod-openapi";

const auth = new OpenAPIHono();

auth.openapi(LoginRoute, login as never);

auth.use(authMiddleware as never)
auth.openapi(LogoutRoute, logout as never);
auth.openapi(SessionRoute, session as never);
auth.openapi(UpdateUserRoute, updateUser as never)

export default auth;
