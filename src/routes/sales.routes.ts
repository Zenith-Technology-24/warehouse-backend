import { Router } from 'express';
import { createSales, deleteSalesProduct, getAllSales, getExportSales, getSales, updateSales, updateStatusSales } from '../controllers/sales.controller';

const salesRoutes = Router();

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Get all sales
 *     description: Retrieves a list of all sales records
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of sales retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Sales'
 *       500:
 *         description: Server error
 */
salesRoutes.post('/sales', getAllSales);

/**
 * @swagger
 * /api/sales/export:
 *     security:
 *       - bearerAuth: []
 *   post:
 *     summary: Export sales data
 *     description: Exports sales data in a specified format
 *     tags:
 *       - Sales
 *     responses:
 *       200:
 *         description: Sales data exported successfully
 *       500:
 *         description: Server error
 */
salesRoutes.post('/sales/export', getExportSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get a specific sale
 *     description: Retrieves details of a specific sale by ID
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sale ID
 *     responses:
 *       200:
 *         description: Sale details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sales'
 *       500:
 *         description: Server error
 */
salesRoutes.get('/sales/:id', getSales);

/**
 * @swagger
 * /api/sales/create:
 *   post:
 *     summary: Create a new sale
 *     description: Creates a new sale record with customer and inventory details
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer_id:
 *                 type: integer
 *               customer_firstname:
 *                 type: string
 *               customer_lastname:
 *                 type: string
 *               customer_contactnumber:
 *                 type: string
 *               customer_address:
 *                 type: string
 *               inventories:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/SalesInventoryInput'
 *     responses:
 *       201:
 *         description: Sale created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Sales'
 *       500:
 *         description: Server error
 */
salesRoutes.post('/sales/create', createSales);


/**
 * @swagger
 * /api/sales/{id}/update:
 *   post:
 *     summary: Update a sale
 *     description: Updates an existing sale record
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalesUpdateInput'
 *     responses:
 *       201:
 *         description: Sale updated successfully
 *       500:
 *         description: Server error
 */

salesRoutes.post('/sales/:id/update', updateSales);

/**
 * @swagger
 * /api/sales/{id}/{status}:
 *   get:
 *     summary: Update sale status
 *     description: Updates the status of an existing sale
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sale ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: The new status
 *     responses:
 *       200:
 *         description: Sale status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sales:
 *                   $ref: '#/components/schemas/Sales'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Sale not found
 */
salesRoutes.get('/sales/:id/:status', updateStatusSales);


/**
 * @swagger
 * /api/sales/product/{id}/delete:
 *   get:
 *     summary: Delete a sales product
 *     description: Deletes a product from a sale
 *     tags:
 *       - Sales
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sales inventory ID
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
salesRoutes.get('/sales/product/:id/delete', deleteSalesProduct);

/**
 * @swagger
 * components:
 *   schemas:
 *     SalesInventoryInput:
 *       type: object
 *       required:
 *         - id
 *         - quantity
 *         - total_price
 *       properties:
 *         id:
 *           type: integer
 *           description: The inventory ID
 *         quantity:
 *           type: integer
 *           description: The quantity to be sold
 *         total_price:
 *           type: number
 *           description: The total price for this item
 *         terms:
 *           type: string
 *           description: Payment terms for this item
 *
 *     SalesUpdateInput:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         customer_id:
 *           type: integer
 *         customer_firstname:
 *           type: string
 *         customer_lastname:
 *           type: string
 *         customer_contactnumber:
 *           type: string
 *         customer_address:
 *           type: string
 *         inventories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SalesInventoryInput'
 *
 *     Sales:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         customer:
 *           $ref: '#/components/schemas/Customer'
 *         salesInventory:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SalesInventory'
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     Customer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         contact_number:
 *           type: string
 *         address:
 *           type: string
 *
 *     SalesInventory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         quantity:
 *           type: integer
 *         total_price:
 *           type: number
 *         terms:
 *           type: string
 *         inventory:
 *           $ref: '#/components/schemas/Inventory'
 *         sales:
 *           $ref: '#/components/schemas/Sales'
 */



export default salesRoutes;