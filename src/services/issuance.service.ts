import { Issuance, Prisma, ProductStatus, User } from "@prisma/client";
import prisma from "@/generic/prisma";
import { InventoryService } from "./inventory.service";
import { ReceiptService } from "./receipt.service";
import { NotificationService } from "./notification.service";

interface InventoryPayload {
  id?: string;
  name: string;
  sizeType: "none" | "apparrel" | "numerical";
  issuance_date: Date;
  validity_date: Date;
  receiptRef?: string;
  itemId?: string;
  refId?: string;
  item_name: string;
  location: string;
  size?: string;
  unit?: string;
  quantity?: string;
  expiryDate?: Date;
  price?: string;
  amount?: string;
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

const inventoryService = new InventoryService();
const notificationService = new NotificationService();

export class IssuanceService {
  async create(data: CreateIssuanceDto, user: User) {
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
            if (endUser.name) {
              // Find existing end user by name
              const existingEndUser = await tx.endUser.findFirst({
                where: { name: endUser.name },
              });

              if (!existingEndUser) {
                // Create a new end user
                createdEndUser = await tx.endUser.create({
                  data: {
                    name: endUser.name,
                    // Use issuances (capital I) to match schema naming
                    issuances: {
                      connect: { id: issuance.id },
                    },
                  },
                });
              } else {
                // Connect existing end user to the NEW issuance
                // WITHOUT disconnecting from other issuances
                await tx.issuance.update({
                  where: { id: issuance.id },
                  data: {
                    endUsers: {
                      connect: { id: existingEndUser.id },
                    },
                  },
                });

                createdEndUser = existingEndUser;
              }
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

                // 3.3 Connect inventory to issuance and end user - fixed to avoid affecting other relations
                // Instead of updating the inventory directly, we'll create proper relations through issuanceDetail

                // 3.4 Create the issuance detail with proper relationships
                const issuanceDetail = await tx.issuanceDetail.create({
                  data: {
                    quantity: String(inventoryItem.quantity) || "0",
                    status: "pending",
                    inventory: {
                      connect: { id: inventoryItem.id },
                    },
                    issuance: {
                      connect: { id: issuance.id },
                    },
                    endUser: createdEndUser
                      ? {
                        connect: { id: createdEndUser.id },
                      }
                      : undefined,
                  },
                });

                // 3.5 Update the issuance quantity - just once per type
                await tx.issuance.update({
                  where: { id: issuance.id },
                  data: {
                    quantity: String(inventoryItem.quantity) || "1",
                  },
                });

                // 3.6 Create item if receipt reference is provided
                if (inventoryItem.receiptRef) {
                  const currentReceipt = await tx.receipt.findFirst({
                    where: { issuanceDirective: inventoryItem.receiptRef },
                  });
                  const currentInventory =
                    await inventoryService.getInventoryById(inventoryItem.id);
                  if (currentInventory) {
                    const sizeQuantities = currentInventory.detailedQuantities;
                    const requestedSize = inventoryItem.size || "No Size";
                    const sizeData = sizeQuantities[requestedSize].available;
                    if (Number(inventoryItem.quantity) > Number(sizeData)) {
                      throw new Error(
                        `Quantity ${inventoryItem.quantity} exceeds available quantity ${sizeQuantities[requestedSize].available} of ${currentInventory.name} for size ${inventoryItem.size}`
                      );
                    }
                  }

                  const item = await tx.item.create({
                    data: {
                      item_name: inventoryItem?.name || "NO NAME",
                      location: inventoryItem?.location || "NO LOCATION",
                      size: inventoryItem?.size || "NO SIZE",
                      unit: inventoryItem.unit,
                      quantity: String(inventoryItem.quantity),
                      price: String(inventoryItem?.price) || "1",
                      amount: String(inventoryItem?.amount) || "1",
                      expiryDate: inventoryItem?.expiryDate,
                      receiptRef: inventoryItem.receiptRef,
                      inventoryId: inventoryItem.id,
                      issuanceDetailId: issuanceDetail.id,
                      refId: inventoryItem.refId,
                    },
                  });

                  await tx.inventoryTransaction.create({
                    data: {
                      inventoryId: inventoryItem.id,
                      quantity: String(inventoryItem.quantity),
                      type: "ISSUANCE",
                      issuanceId: issuanceDetail.id,
                      receiptId: currentReceipt?.id,
                      size: inventoryItem?.size || "NO SIZE",
                      amount: String(inventoryItem?.amount) || "1",
                      price: String(inventoryItem?.price) || "1",
                      itemId: inventoryItem.refId || item.id,
                    },
                  });
                }
              }
            }
          }
        }

        // Return the created issuance with full details
        return await tx.issuance.findUnique({
          where: { id: issuance.id },
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
                  },
                },
              },
            },
          },
        });
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
  ) {
    try {
      const issuance = await prisma.$transaction(
        async (tx) => {
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
            throw new Error(`issuances with ID ${id} not found`);
          }

          // Step 1: Disconnect and clean up all existing relationships

          // 1.0: Delete related inventory transactions for this issuance
          await tx.inventoryTransaction.deleteMany({
            where: { issuanceId: id },
          });

          // 1.1: Disconnect all end users
          if (existingIssuance.endUsers.length > 0) {
            await tx.issuance.update({
              where: { id },
              data: {
                status: "pending",
                issuanceStatus: "pending",
                endUsers: {
                  disconnect: existingIssuance.endUsers.map((user) => ({
                    id: user.id,
                  })),
                },
              },
            });
          }

          // 1.2: Disconnect and delete all issuance details
          await tx.issuanceDetail.deleteMany({
            where: { issuanceId: id },
          });

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
              if (endUser.name) {
                // Find existing end user by name
                const existingEndUser = await tx.endUser.findFirst({
                  where: { name: endUser.name },
                });

                if (existingEndUser) {
                  // Connect existing end user to the updated issuance
                  await tx.issuance.update({
                    where: { id: updatedIssuance.id },
                    data: {
                      endUsers: {
                        connect: { id: existingEndUser.id },
                      },
                    },
                  });

                  createdEndUser = existingEndUser;
                } else {
                  // Create a new end user and connect to the issuance
                  createdEndUser = await tx.endUser.create({
                    data: {
                      name: endUser.name,
                      issuances: {
                        connect: { id: updatedIssuance.id },
                      },
                    },
                  });
                }
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

                  // Create issuance detail with proper relation fields
                  const issuanceDetail = await tx.issuanceDetail.create({
                    data: {
                      quantity: String(inventoryItem.quantity) || "0",
                      status: "pending",
                      inventory: {
                        connect: { id: inventoryItem.id },
                      },
                      issuance: {
                        connect: { id: updatedIssuance.id },
                      },
                      endUser: createdEndUser
                        ? {
                          connect: { id: createdEndUser.id },
                        }
                        : undefined,
                    },
                  });

                  if (!inventoryItem.refId) {
                    throw new Error("Item Reference ID is required");
                  }

                  // If receipt reference is provided, create/update item information
                  if (inventoryItem.receiptRef) {
                    const currentReceipt = await tx.receipt.findFirst({
                      where: { issuanceDirective: inventoryItem.receiptRef },
                    });

                    // Exclusively for the issuance render
                    const createdItem = await tx.item.create({
                      data: {
                        item_name: inventoryItem?.name || "NO NAME",
                        location: inventoryItem?.location || "NO LOCATION",
                        size: inventoryItem?.size || "NO SIZE",
                        unit: inventoryItem.unit,
                        quantity: String(inventoryItem.quantity),
                        price: String(inventoryItem?.price) || "1",
                        amount: String(inventoryItem?.amount) || "1",
                        expiryDate: inventoryItem?.expiryDate,
                        receiptRef: inventoryItem.receiptRef,
                        inventoryId: existingInventory.id,
                        issuanceDetailId: issuanceDetail.id,
                        refId: inventoryItem.refId,
                      },
                    });

                    // Create inventory transaction record
                    await tx.inventoryTransaction.create({
                      data: {
                        inventoryId: inventoryItem.id,
                        quantity: String(inventoryItem.quantity),
                        type: "ISSUANCE",
                        issuanceId: issuanceDetail.id,
                        size: inventoryItem?.size || "NO SIZE",
                        amount: String(inventoryItem?.amount) || "1",
                        itemId: inventoryItem?.refId || createdItem.id,
                        price: String(inventoryItem?.price) || "1",
                        receiptId: currentReceipt?.id,
                      },
                    });
                  }

                  // Update issuance quantity
                  await tx.issuance.update({
                    where: { id: updatedIssuance.id },
                    data: {
                      quantity: String(inventoryItem.quantity) || "1",
                    },
                  });
                }
              }
            }
          }

          // Clean up orphaned items
          await tx.item.deleteMany({
            where: {
              receiptId: null,
              issuanceDetailId: null,
            },
          });

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
                    },
                  },
                },
              },
            },
          });
        },
        {
          timeout: 10000, // Increase timeout to 10 seconds
          maxWait: 5000, // Maximum time to wait to acquire a transaction
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, // Optional: can help with performance
        }
      );

      if (!issuance) {
        throw new Error(`issuances with ID ${id} not found`);
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
                  where: {
                    issuance: {
                      id: {
                        not: undefined,
                      },
                    },
                  },
                  select: {
                    quantity: true,
                    status: true,
                    issuanceId: true,
                  },
                },
                inventory: {
                  select: {
                    item: true,
                  },
                },
              },
            },
            issuanceDetails: {
              include: {
                inventory: true,
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
                  },
                },
              },
            },
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

  async export(
    start_date: string,
    end_date: string,
    status?: string,
    search?: string
  ) {
    try {
      const where = {
        issuanceDate: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        ...(search
          ? {
            OR: [
              {
                issuanceDirective: { contains: search, mode: "insensitive" },
              },
            ],
          }
          : {}),
      };

      const statusFilter = status === "all" ? undefined : status;

      const issuances = await prisma.issuance.findMany({
        where: { ...where, status: statusFilter } as never,
        include: {
          endUsers: {
            include: {
              inventories: {
                where: {
                  issuance: {
                    id: {
                      not: undefined,
                    },
                  },
                },
                select: {
                  quantity: true,
                  status: true,
                  issuanceId: true,
                },
              },
              inventory: {
                select: {
                  item: true,
                },
              },
            },
          },
          issuanceDetails: {
            include: {
              inventory: true,
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
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return issuances;
    } catch (error: any) {
      throw new Error(`Failed to get issuances: ${error.message}`);
    }
  }

  async getIssuanceById(id: string) {
    try {
      const issuance = await prisma.issuance.findUnique({
        where: { id },
        select: {
          documentNo: true,
          issuanceDirective: true,
          issuanceDate: true,
          validityDate: true,
          issuanceStatus: true,
          createdAt: true,
          endUsers: {
            select: {
              id: true,
              name: true,
              inventories: {
                where: {
                  issuanceId: id,
                },
                select: {
                  inventoryId: true,
                  items: true,
                  status: true,
                  id: true,
                  quantity: true,
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
                },
              },
            },
          },
        },
      });

      if (!issuance) {
        throw new Error(`issuances with ID ${id} not found`);
      }

      // Replace the problematic code with:
      const response = {
        ...issuance,
        endUsers: await Promise.all(
          issuance.endUsers.map(async (endUser) => {
            return {
              id: endUser.id,
              name: endUser.name,
              inventory: await Promise.all(
                endUser.inventories.map(async (inventory) => {
                  const itemPromises = inventory.items.map(async (item) => {
                    const inventoryData = await prisma.inventory.findUnique({
                      where: { id: item.inventoryId || "" },
                      select: {
                        sizeType: true,
                        id: true,
                        quantity: true,
                        unit: true,
                        status: true,
                      },
                    });

                    const receiptData = await prisma.receipt.findUnique({
                      where: {
                        issuanceDirective: item.receiptRef || "",
                      },
                      select: {
                        quantity: true,
                      },
                    });

                    // check if the item.size is a uuid
                    const isUuid = (str: string) =>
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
                        str
                      );
                    const itemSize = isUuid(item.size || "")
                      ? await prisma.item.findUnique({
                        where: { id: item.size || "" },
                        select: { size: true, id: true },
                      })
                      : null;

                    return {
                      ...inventoryData,
                      id: item.id,
                      unit: item.unit,
                      receiptRef: item.receiptRef,
                      max_quantity: String(
                        receiptData?.quantity || item.quantity
                      ),
                      quantity: String(item.quantity),
                      size: itemSize ? itemSize.size : item.size,
                      sizeId: itemSize ? itemSize.id : null,
                      price: String(item.price),
                      name: item.item_name,
                      amount: String(item.amount),
                      itemId: item.refId,
                    };
                  });

                  // Get the first item only since you seem to want just one
                  const itemData = (await Promise.all(itemPromises))[0];

                  return {
                    id: inventory.inventoryId,
                    issuanceDetailId: inventory.id,
                    status: inventory.status,
                    item: itemData,
                  };
                })
              ),
            };
          })
        ),
      };

      return response;
    } catch (error: any) {
      throw new Error(`Failed to get issuance: ${error.message}`);
    }
  }

  async getReceipts(fetch = 'some') {
    const receipts = await prisma.receipt.findMany({
      include: {
        item: true,
      },
    });

    const receiptService = new ReceiptService();

    const response: any = [];

    for (let i = 0; i < receipts.length; i++) {
      const receipt = receipts[i];
      const items = receipt.item;
      const newItems = [];

      for (let j = 0; j < items.length; j++) {
        const item = items[j];

        const receiptData = await receiptService.getCurrentReceipt(
          receipt.id,
          item.inventoryId || "",
          item.id
        );
        //@ts-expect-error skip for now kay kapoy
        if (receiptData?.data[0].issued_quantity <= 0 && fetch === 'all') {
          continue;
        }

        //@ts-expect-error skip for now kay kapoy
        if (receiptData?.data[0].is_consumed && fetch === 'some') {
          continue;
        }

        newItems.push(item);
      }

      if (!newItems.length) {
        continue;
      }

      response.push({
        id: receipt.id,
        receipt: receipt.issuanceDirective,
        items: newItems,
      });
    }

    return response;
  }

  async withdrawIssuance(id: string, inventoryId: string) {
    const issuance = await prisma.issuanceDetail.update({
      where: { id },
      data: {
        status: "withdrawn",
      },
      select: {
        issuanceId: true,
      },
    });

    const issuances = await prisma.issuanceDetail.findMany({
      where: { issuanceId: issuance.issuanceId },
    });

    const pendingCount = issuances.filter((item) => item.status === "pending");

    if (pendingCount.length === 0) {
      await prisma.issuance.update({
        where: { id: issuance.issuanceId },
        data: {
          status: "withdrawn",
          issuanceStatus: "withdrawn",
        },
      });
    }

    // GIL
    const inventory = await inventoryService.getInventoryById(inventoryId);

    if (inventory?.quantitySummary?.totalQuantity && inventory.quantitySummary.totalQuantity <= 5) {
      await notificationService.createLowStockNotification({
        name: inventory?.name,
        size: inventory?.quantitySummary?.totalQuantity,
        dataId: inventory?.id
      })
    }

    return issuance;
  }

  async pendingIssuance(id: string, inventoryId: string) {
    const issuance = await prisma.issuanceDetail.update({
      where: { id },
      data: {
        status: "pending",
      },
      select: {
        issuanceId: true,
      },
    });

    const issuances = await prisma.issuanceDetail.findMany({
      where: { issuanceId: issuance.issuanceId },
    });

    const pendingCount = issuances.filter((item) => item.status === "withdrawn");

    if (pendingCount.length === 0) {
      await prisma.issuance.update({
        where: { id: issuance.issuanceId },
        data: {
          status: "pending",
          issuanceStatus: "pending",
        },
      });
    }

    // GIL
    const inventory = await inventoryService.getInventoryById(inventoryId);

    if (inventory?.quantitySummary?.totalQuantity && inventory.quantitySummary.totalQuantity <= 5) {
      await notificationService.createLowStockNotification({
        name: inventory?.name,
        size: inventory?.quantitySummary?.totalQuantity,
        dataId: inventory?.id
      })
    }

    return issuance;
  }

  async withdrawAllIssuance(id: string) {
    const issuance = await prisma.issuance.update({
      where: { id },
      data: {
        status: "withdrawn",
        issuanceStatus: "withdrawn",
      },
    });

    return await prisma.issuanceDetail.updateMany({
      where: {
        issuanceId: issuance.id,
        status: "pending",
      },
      data: {
        status: "withdrawn",
      },
    });
  }

  async pendingAllIssuance(id: string) {
    await prisma.issuance.update({
      where: { id },
      data: {
        status: "pending",
        issuanceStatus: "pending",
      },
    });
    console.log(id)
    return await prisma.issuanceDetail.updateMany({
      where: {
        issuanceId: id,
        status: "withdrawn",
      },
      data: {
        status: "pending",
      },
    });
  }

  async archiveIssuance(id: string) {
    return await prisma.issuance.update({
      where: { id },
      data: {
        status: "archived",
        issuanceStatus: "archived",
      },
    });
  }

  async unArchiveIssuance(id: string) {
    return await prisma.issuance.update({
      where: { id },
      data: {
        status: "pending",
        issuanceStatus: "pending",
      },
    });
  }
}
