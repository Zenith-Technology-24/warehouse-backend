import { createReceipts, getReceiptById, getReceipts, updateReceipt } from "@/handler/receipt.handler";
import { authMiddleware } from "@/middleware/auth.middleware";
import { OpenAPIHono } from "@hono/zod-openapi";

const receipt = new OpenAPIHono();

receipt.use(authMiddleware as never);
receipt.get('/', getReceipts);
receipt.get('/:id', getReceiptById);
receipt.post('/', createReceipts as never);
receipt.put('/:id', updateReceipt);

export default receipt;
