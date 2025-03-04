/* eslint-disable @typescript-eslint/no-explicit-any */
import { Receipt, User } from "@prisma/client";
import prisma from "@/generic/prisma";

interface InventoryPayload {
  id?: string;
  name: string;
  sizeType: "none" | "apparrel" | "numerical";
  quantity: string;
  item: {
    id?: string; // Optional ID for existing item
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

export interface ReceiptsResponseType {
  data: Receipt[];
  total: number;
  currentPage: number;
  totalPages: number;
}

interface CreateReceiptDto {
  source?: string;
  receipt_date: Date;
  issuanceDirective?: string;
  quantity?: string;
  inventory?: InventoryPayload[]; // Changed to array
}
export class ReceiptService {
  async create(data: CreateReceiptDto, user: User): Promise<Receipt> {
    try {
      const receipt = await prisma.$transaction(async (tx) => {
        const receipt = await tx.receipt.create({
          data: {
            source: data.source,
            issuanceDirective: data.issuanceDirective,
            receiptDate: data.receipt_date,
            status: "active",
            user: {
              connect: {
                id: user.id,
              },
            },
          },
        });

        if (data.inventory && data.inventory.length > 0) {
          for (const inventoryItem of data.inventory) {
            const existingInventory = await tx.inventory.findFirst({
              where: {
                OR: [
                  { name: inventoryItem.name },
                  { id: inventoryItem.id },
                ]
              },
              include: { item: true },
            });

            if (existingInventory) {
              // Create new item
              const item = await tx.item.create({
                data: {
                  item_name: inventoryItem.name,
                  location: inventoryItem.item.location,
                  size: inventoryItem.item.size,
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  expiryDate: inventoryItem.item.expiryDate,
                  price: String(inventoryItem.item.price),
                  amount: String(inventoryItem.item.amount),
                  receipt: {
                    connect: { id: receipt.id },
                  },
                  inventoryId: existingInventory.id,
                },
              });

              await tx.inventory.update({
                where: { id: existingInventory.id },
                data: {
                  quantity: String(
                    parseInt(inventoryItem.item.quantity || "1") +
                      parseInt(existingInventory.item?.quantity || "0")
                  ),
                  receipts: {
                    connect: { id: receipt.id },
                  }
                },
              });
            } else {

              const inventory = await tx.inventory.create({
                data: {
                  name: inventoryItem.name,
                  sizeType: inventoryItem.item.size ? "apparrel" : "none",
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  receipts: {
                    connect: { id: receipt.id },
                  },
                },
              });

              await tx.item.create({
                data: {
                  item_name: inventoryItem.name,
                  location: inventoryItem.item.location,
                  size: inventoryItem.item.size,
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  expiryDate: inventoryItem.item.expiryDate,
                  price: String(inventoryItem.item.price),
                  amount: String(inventoryItem.item.amount),
                  receipt: {
                    connect: { id: receipt.id },
                  },
                  inventoryId: inventory.id,
                },
              });
            }
          }
        }

        return receipt;
      });

      return receipt;
    } catch (error: any) {
      throw new Error(`Failed to create receipt: ${error.message}`);
    }
  }

  async update(id: string, data: CreateReceiptDto): Promise<Receipt> {
    try {
      const existingReceipt = await prisma.receipt.findUnique({
        where: { id },
        include: {
          inventory: true,
          item: true,
        },
      });

      if (!existingReceipt) {
        throw new Error("Receipt not found");
      }

      const updatedReceipt = await prisma.$transaction(async (tx) => {
        await tx.receipt.update({
          where: { id },
          data: {
            inventory: {
              disconnect: existingReceipt.inventory.map((inv) => ({
                id: inv.id,
              })),
            },
            item: {
              disconnect: existingReceipt.item.map((itm) => ({ id: itm.id })),
            },
          },
        });

        // Update basic receipt information
        const receipt = await tx.receipt.update({
          where: { id },
          data: {
            source: data.source,
            issuanceDirective: data.issuanceDirective,
            receiptDate: data.receipt_date,
          },
        });

        if (data.inventory && data.inventory.length > 0) {
          for (const inventoryItem of data.inventory) {
            const existingInventory = await tx.inventory.findUnique({
              where: {
                id: inventoryItem.id,
              },
              include: { item: true },
            });

            if (existingInventory) {
              const item = await tx.item.create({
                data: {
                  item_name: inventoryItem.name,
                  location: inventoryItem.item.location,
                  size: inventoryItem.item.size,
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  expiryDate: inventoryItem.item.expiryDate,
                  price: String(inventoryItem.item.price),
                  amount: String(inventoryItem.item.amount),
                  receipt: {
                    connect: { id: receipt.id },
                  },
                  inventoryId: existingInventory.id,
                },
              });

              // Update inventory quantity
              await tx.inventory.update({
                where: { id: existingInventory.id },
                data: {
                  quantity: String(
                    parseInt(inventoryItem.item.quantity || "1") +
                      parseInt(existingInventory.item?.quantity || "0")
                  ),
                  receipts: {
                    connect: { id: receipt.id },
                  },
                  item: {
                    connect: { id: item.id },
                  },
                },
              });
            } else {
              // Create new inventory first
              const inventory = await tx.inventory.create({
                data: {
                  name: inventoryItem.name,
                  sizeType: inventoryItem.sizeType,
                  quantity: String(inventoryItem.item.quantity),
                  receipts: {
                    connect: { id: receipt.id },
                  },
                  item: {
                    connect: {
                      id: inventoryItem.item.id,
                    }
                  }
                },
              });

              // Create new item connected to both new inventory and receipt
              await tx.item.create({
                data: {
                  item_name: inventoryItem.name,
                  location: inventoryItem.item.location,
                  size: inventoryItem.item.size,
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  expiryDate: inventoryItem.item.expiryDate,
                  price: String(inventoryItem.item.price),
                  amount: String(inventoryItem.item.amount),
                  receipt: {
                    connect: { id: receipt.id },
                  },
                  inventoryId: inventory.id,
                },
              });
            }
          }
        }

        return receipt;
      });

      return updatedReceipt;
    } catch (error: any) {
      throw new Error(`Failed to update receipt: ${error.message}`);
    }
  }

  async getReceiptById(id: string) {
    try {
      return await prisma.receipt.findUnique({
        where: {
          id,
        },
        include: {
          item: true,
          user: {
            select: {
              lastname: true,
              firstname: true,
              email: true,
              roles: {
                select: {
                  name: true,
                },
              }
            },
          },
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to get receipt: ${error.message}`);
    }
  }

  async getReceipts(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string
  ): Promise<ReceiptsResponseType> {
    try {
      const skip = (page - 1) * pageSize;

      const where = search
        ? {
            OR: [
              { source: { contains: search, mode: "insensitive" } },
              { issuanceDirective: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [receipts, total] = await Promise.all([
        prisma.receipt.findMany({
          where: { ...where, status } as never,
          skip,
          take: pageSize,
          include: {
            inventory: {
              select: {
                id: true,
                name: true,
                status: true,
                sizeType: true,
                item: {
                  select: {
                    location: true,
                    size: true,
                    quantity: true,
                    expiryDate: true,
                    item_name: true,
                    unit: true,
                    price: true,
                    amount: true,
                  },
                },
              },
            },
            user: {
              select: {
                lastname: true,
                firstname: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.receipt.count({ where: where as never }),
      ]);

      return {
        data: receipts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error: any) {
      throw new Error(`Failed to get receipts: ${error.message}`);
    }
  }

  // Archive and Unarchive methods
  async archive(id: string): Promise<Receipt> {
    try {
      return await prisma.receipt.update({
        where: { id },
        data: {
          status: "archived",
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to archive receipt: ${error.message}`);
    }
  }

  async unArchive(id: string): Promise<Receipt> {
    try {
      return await prisma.receipt.update({
        where: { id },
        data: {
          status: "active",
        },
      });
    } catch (error: any) {
      throw new Error(`Failed to unarchive receipt: ${error.message}`);
    }
  }
}
