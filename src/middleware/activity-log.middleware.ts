import { ActivityLogService } from "@/services/activity-log.service";
import { User } from "@prisma/client";
import { Context, Next } from "hono";

const activityLogService = new ActivityLogService()

export const activityLogMiddleware = async (c: Context & { user: Partial<User>; token: string | null }, next: Next) => {
    await next()

    const user = c.user;
    const path = c.req.path.split("/")[2];
    let method = c.req.method as "POST" | "PUT";

    if (!["POST", "PUT"].includes(method)) return;

    const actionMessages: Record<string, Record<typeof method, string>> = {
        inventory: {
            POST: `${user?.username || "Unknown"} added a new item to inventory`,
            PUT: `${user?.username || "Unknown"} updated an inventory item`,
        },
        issuance: {
            POST: `${user?.username || "Unknown"} issued an item`,
            PUT: `${user?.username || "Unknown"} updated an issuance record`,
        },
        receipt: {
            POST: `${user?.username || "Unknown"} created a receipt`,
            PUT: `${user?.username || "Unknown"} updated a receipt`,
        },
        user: {
            POST: `${user?.username || "Unknown"} created a user`,
            PUT: `${user?.username || "Unknown"} updated a user`,
        },
    };

    const activityMessage = actionMessages[path]?.[method] || `${user?.username || "Unknown"} performed ${method} on ${path}`;

    if (!activityMessage) return; 

    await activityLogService.create({
        activity: activityMessage,
        performedById: user.id ?? ""
    })
}