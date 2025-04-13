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

export const exportIssuance = async (c: Context) => {
  const requestBody = await c.req.json();
  const { start_date, end_date, search, status } = requestBody;
  return c.json(
    await issuanceService.export(
      start_date ?? "",
      end_date ?? "",
      status,
      search ?? ""
    ), 200
  );
}

export const fetchReceiptsForIssuance = async (c: Context) => {
  // get the get param for all
  const fetch = c.req.query("fetch");
  return c.json(await issuanceService.getReceipts(fetch), 200);
};

export const createIssuance = async (c: Context & { user: User }) => {
  const data = await c.req.json();

  const user = c.user;
  return c.json(await issuanceService.create(data, user), 201);
};

export const updateIssuance = async (c: Context & { user: User }) => {
  const id = c.req.param("id");
  const data = await c.req.json();
  const user = c.user;
  return c.json(await issuanceService.update(id, data, user), 201);
};

export const getInventoryIssuance = async (c: Context) => {
  return c.json(await inventoryService.issuanceInventories(), 200);
};

export const withdrawIssuance = async (c: Context) => {
  const id = c.req.param("id");
  const inventoryId = c.req.param("inventoryId");
  return c.json(await issuanceService.withdrawIssuance(id, inventoryId), 200);
}

export const withdrawAllIssuance = async (c: Context) => {
  const id = c.req.param("id");
  return c.json(await issuanceService.withdrawAllIssuance(id), 200);
}

export const archiveIssuance = async (c: Context) => {
  const id = c.req.param("id");
  return c.json(await issuanceService.archiveIssuance(id), 200);
}

export const unArchiveIssuance = async (c: Context) => {
  const id = c.req.param("id");
  return c.json(await issuanceService.unArchiveIssuance(id), 200);
}
