import { DashboardService } from "@/services/dashboard.service";
import { Context } from "hono";

const dashboardService = new DashboardService();

export const fetchDashboard = async (c: Context) => {
  return c.json(await dashboardService.getSummary(), 200);
};
