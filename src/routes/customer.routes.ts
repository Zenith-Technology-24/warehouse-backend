import { Router } from "express";
import { getAllCustomer } from '../controllers/customer.controller';

const customerRoutes = Router();
/**
 * @swagger
 * /api/customers:
 *   get:
 *     summary: Retrieve all customers
 *     description: Fetches a list of all customers from the database
 *     tags: 
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The customer's ID
 *                   name:
 *                     type: string
 *                     description: The customer's name
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
customerRoutes.get('/customers', getAllCustomer);

export default customerRoutes;