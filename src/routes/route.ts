import auth from "./auth.route";
import { OpenAPIHono } from "@hono/zod-openapi";

export const routes = (app: OpenAPIHono) => {
    app.route("/api/auth", auth);
  };