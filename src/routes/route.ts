import { OpenAPIHono } from "@hono/zod-openapi";
import auth from "./auth.route";
import user from "./user.route";
import inventory from "./inventory.route";
import issuance from "./issuance.route";
import endUser from "./end-user.route";

export const routes = (app: OpenAPIHono) => {
  app.route("/api/auth", auth);
  app.route("/api/user", user);
  app.route("/api/inventory", inventory);
  app.route("/api/issuance", issuance);
  app.route("/api/end-user", endUser);
};
