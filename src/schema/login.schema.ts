import {createRoute, z} from '@hono/zod-openapi';
import { RoleSchema } from './role.schema';

export const LoginRequestSchema = z.object({
    username: z.string().min(3).describe('User login username'),
    password: z.string().min(6).describe('User login password'),
})

export const LoginResponseSchema = z.object({
    user: z.object({
        id: z.number(),
        username: z.string(),
        role: z.array(RoleSchema),
    }).describe('User information'),
    token: z.string().describe('JWT access token'),
});

export type LoginRequestType = z.infer<typeof LoginRequestSchema>;
export type LoginResponseType = z.infer<typeof LoginResponseSchema>;

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