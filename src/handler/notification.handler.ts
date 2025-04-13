import { NotificationService } from '@/services/notification.service';
import { Context } from "hono";

const notificationService = new NotificationService();

export const getNotifications = async (c: Context) => {
    const userId = c.req.param("userId");
    await notificationService.checkIssuanceValidityDate();
    return c.json(await notificationService.getNotificationByUserId(userId), 200);
}

export const readNotification = async (c: Context) => {
    const id = c.req.param('id');
    return c.json(await notificationService.readNotification(id), 200);
}

export const deleteNotification = async (c: Context) => {
    const id = c.req.param('id');
    return c.json(await notificationService.deleteNotification(id), 200);
}

export const deleteAllNotification = async (c: Context) => {
    const userId = c.req.param('userId');
    return c.json(await notificationService.deleteAllNotification(userId), 200);
}