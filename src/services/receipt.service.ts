/* eslint-disable @typescript-eslint/no-explicit-any */
import { Receipt, User } from "@prisma/client";
import prisma from "@/generic/prisma";

interface InventoryPayload {
  id?: string;
  name: string;
  sizeType: "none" | "apparrel" | "numerical";
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
            if (inventoryItem.id) {
              // If inventory ID exists, just connect it to the receipt
              await tx.inventory.update({
                where: { id: inventoryItem.id },
                data: {
                  receipts: {
                    connect: { id: receipt.id },
                  },
                },
              });
            } else {
              // Create new item and inventory as before
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
                },
              });

              await tx.inventory.create({
                data: {
                  name: inventoryItem.name,
                  sizeType: inventoryItem.sizeType,
                  itemId: item.id,
                  receipts: {
                    connect: { id: receipt.id },
                  },
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
        },
      });

      if (!existingReceipt) {
        throw new Error("Receipt not found");
      }

      const updatedReceipt = await prisma.$transaction(async (tx) => {
        // First, disconnect all existing inventory relationships
        await tx.receipt.update({
          where: { id },
          data: {
            inventory: {
              disconnect: existingReceipt.inventory.map(inv => ({ id: inv.id }))
            }
          }
        });

        // Update the receipt basic info
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
            if (inventoryItem.id) {
              // If inventory ID exists, connect it to the receipt
              await tx.inventory.update({
                where: { id: inventoryItem.id },
                data: {
                  receipts: {
                    connect: { id: receipt.id },
                  },
                },
              });
              continue;
            }

            const existingInventory = await tx.inventory.findFirst({
              where: { name: inventoryItem.name },
              include: { item: true },
            });

            if (existingInventory) {
              // Update existing item
              await tx.item.update({
                where: { id: existingInventory.itemId },
                data: {
                  item_name: inventoryItem.item.item_name,
                  location: inventoryItem.item.location,
                  size: inventoryItem.item.size,
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  expiryDate: inventoryItem.item.expiryDate,
                  price: String(inventoryItem.item.price),
                  amount: String(inventoryItem.item.amount),
                },
              });

              // Update inventory and connect to receipt
              await tx.inventory.update({
                where: { id: existingInventory.id },
                data: {
                  sizeType: inventoryItem.sizeType,
                  receipts: {
                    connect: { id: receipt.id },
                  },
                },
              });
            } else {
              // Create new item first
              const newItem = await tx.item.create({
                data: {
                  item_name: inventoryItem.name,
                  location: inventoryItem.item.location,
                  size: inventoryItem.item.size,
                  unit: inventoryItem.item.unit,
                  quantity: String(inventoryItem.item.quantity),
                  expiryDate: inventoryItem.item.expiryDate,
                  price: String(inventoryItem.item.price),
                  amount: String(inventoryItem.item.amount),
                },
              });

              // Create new inventory with reference to the item
              await tx.inventory.create({
                data: {
                  name: inventoryItem.name,
                  sizeType: inventoryItem.sizeType,
                  itemId: newItem.id,
                  receipts: {
                    connect: { id: receipt.id },
                  },
                },
              });
            }
          }
        }

        return receipt;
      });

      return updatedReceipt;
    } catch (error: any) {
      throw new Error(`${error.message}`);
    }
  }
  async getReceiptById(id: string) {
    try {
      return await prisma.receipt.findUnique({
        where: {
          id,
        },
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
            }
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
              }
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
        prisma.receipt.count({ where: where as never }),
      ]);

      // Add quantity tallies for each receipt
      const receiptsWithTallies = receipts.map((receipt) => {
        const inventoryTallies = receipt.inventory.reduce(
          (acc, inv) => {
            const quantity = parseInt(inv.item?.quantity || "0");
            return {
              totalQuantity: acc.totalQuantity + quantity,
              totalAmount:
                acc.totalAmount + parseFloat(inv.item?.amount || "0"),
              items: [
                ...acc.items,
                {
                  name: inv.name,
                  quantity: quantity,
                  amount: parseFloat(inv.item?.amount || "0"),
                },
              ],
            };
          },
          {
            totalQuantity: 0,
            totalAmount: 0,
            items: [] as Array<{
              name: string;
              quantity: number;
              amount: number;
            }>,
          }
        );

        return {
          ...receipt,
          tallies: inventoryTallies,
        };
      });

      return {
        data: receiptsWithTallies,
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
