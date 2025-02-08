import { createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { LoginRequestSchema, LoginResponseSchema } from "../login.schema";

export const LoginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Authentication'],
    summary: 'User login endpoint',
    description: 'Authenticate user and return JWT token',
    request: {
        body: {
            content: {
                'application/json': {
                    schema: LoginRequestSchema
                }
            }
        }
    },
    responses: {
        '200': {
            description: 'Login successful',
            content: {
                'application/json': {
                    schema: LoginResponseSchema,
                },
            },
        },
        '400': {
            description: 'Invalid request',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
        '401': {
            description: 'Authentication failed',
            content: {
                'application/json': {
                    schema: z.object({
                        message: z.string(),
                    }),
                },
            },
        },
    },
});