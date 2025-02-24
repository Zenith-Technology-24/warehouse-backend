import { createUser, getUserById, getUsers, updateUser } from "@/handler/user.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { roleMiddleware } from "@/middleware/role.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const user = new OpenAPIHono();

user.use(authMiddleware as never);
user.use(roleMiddleware({ roles: ["superadmin"] }) as never);
user.get('/', getUsers as never);
user.get('/:id', getUserById as never);
user.post('/', createUser as never);
user.put('/:id', updateUser as never);

export default user;
