import { ReturnedItemStatus, User } from '@prisma/client';
import { createReturnedItems } from './../handler/returned-items.handler';
/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/generic/prisma";

export interface ReturnedItemsResponseType {
    data: any[];
    total: number;
    currentPage: number;
    totalPages: number;
}

export class ReturnedItemsService {

    async getReturnedItems(
        page: number = 1,
        pageSize: number = 10,
        search?: string,
        status?: string
    ): Promise<ReturnedItemsResponseType> {
        try {
            const skip = (page - 1) * pageSize;

            const where = search
                ? {
                    OR: [
                        { itemName: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {};

            const statusFilter = status === "all" ? undefined : status;

            const [returnedItems, total] = await Promise.all([
                prisma.returnedItems.findMany({
                    where: { ...where, status: statusFilter as ReturnedItemStatus } as never,
                    skip,
                    take: pageSize,
                    orderBy: {
                        created_at: "desc",
                    },
                    include: {
                        created_by: true,
                    }
                }),
                prisma.returnedItems.count({ where: where as never }),
            ]);

            return {
                data: returnedItems,
                total,
                currentPage: page,
                totalPages: Math.ceil(total / pageSize),
            };
        } catch (error: any) {
            throw new Error(`Failed to get returned items: ${error.message}`);
        }
    }

    async export(
        start_date: string,
        end_date: string,
        status?: string,
        search?: string
    ) {
        try {
            const where = {
                created_at: {
                    gte: new Date(start_date),
                    lte: new Date(end_date),
                },
                ...(search
                    ? {
                        OR: [
                            {
                                itemName: { contains: search, mode: "insensitive" },
                            },
                        ],
                    }
                    : {}),
            };

            const returnedItems = await prisma.returnedItems.findMany({
                where: { ...where, status } as never,
                orderBy: {
                    created_at: "desc",
                },
                include: {
                    created_by: true,
                }
            });

            return returnedItems;
        } catch (error: any) {
            throw new Error(`Failed to get returned items: ${error.message}`);
        }
    }


    async create(data: any, user: User) {
        try {
            // Create a transaction history
            const currentReceipt = await prisma.receipt.findFirst({
                where: {
                    issuanceDirective: data.receiptRef
                }
            });
            await prisma.inventoryTransaction.create({
                data: {
                    itemId: data.itemId,
                    quantity: "1",
                    type: "RETURNED",
                    size: data.size,
                    inventoryId: data.inventoryId,
                    receiptRef: data.receiptRef,
                    receiptId: currentReceipt?.id,
                }
            });

            const newData = {
                ...data,
                itemSizes: undefined,
                sizeType: undefined,
            };

            return await prisma.returnedItems.create({
                data: {
                    ...newData,
                    userId: user.id
                },
            });
        } catch (error: any) {
            throw new Error(`Failed to create returned items: ${error.message}`);
        }
    }

    async update(id: string, data: any) {
        return await prisma.returnedItems.update({
            where: {
                id,
            },
            data: {
                ...data,
            },
        });
    }

    async findOne(id: string) {
        return await prisma.returnedItems.findUnique({
            where: {
                id
            },
            include: {
                created_by: true,
            },
        })
    }
}
