import { createIssuance, getInventoryIssuance, getIssuanceById, getIssuances, updateIssuance } from "@/handler/issuance.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const issuance = new OpenAPIHono();

issuance.use(authMiddleware as never);
issuance.get('/', getIssuances);
issuance.get('/inventory', getInventoryIssuance);
issuance.get('/:id', getIssuanceById);
issuance.post('/', createIssuance as never);
issuance.put('/:id', updateIssuance as never);


export default issuance;
