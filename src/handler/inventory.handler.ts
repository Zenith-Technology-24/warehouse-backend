import { InventoryService } from "@/services/inventory.service";
import { Context } from "hono";

const inventoryService = new InventoryService();

export const getInventoryById = async (c: Context) => {
  
  const id = c.req.param("id");
  return c.json(await inventoryService.getInventoryById(id), 200);
};

export const getInventories = async (c: Context) => {
  return c.json(
    await inventoryService.getInventories(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("limit") || "10", 10),
      c.req.query("search"),
      c.req.query("status")
    ),
    200
  );
};

export const exportInventory = async (c: Context) => {
    const requestBody = await c.req.json();
    const { start_date, end_date, search, status } = requestBody;
    return c.json(
      await inventoryService.export(
        start_date ?? "", 
        end_date ?? "", 
        status,
        search ?? ""
      ), 200
    );
}

export const createInventory = async (c: Context) => {
  const data = await c.req.json();
  return c.json(await inventoryService.create(data), 201);
};

export const createItemType = async (c: Context) => {
  const data = await c.req.json();
  return c.json(await inventoryService.createItemType(data), 201);
}

export const getItemTypes = async (c: Context) => {
  return c.json(await inventoryService.fetchItemTypes(), 201);
}


export const archiveInventory = async (c: Context) => {
    const id = c.req.param("id");
    
    return c.json(await inventoryService.archiveInventory(id), 200);
}

export const unarchiveInventory = async (c: Context) => {
    const id = c.req.param("id");
    
    return c.json(await inventoryService.unarchiveInventory(id), 200);
}

export const deleteItem = async (c: Context) => {
  const id = c.req.param("id");
  return c.json(await inventoryService.deleteItem(id), 200);
}
