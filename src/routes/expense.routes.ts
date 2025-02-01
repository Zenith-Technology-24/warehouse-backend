import { Router } from "express";
import {
  createExpense,
  getAllExpense,
  getExportExpense,
  updateExpense,
  updateStatusExpense,
} from "../controllers/expense.controller";

const expenseRoutes = Router();
/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Get all expenses
 *     description: Retrieves a list of all expenses
 *     tags:
 *       - Expenses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of expenses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Expense'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * /api/expenses/export:
 *   post:
 *     summary: Export expenses
 *     description: Exports expense data in a specified format
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expenses exported successfully
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * /api/expenses/create:
 *   post:
 *     summary: Create a new expense
 *     description: Creates a new expense record
 *     tags:
 *       - Expenses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseInput'
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * /api/expenses/{id}/update:
 *   post:
 *     summary: Update an expense
 *     description: Updates an existing expense record
 *     tags:
 *       - Expenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ExpenseInput'
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Expense not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 * /api/expenses/{id}/{status}:
 *   get:
 *     summary: Update expense status
 *     description: Updates the status of an existing expense
 *     tags:
 *       - Expenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The expense ID
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *         description: The new status
 *     responses:
 *       200:
 *         description: Expense status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Expense not found
 * components:
 *   schemas:
 *     ExpenseInput:
 *       type: object
 *       required:
 *         - title
 *         - amount
 *       properties:
 *         title:
 *           type: string
 *           description: The title of the expense
 *         amount:
 *           type: number
 *           description: The amount of the expense
 *         description:
 *           type: string
 *           description: Additional details about the expense
 *     
 *     Expense:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The expense ID
 *         title:
 *           type: string
 *           description: The title of the expense
 *         amount:
 *           type: number
 *           description: The amount of the expense
 *         description:
 *           type: string
 *           description: Additional details about the expense
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           description: The current status of the expense
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

expenseRoutes.post("/expenses", getAllExpense);
expenseRoutes.post("/expenses/create", createExpense);
expenseRoutes.post("/expenses/:id/update", updateExpense);
expenseRoutes.get("/expenses/:id/:status", updateStatusExpense);
expenseRoutes.post("/expenses/export", getExportExpense);

export default expenseRoutes;
