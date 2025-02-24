import { InventoryService } from "@/services/inventory.service";
import { IssuanceService } from "@/services/issuance.service";
import { User } from "@prisma/client";
import { Context } from "hono";

const issuanceService = new IssuanceService();
const inventoryService = new InventoryService();

export const getIssuanceById = async (c: Context) => {
  
  const id = c.req.param("id");
  return c.json(await issuanceService.getIssuanceById(id), 200);
};

export const getIssuances = async (c: Context) => {
  return c.json(
    await issuanceService.getIssuances(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("limit") || "10", 10),
      c.req.query("search"),
      c.req.query("status")
    ),
    200
  );
};

export const createIssuance = async (c: Context & { user: User }) => {  
  const data = await c.req.json();

  const user = c.user;
  return c.json(await issuanceService.create(data, user), 201);
};

export const updateIssuance = async (c: Context) => {
  
  const id = c.req.param("id");
  const data = await c.req.json();
  return c.json(await issuanceService.update(id, data), 201);
};

export const getInventoryIssuance = async (c: Context) => {
  return c.json(await inventoryService.issuanceInventories(), 200);
}
