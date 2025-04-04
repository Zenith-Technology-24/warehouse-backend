import { getEndUsers } from "@/handler/end-user.handler";
import { OpenAPIHono } from "@hono/zod-openapi";

const endUser = new OpenAPIHono();

endUser.get('/', getEndUsers as never)

export default endUser;