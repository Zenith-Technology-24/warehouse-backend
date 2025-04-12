import { OpenAPIHono } from "@hono/zod-openapi";
import auth from "./auth.route";
import user from "./user.route";
import inventory from "./inventory.route";
import issuance from "./issuance.route";
import endUser from "./end-user.route";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { HTTPException } from "hono/http-exception";
import { Context } from "vm";
import receipt from "./receipt.route";
import activityLog from "./activity-log.route";
import returnedItems from "./returned-items.route";
import notification from "./notification.route";

const errorHandler = async (err: Error, c: Context) => {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json({
      message: err.message,
      status: err.status
    }, err.status);
  }

  if (err instanceof PrismaClientKnownRequestError) {
    const field = Array.isArray(err.meta?.target)
      ? (err.meta?.target as string[]).join(', ')
      : err.meta?.target as string;
    switch (err.code) {
      case 'P2002':
        return c.json({
          message: `A record with this ${field} already exists`,
          field: field,
          code: err.code
        }, 400);
      case 'P2025':
        return c.json({
          message: 'Record not found',
          details: err.meta,
          code: err.code
        }, 404);
      default:
        return c.json({
          message: 'Database error',
          code: err.code,
          details: err.message
        }, 400);
    }
  }

  return c.json({
    message: err.message || 'Something went wrong',
    status: 500,
    stack: err.stack
  }, 500);
};

export const routes = (app: OpenAPIHono) => {
  app.onError(errorHandler);
  app.route("/api/auth", auth);
  app.route("/api/user", user);
  app.route("/api/inventory", inventory);
  app.route("/api/issuance", issuance);
  app.route("/api/end-user", endUser);
  app.route("/api/receipt", receipt);
  app.route("/api/activity-log", activityLog);
  app.route("/api/returned-items", returnedItems);
  app.route("/api/notification", notification);
};
