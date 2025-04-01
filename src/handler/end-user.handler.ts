import { EndUserService } from "@/services/end-user.service";
import { Context } from "hono";

const endUserService = new EndUserService();
export const getEndUsers = async (c: Context) => {
    return c.json(await endUserService.getEndUsers(), 200);
}