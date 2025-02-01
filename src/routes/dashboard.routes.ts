import { Router } from "express";
import { dashboardData } from "../controllers/dashboard.controller";

const dashboardRoutes = Router();
/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     summary: Retrieve dashboard statistics
 *     description: Get counts of expenses, inventory items, and sales for the dashboard
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 countExpense:
 *                   type: integer
 *                   description: Total number of expenses
 *                   example: 42
 *                 countInventory:
 *                   type: integer
 *                   description: Total number of inventory items
 *                   example: 156
 *                 countSales:
 *                   type: integer
 *                   description: Total number of sales
 *                   example: 89
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
dashboardRoutes.get('/dashboard', dashboardData);

export default dashboardRoutes;