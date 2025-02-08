import { InventoryService } from "@/services/inventory.service";
import { Context } from "hono";

const inventoryService = new InventoryService();

export const getInventoryById = async (c: Context) => {
  // Get user by id
  const id = c.req.param("id");
  return c.json(await inventoryService.getInventoryById(id), 200);
};

export const getInventories = async (c: Context) => {
  return c.json(
    await inventoryService.getInventories(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("limit") || "10", 10),
      c.req.query("search")
    ),
    200
  );
};

export const createInventory = async (c: Context) => {
  // Create user
  const data = await c.req.json();
  return c.json(await inventoryService.createInventory(data), 201);
};

export const updateInventory = async (c: Context) => {
  // Update user
  const id = c.req.param("id");
  const data = await c.req.json();
  return c.json(await inventoryService.updateInventory(id, data), 201);
};

export const archiveInventory = async (c: Context) => {
    const id = c.req.param("id");
    
    return c.json(await inventoryService.archiveInventory(id), 200);
}

export const unarchiveInventory = async (c: Context) => {
    const id = c.req.param("id");
    
    return c.json(await inventoryService.unarchiveInventory(id), 200);
}
