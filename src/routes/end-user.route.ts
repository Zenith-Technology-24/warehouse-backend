import { getEndUsers } from "@/handler/end-user.handler";
import { EndUserRoute } from "@/schema/z-routes/end-user.z";
import { OpenAPIHono } from "@hono/zod-openapi";

const endUser = new OpenAPIHono();

endUser.openapi(EndUserRoute, getEndUsers as never)

export default endUser;