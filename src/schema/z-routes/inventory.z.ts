import { createRoute } from "@hono/zod-openapi";
import {
  createInventorySchema,
  getInventorySchema,
  inventoryGetByIdSchema,
  inventoryGetSchema,
  inventorySchema,
  updateInventorySchema,
} from "../inventory.schema";

export const InventoryRoute = createRoute({
  method: "get",
  path: "/inventories",
  tags: ["Inventory"],
  request: {
    query: inventoryGetSchema,
  },
  responses: {
    "200": {
      description: "Inventory list",
      content: {
        "application/json": {
          schema: getInventorySchema,
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

export const InventoryGetByRoute = createRoute({
  method: "get",
  path: "/inventories/{id}",
  tags: ["Inventory"],
  request: {
    params: inventoryGetByIdSchema,
  },
  responses: {
    "200": {
      description: "Inventory by id",
      content: {
        "application/json": {
          schema: inventorySchema,
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

export const InventoryCreateRoute = createRoute({
  method: "post",
  path: "/inventories",
  tags: ["Inventory"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: createInventorySchema,
        },
      },
    },
  },
  responses: {
    "201": {
      description: "Inventory created",
      content: {
        "application/json": {
          schema: inventorySchema,
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

export const InventoryUpdateRoute = createRoute({
  method: "put",
  path: "/inventories/{id}",
  tags: ["Inventory"],
  request: {
    params: inventoryGetByIdSchema,
    body: {
      content: {
        "application/json": {
          schema: updateInventorySchema,
        },
      },
    },
  },
  responses: {
    "201": {
      description: "Inventory created",
      content: {
        "application/json": {
          schema: inventorySchema,
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

export const ArchiveInventoryRoute = createRoute({
  method: "patch",
  path: "/inventories/arcive/{id}",
  tags: ["Inventory"],
  request: {
    params: inventoryGetByIdSchema,
  },
  responses: {
    "201": {
      description: "Inventory created",
      content: {
        "application/json": {
          schema: inventorySchema,
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

export const UnArchiveInventory = createRoute({
  method: "patch",
  path: "/inventories/unarchive/{id}",
  tags: ["Inventory"],
  request: {
    params: inventoryGetByIdSchema,
  },
  responses: {
    "201": {
      description: "Inventory created",
      content: {
        "application/json": {
          schema: inventorySchema,
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
