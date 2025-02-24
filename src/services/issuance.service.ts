/* eslint-disable @typescript-eslint/no-explicit-any */
import { Issuance, ProductStatus, User } from "@prisma/client";
import prisma from "@/generic/prisma";

interface InventoryPayload {
  id?: string;
  name: string;
  sizeType: "none" | "apparrel" | "numerical";
  issuance_date: Date;
  validity_date: Date;
  item: {
    id?: string;
    item_name: string;
    location: string;
    size?: string;
    unit?: string;
    quantity?: string;
    expiryDate?: Date;
    price?: string;
    amount?: string;
  };
}

interface EndUserPayload {
  id?: string;
  name: string;
  inventory?: InventoryPayload[];
}

interface CreateIssuanceDto {
  issuanceDirective?: string;
  validityDate: Date;
  status?: ProductStatus;
  endUsers?: EndUserPayload[];
}

export interface IssuanceResponseType {
  data: any[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export class IssuanceService {
  async create(data: CreateIssuanceDto, user: User): Promise<Issuance> {
    try {
      const issuance = await prisma.$transaction(async (tx) => {
        const issuance = await tx.issuance.create({
          data: {
            issuanceDirective: data.issuanceDirective,
            validityDate: data.validityDate,
            status: data.status || "pending",
            user: {
              connect: {
                id: user.id,
              },
            },

          },
        });

        if (data.endUsers && data.endUsers.length > 0) {
          for (const endUser of data.endUsers) {
            const createdEndUser = await tx.endUser.create({
              data: {
                name: endUser.name,
                Issuance: {
                  connect: { id: issuance.id },
                },
              },
            });

            if (endUser.inventory && endUser.inventory.length > 0) {
              for (const inventoryItem of endUser.inventory) {
                const item = await tx.item.create({
                  data: {
                    item_name: inventoryItem.item.item_name,
                    location: inventoryItem.item.location,
                    size: inventoryItem.item.size,
                    unit: inventoryItem.item.unit,
                    quantity: inventoryItem.item.quantity,
                    expiryDate: inventoryItem.item.expiryDate,
                    price: inventoryItem.item.price,
                    amount: inventoryItem.item.amount,
                  },
                });

                const inventory = await tx.inventory.create({
                  data: {
                    name: inventoryItem.name,
                    sizeType: inventoryItem.sizeType,
                    item: {
                      connect: {
                        id: item.id,
                      },
                    },
                    endUser: {
                      connect: { id: createdEndUser.id },
                    },
                  },
                });

                await tx.issuanceDetail.create({
                  data: {
                    quantity: inventoryItem.item.quantity || "0",
                    issuanceId: issuance.id,
                    items: {
                      connect: { id: inventory.id },
                    },
                    EndUser: {
                      connect: { id: createdEndUser.id },
                    },
                    Issuance: {
                      connect: { id: issuance.id },
                    },
                  },
                });
              }
            }
          }
        }

        return issuance;
      });

      return issuance;
    } catch (error: any) {
      throw new Error(`Failed to create issuance: ${error.message}`);
    }
  }

  async getIssuances(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string
  ): Promise<IssuanceResponseType> {
    try {
      const skip = (page - 1) * pageSize;

      const where = search
        ? {
            OR: [
              { issuanceDirective: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [issuances, total] = await Promise.all([
        prisma.issuance.findMany({
          where: { ...where, status: status as ProductStatus } as never,
          skip,
          take: pageSize,
          include: {
            endUsers: {
              include: {
                inventories: {
                  select: {
                    quantity: true,
                    status: true,
                    receiptRef: true,
                    items: {
                      select: {
                        name: true,
                        status: true,
                        item: {
                          select: {
                            item_name: true,
                            quantity: true,
                            price: true,
                            amount: true,
                            unit: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            user: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.issuance.count({ where: where as never }),
      ]);

      return {
        data: issuances,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error: any) {
      throw new Error(`Failed to get issuances: ${error.message}`);
    }
  }

  async getIssuanceById(id: string) {
    try {
      return await prisma.issuance.findUnique({
        where: { id },
        include: {
          endUsers: {
            include: {
              inventories: {
                include: {
                  items: {
                    include: {
                      item: true,
                    },
                  },
                },
              },
            },
          },
          user: true,
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to get issuance: ${error.message}`);
    }
  }
}
