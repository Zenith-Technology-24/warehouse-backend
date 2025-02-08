import { createIssuance, getIssuanceById, getIssuances, updateIssuance } from "@/handler/issuance.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { IssuanceCreateRoute, IssuanceGetByRoute, IssuanceRoute, IssuanceUpdateRoute } from "@/schema/z-routes/issuance.z";
import { OpenAPIHono } from "@hono/zod-openapi";


const issuance = new OpenAPIHono();

issuance.use(authMiddleware as never);
issuance.openapi(IssuanceRoute, getIssuances as never);
issuance.openapi(IssuanceGetByRoute, getIssuanceById as never);
issuance.openapi(IssuanceCreateRoute, createIssuance as never);
issuance.openapi(IssuanceUpdateRoute, updateIssuance as never);

export default issuance;