import { createRoute, z } from "@hono/zod-openapi";
import {
  createIssuanceSchema,
  getAllIssuancesSchema,
  getIssuanceBySchema,
  getIssuanceSchema,
  issuanceCore,
  updateIssuanceSchema,
} from "../issuance.schema";

export const IssuanceRoute = createRoute({
  method: "get",
  path: "/issuances",
  tags: ["Issuance"],
  request: {
    query: getAllIssuancesSchema,
  },
  responses: {
    "200": {
      description: "Issuance list",
      content: {
        "application/json": {
          schema: getIssuanceSchema,
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});

export const IssuanceGetByRoute = createRoute({
  method: "get",
  path: "/issuances/{id}",
  tags: ["Issuance"],
  request: {
    params: getIssuanceBySchema,
  },
  responses: {
    "200": {
      description: "Issuance by id",
      content: {
        "application/json": {
          schema: z.object({ ...issuanceCore }),
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});

export const IssuanceCreateRoute = createRoute({
  method: "post",
  path: "/issuances",
  tags: ["Issuance"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createIssuanceSchema,
        },
      },
    },
  },
  responses: {
    "201": {
      description: "Issuance created",
      content: {
        "application/json": {
          schema: z.object({ ...issuanceCore }),
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});

export const IssuanceUpdateRoute = createRoute({
  method: "put",
  path: "/issuances/{id}",
  tags: ["Issuance"],
  request: {
    params: getIssuanceBySchema,
    body: {
      content: {
        "application/json": {
          schema: updateIssuanceSchema,
        },
      },
    },
  },
  responses: {
    "201": {
      description: "Issuance created",
      content: {
        "application/json": {
          schema: z.object({ ...issuanceCore }),
        },
      },
    },
  },
  security: [
    {
      Bearer: [],
    },
  ],
});
