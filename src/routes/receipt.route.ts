import { archiveReceipt, createReceipts, getReceiptById, getReceipts, unArchiveReceipt, updateReceipt } from "@/handler/receipt.handler";
import { activityLogMiddleware } from "@/middleware/activity-log.middleware";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const receipt = new OpenAPIHono();

receipt.use(authMiddleware as never);
receipt.use(activityLogMiddleware as never)
receipt.get('/', getReceipts);
receipt.get('/:id', getReceiptById);
receipt.post('/', createReceipts as never);
receipt.put('/archive/:id', archiveReceipt);
receipt.put('/unarchive/:id', unArchiveReceipt);
receipt.put('/:id', updateReceipt);


export default receipt;
