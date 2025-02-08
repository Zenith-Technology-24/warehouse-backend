import { IssuanceService } from "@/services/issuance.service";
import { User } from "@prisma/client";
import { Context } from "hono";

const issuanceService = new IssuanceService();

export const getIssuanceById = async (c: Context) => {
  // Get user by id
  const id = c.req.param("id");
  return c.json(await issuanceService.getIssuanceById(id), 200);
};

export const getIssuances = async (c: Context) => {
  return c.json(
    await issuanceService.getIssuances(
      parseInt(c.req.query("page") || "1", 10),
      parseInt(c.req.query("limit") || "10", 10),
      c.req.query("search")
    ),
    200
  );
};

export const createIssuance = async (c: Context & { user: User }) => {
  // Create user
  const data = await c.req.json();

  // get authentication user
  const user = c.user;

  return c.json(await issuanceService.createIssuance(data, user), 201);
};

export const updateIssuance = async (c: Context) => {
  // Update user
  const id = c.req.param("id");
  const data = await c.req.json();
  return c.json(await issuanceService.updateIssuance(id, data), 201);
};
