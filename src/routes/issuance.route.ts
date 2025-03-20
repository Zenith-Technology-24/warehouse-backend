import { createIssuance, fetchReceiptsForIssuance, getInventoryIssuance, getIssuanceById, getIssuances, updateIssuance, withdrawAllIssuance, withdrawIssuance } from "@/handler/issuance.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const issuance = new OpenAPIHono();

issuance.use(authMiddleware as never);
issuance.get('/', getIssuances);
issuance.get('/withdraw/:id', withdrawIssuance as never);
issuance.get('/withdraw/all/:id', withdrawAllIssuance as never);
issuance.get('/refs', fetchReceiptsForIssuance as never);
issuance.get('/inventory', getInventoryIssuance);
issuance.get('/:id', getIssuanceById);
issuance.post('/', createIssuance as never);
issuance.put('/:id', updateIssuance as never);


export default issuance;
