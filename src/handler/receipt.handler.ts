import { ReceiptService } from "@/services/receipt.service";
import { User } from "@prisma/client";
import { Context } from "hono";

const receiptService = new ReceiptService();

export const getReceiptById = async (c: Context) => {
  
  const id = c.req.param("id");
  return c.json(await receiptService.getReceiptById(id), 200);
};

export const getReceipts = async (c: Context) => {
  return c.json(
    await receiptService.getReceipts(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("limit") || "10", 10),
      c.req.query("search"),
      c.req.query("status")
    ),
    200
  );
};

export const exportReceipt = async (c: Context) => {
  const requestBody = await c.req.json();
  
  const { start_date, end_date, search, status } = requestBody;
  return c.json(
    await receiptService.export(
      start_date ?? "", 
      end_date ?? "", 
      status,
      search ?? ""
    ), 200
  );
}


export const createReceipts = async (c: Context & { user: User }) => {
  const data = await c.req.json();
  const user = c.user;
  return c.json(await receiptService.create(data, user), 201);
};

export const updateReceipt = async (c: Context) => {
  const id = c.req.param("id");

  const data = await c.req.json();

  return c.json(await receiptService.update(id, data), 201);
}

export const archiveReceipt = async (c: Context) => {
  const id = c.req.param("id");

  return c.json(await receiptService.archive(id), 201);
}

export const unArchiveReceipt = async (c: Context) => {
  const id = c.req.param("id");

  return c.json(await receiptService.unArchive(id), 201);
}