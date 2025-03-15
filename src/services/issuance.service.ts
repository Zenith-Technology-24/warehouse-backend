/* eslint-disable @typescript-eslint/no-explicit-any */
import { Issuance, ProductStatus, User } from "@prisma/client";
import prisma from "@/generic/prisma";

interface InventoryPayload {
  id?: string;
  name: string;
  sizeType: "none" | "apparrel" | "numerical";
  issuance_date: Date;
  validity_date: Date;
  receiptRef?: string;
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
  documentNo?: string;
  receiptRef?: string;
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
            documentNo: data.documentNo,
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        });

        if (data.endUsers && data.endUsers.length > 0) {
          for (const endUser of data.endUsers) {
            // Check if an end user ID is provided
            let createdEndUser;

            if (endUser.id) {
              // Verify the end user exists
              const existingEndUser = await tx.endUser.findUnique({
                where: { id: endUser.id },
              });

              if (!existingEndUser) {
                throw new Error(`End user with ID ${endUser.id} not found`);
              }

              // Update the existing end user to connect with current issuance
              createdEndUser = await tx.endUser.update({
                where: { id: endUser.id },
                data: {
                  Issuance: {
                    connect: { id: issuance.id },
                  },
                },
              });
            } else {
              // Create a new end user if no ID was provided
              createdEndUser = await tx.endUser.create({
                data: {
                  name: endUser.name,
                  Issuance: {
                    connect: { id: issuance.id },
                  },
                },
              });
            }

            if (endUser.inventory && endUser.inventory.length > 0) {
              for (const inventoryItem of endUser.inventory) {
                // Check if inventory ID is provided
                if (!inventoryItem.id) {
                  throw new Error(
                    "Inventory ID is required when creating an issuance with receipt reference"
                  );
                }
                if (inventoryItem.id) {
                  // Verify the inventory exists
                  const existingInventory = await tx.inventory.findUnique({
                    where: { id: inventoryItem.id },
                    include: { item: true },
                  });

                  if (!existingInventory) {
                    throw new Error(
                      `Inventory with ID ${inventoryItem.id} not found`
                    );
                  }

                  // Update the existing inventory to connect with current issuance
                  await tx.inventory.update({
                    where: { id: inventoryItem.id },
                    data: {
                      issuance: {
                        // Then connect to the new issuance
                        connect: { id: issuance.id },
                      },
                    },
                  });

                  // Update the issuance quantity
                  await tx.issuance.update({
                    where: { id: issuance.id },
                    data: {
                      quantity: inventoryItem.item.quantity || "1",
                    },
                  });
                }

                // Create the issuance detail with the connection to the end user
                await tx.issuanceDetail.create({
                  data: {
                    quantity: inventoryItem.item.quantity || "0",
                    issuanceId: issuance.id,
                    status: "pending",
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

  async update(
    id: string,
    data: CreateIssuanceDto,
    user: User
  ): Promise<Issuance> {
    try {
      const issuance = await prisma.$transaction(async (tx) => {
        const existingIssuance = await tx.issuance.findUnique({
          where: { id },
          include: {
            endUsers: true,
            issuanceDetail: true,
            inventory: true,
          },
        });

        if (!existingIssuance) {
          throw new Error(`Issuance with ID ${id} not found`);
        }

        if (existingIssuance.endUsers && existingIssuance.endUsers.length > 0) {
          for (const endUser of existingIssuance.endUsers) {
            await tx.endUser.update({
              where: { id: endUser.id },
              data: {
                Issuance: {
                  disconnect: true,
                },
              },
            });
          }
        }

        await tx.issuanceDetail.deleteMany({
          where: { issuanceId: id },
        });

        if (existingIssuance.inventoryId) {
          await tx.inventory.update({
            where: { id: existingIssuance.inventoryId },
            data: {
              issuance: {
                disconnect: {
                  id: existingIssuance.id,
                },
              },
            },
          });
        }

        await tx.issuance.update({
          where: { id },
          data: {
            inventoryId: null,
          },
        });

        const updatedIssuance = await tx.issuance.update({
          where: { id },
          data: {
            issuanceDirective: data.issuanceDirective,
            validityDate: data.validityDate,
            status: data.status || "pending",
            documentNo: data.documentNo,
            user: user
              ? {
                  connect: {
                    id: user.id,
                  },
                }
              : undefined,
          },
        });

        if (data.endUsers && data.endUsers.length > 0) {
          for (const endUser of data.endUsers) {
            let createdEndUser;

            if (endUser.id) {
              const existingEndUser = await tx.endUser.findUnique({
                where: { id: endUser.id },
              });

              if (!existingEndUser) {
                throw new Error(`End user with ID ${endUser.id} not found`);
              }

              createdEndUser = await tx.endUser.update({
                where: { id: endUser.id },
                data: {
                  Issuance: {
                    connect: { id: updatedIssuance.id },
                  },
                },
              });
            } else {
              createdEndUser = await tx.endUser.create({
                data: {
                  name: endUser.name,
                  Issuance: {
                    connect: { id: updatedIssuance.id },
                  },
                },
              });
            }

            if (endUser.inventory && endUser.inventory.length > 0) {
              for (const inventoryItem of endUser.inventory) {
                if (!inventoryItem.id) {
                  throw new Error(
                    "Inventory ID is required when updating an issuance with inventory items"
                  );
                }

                const existingInventory = await tx.inventory.findUnique({
                  where: { id: inventoryItem.id },
                  include: { item: true },
                });

                if (!existingInventory) {
                  throw new Error(
                    `Inventory with ID ${inventoryItem.id} not found`
                  );
                }

                await tx.inventory.update({
                  where: { id: inventoryItem.id },
                  data: {
                    issuance: {
                      connect: { id: updatedIssuance.id },
                    },
                    endUser: {
                      connect: { id: createdEndUser.id },
                    },
                  },
                });

                await tx.issuance.update({
                  where: { id: updatedIssuance.id },
                  data: {
                    quantity: inventoryItem.item.quantity || "1",
                  },
                });

                await tx.issuanceDetail.create({
                  data: {
                    quantity: inventoryItem.item.quantity || "0",
                    issuanceId: updatedIssuance.id,
                    status: "pending",
                    receiptRef: data.receiptRef,
                    EndUser: {
                      connect: { id: createdEndUser.id },
                    },
                    Issuance: {
                      connect: { id: updatedIssuance.id },
                    },
                  },
                });
              }
            }
          }
        }

        return updatedIssuance;
      });

      return issuance;
    } catch (error: any) {
      throw new Error(`Failed to update issuance: ${error.message}`);
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

      const statusFilter = status === "all" ? undefined : status;

      const [issuances, total] = await Promise.all([
        prisma.issuance.findMany({
          where: { ...where, status: statusFilter as ProductStatus } as never,
          skip,
          take: pageSize,
          include: {
            endUsers: {
              include: {
                inventories: {
                  select: {
                    quantity: true,
                    status: true,
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
              inventories: true,
            },
          },
          user: true,
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to get issuance: ${error.message}`);
    }
  }

  async getReceipts() {
    const receipts = await prisma.receipt.findMany({
      include: {
        item: true
      },
    });

    const response: any = [];

    for (let i = 0; i < receipts.length; i++) {
      (async () => {
        const receipt = receipts[i];
        const items = receipt.item;

        response.push({
          id: receipt.id,
          receipt: receipt.issuanceDirective,
          items: items.map(item => {
            return {
              id: item.id,
              inventoryId: item.inventoryId,
              unit: item.unit,
              max_quantity: item.quantity,
              size: item.size,
              price: item.price,
              name: item.item_name
            }
          })
        });
      })();
    }

    return response;
  }
}
