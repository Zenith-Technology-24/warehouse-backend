import {
  archiveInventory,
  createInventory,
  getInventories,
  getInventoryById,
  unarchiveInventory,
  updateInventory,
} from "@/handler/inventory.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import {
  ArchiveInventoryRoute,
  InventoryCreateRoute,
  InventoryGetByRoute,
  InventoryRoute,
  InventoryUpdateRoute,
  UnArchiveInventory,
} from "@/schema/z-routes/inventory.z";
import { OpenAPIHono } from "@hono/zod-openapi";

const inventory = new OpenAPIHono();

inventory.use(authMiddleware as never);
inventory.openapi(InventoryRoute, getInventories as never);
inventory.openapi(InventoryGetByRoute, getInventoryById as never);
inventory.openapi(InventoryCreateRoute, createInventory as never);
inventory.openapi(InventoryUpdateRoute, updateInventory as never);
inventory.openapi(ArchiveInventoryRoute, archiveInventory as never);
inventory.openapi(UnArchiveInventory, unarchiveInventory as never);

export default inventory;
