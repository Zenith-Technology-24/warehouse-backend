import { OpenAPIHono } from "@hono/zod-openapi";
import auth from "./auth.route";
import user from "./user.route";

export const routes = (app: OpenAPIHono) => {
  app.route("/api/auth", auth);
  app.route("/api/user", user);
};
