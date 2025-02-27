import {
  archiveInventory,
  createInventory,
  createItemType,
  getInventories,
  getInventoryById,
  getItemTypes,
  unarchiveInventory,
} from "@/handler/inventory.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const inventory = new OpenAPIHono();

inventory.use(authMiddleware as never);
inventory.post('/type', createItemType);
inventory.get('/type', getItemTypes)
inventory.get('/', getInventories as never);
inventory.get('/:id', getInventoryById as never);
inventory.post('/', createInventory as never);

inventory.put('/archive/:id', archiveInventory);
inventory.put('/unarchive/:id', unarchiveInventory);

export default inventory;
