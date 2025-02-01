import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import salesRoutes from './sales.routes';
import inventoryRoutes from './inventory.routes';
import sessionRoutes from './session.routes';
import userRoutes from './user.routes';
import expenseRoutes from './expense.routes';
import dashboardRoutes from './dashboard.routes';
import customerRoutes from './customer.routes';

const protectedRouter = Router();

// Apply the authentication middleware
protectedRouter.use(authMiddleware);
protectedRouter.use(salesRoutes);
protectedRouter.use(inventoryRoutes);
protectedRouter.use(sessionRoutes);
protectedRouter.use(userRoutes);
protectedRouter.use(expenseRoutes);
protectedRouter.use(dashboardRoutes);
protectedRouter.use(customerRoutes);

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The user ID
 *         email:
 *           type: string
 *           format: email
 *           description: The user's email address
 *         name:
 *           type: string
 *           description: The user's full name
 *         role:
 *           type: string
 *           description: The user's role
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */


export default protectedRouter;
