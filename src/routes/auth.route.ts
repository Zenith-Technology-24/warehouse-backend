import { login, logout, session, updateUser } from "@/handler/auth.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const auth = new OpenAPIHono();

auth.post('login', login as never);

auth.use(authMiddleware as never)
auth.get('/logout', logout as never);
auth.get('/session', session as never);
auth.put('/update', updateUser as never)

export default auth;
