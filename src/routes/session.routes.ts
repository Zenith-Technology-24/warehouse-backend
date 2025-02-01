import { Router } from "express";
import { session } from "../controllers/auth.controller";

const sessionRoutes = Router();
/**
 * @swagger
 * /api/session:
 *   get:
 *     summary: Get current session
 *     description: Returns the currently authenticated user's session information
 *     tags:
 *       - Authentication
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

sessionRoutes.get('/session', session);

export default sessionRoutes;