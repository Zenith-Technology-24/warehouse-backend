import { login } from "@/handler/auth.handler";
import { LoginRoute } from "@/schema/login.schema";
import { OpenAPIHono } from "@hono/zod-openapi";

const auth = new OpenAPIHono();

auth.openapi(LoginRoute, login as never);

export default auth;