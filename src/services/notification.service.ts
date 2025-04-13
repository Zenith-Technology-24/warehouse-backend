/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/generic/prisma";
import moment from 'moment';

export interface ReturnedItemsResponseType {
    data: any[];
    total: number;
    currentPage: number;
    totalPages: number;
}

export class NotificationService {
    async getNotificationByUserId(userId: any) {
        return await prisma.notifications.findMany({
            where: {
                userId
            }
        })
    }

    async createLowStockNotification(data: any) {
        try {
            const users = await prisma.user.findMany();
            return users.forEach(async (user) => {
                await prisma.notifications.create({
                    data: {
                        userId: user?.id,
                        dataId: data?.dataId,
                        title: 'Low Stock Alert',
                        message: `${data.name} is running low! Only ${data.size} left in stock.`
                    }
                })
            })
        } catch (error: any) {
            throw new Error(`Failed to create notification: ${error.message}`);
        }
    }

    async checkIssuanceValidityDate() {
        try {
            const users = await prisma.user.findMany();

            for (let dayOffset = 1; dayOffset <= 5; dayOffset++) {
                const targetDate = moment().add(dayOffset, 'days');
                const start = targetDate.startOf('day').toDate();
                const end = targetDate.endOf('day').toDate();

                const issuance = await prisma.issuance.findFirst({
                    where: {
                        validityDate: {
                            gte: start,
                            lte: end,
                        },
                        status: {
                            not: 'withdrawn',
                        },
                    },
                });

                if (issuance) {
                    const message = `The issuance "${issuance.issuanceDirective}" will expire in ${dayOffset} day${dayOffset > 1 ? 's' : ''}. Please take necessary action.`;

                    await Promise.all(
                        users.map(async (user) => {
                            const existingNotification = await prisma.notifications.findFirst({
                                where: {
                                    userId: user.id,
                                    message
                                }
                            })
                            if (!existingNotification) {
                                await prisma.notifications.create({
                                    data: {
                                        userId: user.id,
                                        dataId: issuance.id,
                                        title: `Issuance Validity Reminder`,
                                        message,
                                    },
                                })
                            }
                        }
                        )
                    );
                }
            }

            return true;
        } catch (error: any) {
            throw new Error(`Error: ${error.message}`);
        }
    }

    async readNotification(id: string) {
        try {
            const res = await prisma.notifications.update({
                where: { id },
                data: {
                    read: true,
                },
            });

            return res
        } catch (error: any) {
            throw new Error(`Error: ${error.message}`);
        }
    }

    async deleteNotification(id: string) {
        try {
            const res = await prisma.notifications.delete({
                where: { id }
            });

            return res
        } catch (error: any) {
            throw new Error(`Error: ${error.message}`);
        }
    }

    async deleteAllNotification(userId: string) {
        try {
            const res = await prisma.notifications.deleteMany({
                where: {
                    userId
                }
            });

            return res
        } catch (error: any) {
            throw new Error(`Error: ${error.message}`);
        }
    }
}
