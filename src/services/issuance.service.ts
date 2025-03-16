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
        // 1. Create the main issuance record
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

        // 2. Process each end user
        if (data.endUsers && data.endUsers.length > 0) {
          for (const endUser of data.endUsers) {
            let createdEndUser;

            // 2.1 Handle existing or new end user
            if (endUser.id) {
              // Verify the end user exists
              const existingEndUser = await tx.endUser.findUnique({
                where: { id: endUser.id },
              });

              if (!existingEndUser) {
                throw new Error(`End user with ID ${endUser.id} not found`);
              }

              // Connect end user to the issuance
              createdEndUser = await tx.endUser.update({
                where: { id: endUser.id },
                data: {
                  Issuance: {
                    connect: { id: issuance.id },
                  },
                },
              });
            } else {
              // Create a new end user
              createdEndUser = await tx.endUser.create({
                data: {
                  name: endUser.name,
                  Issuance: {
                    connect: { id: issuance.id },
                  },
                },
              });
            }

            // 3. Process inventory items for this end user
            if (endUser.inventory && endUser.inventory.length > 0) {
              for (const inventoryItem of endUser.inventory) {
                // 3.1 Check if inventory ID is provided
                if (!inventoryItem.id) {
                  throw new Error(
                    "Inventory ID is required when creating an issuance with inventory items"
                  );
                }

                // 3.2 Verify the inventory exists and get its details
                const existingInventory = await tx.inventory.findUnique({
                  where: { id: inventoryItem.id },
                  include: { item: true },
                });

                if (!existingInventory) {
                  throw new Error(
                    `Inventory with ID ${inventoryItem.id} not found`
                  );
                }

                // 3.3 Update the inventory and set receipt reference on the item
                await tx.inventory.update({
                  where: { id: inventoryItem.id },
                  data: {
                    issuance: {
                      connect: { id: issuance.id },
                    },
                    endUser: {
                      connect: { id: createdEndUser.id },
                    },
                  },
                });

                // If this inventory has an associated item and receipt reference was provided
                if (existingInventory.itemId && inventoryItem.receiptRef) {
                  // Update the item with the receipt reference
                  await tx.item.update({
                    where: { id: existingInventory.itemId },
                    data: {
                      receiptRef: inventoryItem.receiptRef,
                    },
                  });
                }

                // 3.4 Update the issuance quantity
                await tx.issuance.update({
                  where: { id: issuance.id },
                  data: {
                    quantity: inventoryItem.item.quantity || "1",
                  },
                });

                // 3.5 Create the issuance detail with proper relationships
                await tx.issuanceDetail.create({
                  data: {
                    quantity: inventoryItem.item.quantity || "0",
                    status: "pending",
                    inventory: {
                      connect: { id: inventoryItem.id },
                    },
                    issuance: {
                      connect: { id: issuance.id },
                    },
                    endUser: {
                      connect: { id: createdEndUser.id },
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
        // Get existing issuance with all related data
        const existingIssuance = await tx.issuance.findUnique({
          where: { id },
          include: {
            endUsers: true,
            issuanceDetails: true,
            inventory: true,
          },
        });
  
        if (!existingIssuance) {
          throw new Error(`Issuance with ID ${id} not found`);
        }
  
        // Step 1: Disconnect and clean up all existing relationships
        
        // 1.1: Disconnect all end users
        if (existingIssuance.endUsers.length > 0) {
          await tx.issuance.update({
            where: { id },
            data: {
              endUsers: {
                disconnect: existingIssuance.endUsers.map(user => ({ id: user.id })),
              },
            },
          });
        }
  
        // 1.2: Disconnect and delete all issuance details
        if (existingIssuance.issuanceDetails.length > 0) {
          await tx.issuanceDetail.deleteMany({
            where: { issuanceId: id },
          });
        }
  
        // 1.3: Disconnect all inventory items
        if (existingIssuance.inventory.length > 0) {
          for (const inventory of existingIssuance.inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                issuance: { disconnect: true },
                endUser: { disconnect: true },
              },
            });
          }
        }
  
        // Step 2: Update the base issuance record
        const updatedIssuance = await tx.issuance.update({
          where: { id },
          data: {
            issuanceDirective: data.issuanceDirective,
            validityDate: data.validityDate,
            status: data.status || "pending",
            documentNo: data.documentNo,
            user: user ? { connect: { id: user.id } } : undefined,
          },
        });
  
        // Step 3: Process new end users and inventory items
        if (data.endUsers && data.endUsers.length > 0) {
          for (const endUser of data.endUsers) {
            let createdEndUser;
  
            // 3.1: Handle existing or create new end user
            if (endUser.id) {
              const existingEndUser = await tx.endUser.findUnique({
                where: { id: endUser.id },
              });
  
              if (!existingEndUser) {
                throw new Error(`End user with ID ${endUser.id} not found`);
              }
  
              // Connect end user to issuance
              createdEndUser = await tx.endUser.update({
                where: { id: endUser.id },
                data: {
                  Issuance: { connect: { id: updatedIssuance.id } },
                },
              });
            } else {
              // Create new end user
              createdEndUser = await tx.endUser.create({
                data: {
                  name: endUser.name,
                  Issuance: { connect: { id: updatedIssuance.id } },
                },
              });
            }
  
            // 3.2: Process inventory items for this end user
            if (endUser.inventory && endUser.inventory.length > 0) {
              for (const inventoryItem of endUser.inventory) {
                if (!inventoryItem.id) {
                  throw new Error(
                    "Inventory ID is required when updating an issuance with inventory items"
                  );
                }
  
                // Verify inventory exists
                const existingInventory = await tx.inventory.findUnique({
                  where: { id: inventoryItem.id },
                  include: { item: true },
                });
  
                if (!existingInventory) {
                  throw new Error(
                    `Inventory with ID ${inventoryItem.id} not found`
                  );
                }
  
                // Connect inventory to issuance and end user
                await tx.inventory.update({
                  where: { id: inventoryItem.id },
                  data: {
                    issuance: { connect: { id: updatedIssuance.id } },
                    endUser: { connect: { id: createdEndUser.id } },
                  },
                });
  
                // Create issuance detail with proper relation fields
                await tx.issuanceDetail.create({
                  data: {
                    quantity: inventoryItem.item.quantity || "0",
                    status: "pending",
                    // Use the correct relation field names as per schema
                    inventory: { connect: { id: inventoryItem.id } },
                    issuance: { connect: { id: updatedIssuance.id } },
                    endUser: { connect: { id: createdEndUser.id } },
                  },
                });
  
                // Update issuance quantity
                await tx.issuance.update({
                  where: { id: updatedIssuance.id },
                  data: {
                    quantity: inventoryItem.item.quantity || "1",
                  },
                });
              }
            }
          }
        }
  
        // Return updated issuance with all related data
        return await tx.issuance.findUnique({
          where: { id: updatedIssuance.id },
          include: {
            endUsers: true,
            issuanceDetails: {
              include: {
                inventory: true,
                endUser: true,
              },
            },
            inventory: true,
            user: {
              select: {
                firstname: true,
                lastname: true,
                username: true,
                email: true,
                roles: {
                  select: {
                    name: true,
                  }
                }
              }
            },
          },
        });
      });

      if(!issuance) {
        throw new Error(`Issuance with ID ${id} not found`);
      }
  
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
                inventory: {
                  select: {
                    item: true,
                  },
                },
              },
            },
            user: {
              select: {
                firstname: true,
                lastname: true,
                username: true,
                email: true,
                roles: {
                  select: {
                    name: true,
                  }
                }
              }
            }
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

  async getIssuanceById(id: string): Promise<Issuance> {
    try {
      const issuance = await prisma.issuance.findUnique({
        where: { id },
        include: {
          // Include just what you need with more direct paths
          endUsers: {
            include: {
              inventory: {
                include: {
                  item: true,
                },
              },
            },
          },
          issuanceDetails: {
            include: {
              inventory: {
                include: {
                  item: true,
                },
              },
              endUser: true,
            },
          },
          user: {
            select: {
              firstname: true,
              lastname: true,
              username: true,
              email: true,
              roles: {
                select: {
                  name: true,
                }
              }
            }
          },
        },
      });
      
      if (!issuance) {
        throw new Error(`Issuance with ID ${id} not found`);
      }
      
      return issuance;
    } catch (error: any) {
      throw new Error(`Failed to get issuance: ${error.message}`);
    }
  }

  async getReceipts() {
    const receipts = await prisma.receipt.findMany({
      include: {
        item: true,
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
          items: items.map((item) => {
            return {
              id: item.id,
              inventoryId: item.inventoryId,
              unit: item.unit,
              max_quantity: item.quantity,
              size: item.size,
              price: item.price,
              name: item.item_name,
            };
          }),
        });
      })();
    }

    return response;
  }
}
