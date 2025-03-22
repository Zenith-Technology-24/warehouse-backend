import { ActivityLogService } from "@/services/activity-log.service";
import { User } from "@prisma/client";
import { Context } from "hono";

const activityLogService = new ActivityLogService()

export const getActivityLogs = async (c: Context & { user: Partial<User>; token: string | null }) => {
    const logs = await activityLogService.get(
        parseInt(c.req.query("page") || "1", 10),
        parseInt(c.req.query("limit") || "10", 10),
        c.req.query("search"),
        c.req.query("date"),
        // c.user.id ?? "",
    );
    return c.json(logs, 200);  
};
