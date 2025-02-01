import { Router } from "express";
import {
  getAllInventory,
  getAllProductNames,
  createInventory,
  updateInventory,
  deleteInventory,
  updateStatusInventory,
  getExportInventory,
} from "../controllers/inventory.controller";
import protectedRouter from "./protected.routes";

const inventoryRoutes = Router();

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Get all inventory items
 *     description: Retrieves a list of all inventory items
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of inventory items retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventory'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
inventoryRoutes.post("/inventory", getAllInventory);

/**
 * @swagger
 * /api/inventory/names:
 *   get:
 *     summary: Get all product names
 *     description: Retrieves a list of all product names in inventory
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Product names retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
inventoryRoutes.get("/inventory/names", getAllProductNames);
/**
 * @swagger
 * /api/inventory/create:
 *   post:
 *     summary: Create a new inventory item
 *     description: Creates a new inventory record
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       201:
 *         description: Inventory item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
inventoryRoutes.post("/inventory/create", createInventory);

/**
 * @swagger
 * /api/inventory/{id}/update:
 *   post:
 *     summary: Update an inventory item
 *     description: Updates an existing inventory record
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       200:
 *         description: Inventory item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory item not found
 */
inventoryRoutes.post("/inventory/:id/update", updateInventory);

/**
 * @swagger
 * /api/inventory/{id}/delete:
 *   get:
 *     summary: Delete an inventory item
 *     description: Deletes an existing inventory record
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     responses:
 *       200:
 *         description: Inventory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Inventory item not found
 */

inventoryRoutes.get("/inventory/:id/delete", deleteInventory);

/**
 * @swagger
 * /api/inventory/{id}/{status}:
 *   get:
 *     summary: Update inventory status
 *     description: Updates the status of an existing inventory item
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: The new status
 *     responses:
 *       200:
 *         description: Inventory status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 inventory:
 *                   $ref: '#/components/schemas/Inventory'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Inventory item not found
 */
inventoryRoutes.get("/inventory/:id/:status", updateStatusInventory);

/**
 * @swagger
 * /api/inventory/export:
 *   post:
 *     summary: Export inventory
 *     description: Exports inventory data in a specified format
 *     tags:
 *       - Inventory
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inventory exported successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
inventoryRoutes.post("/inventory/export", getExportInventory);

/**
 * @swagger
 * components:
 *   schemas:
 *     InventoryInput:
 *       type: object
 *       required:
 *         - name
 *         - quantity
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the product
 *         quantity:
 *           type: integer
 *           description: The quantity in stock
 *         description:
 *           type: string
 *           description: Additional details about the product
 *
 *     Inventory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The inventory ID
 *         name:
 *           type: string
 *           description: The name of the product
 *         quantity:
 *           type: integer
 *           description: The quantity in stock
 *         description:
 *           type: string
 *           description: Additional details about the product
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: The current status of the inventory item
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default inventoryRoutes;
