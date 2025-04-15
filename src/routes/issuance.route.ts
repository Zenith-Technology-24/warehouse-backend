import { archiveIssuance, createIssuance, exportIssuance, fetchReceiptsForIssuance, getInventoryIssuance, getIssuanceById, getIssuances, pendingIssuance, unArchiveIssuance, updateIssuance, withdrawAllIssuance, withdrawIssuance } from "@/handler/issuance.handler";
import { activityLogMiddleware } from "@/middleware/activity-log.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const issuance = new OpenAPIHono();

issuance.use(authMiddleware as never);
issuance.use(activityLogMiddleware as never)
issuance.get('/', getIssuances);
issuance.get('/withdraw/:id/:inventoryId', withdrawIssuance as never);
issuance.get('/pending/:id/:inventoryId', pendingIssuance as never);
issuance.put('/archive/:id', archiveIssuance as never);
issuance.put('/unarchive/:id', unArchiveIssuance as never);
issuance.get('/withdraw/all/:id', withdrawAllIssuance as never);
issuance.get('/refs', fetchReceiptsForIssuance as never);
issuance.get('/inventory', getInventoryIssuance);
issuance.get('/:id', getIssuanceById);
issuance.post('/', createIssuance as never);
issuance.put('/:id', updateIssuance as never);
issuance.post('/export', exportIssuance as never);


export default issuance;
