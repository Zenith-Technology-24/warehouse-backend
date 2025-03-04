/* eslint-disable @typescript-eslint/no-explicit-any */
import { Inventory, ProductStatus, SizeType } from "@prisma/client";
import prisma from "@/generic/prisma";

interface CreateInventoryDto {
  name: string;
  status?: ProductStatus;
  unit?: string;
  sizeType: SizeType;
  location: string;
  size?: string;
  quantity?: string;
  expiryDate?: Date;
  price?: string;
  amount?: string;
}

interface createItemTypeDto {
  sizeType: SizeType;
  name: string;
  unit: string;
}

export interface InventoryResponseType {
  data: Inventory[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export class InventoryService {
  async create(data: CreateInventoryDto): Promise<Inventory> {
    try {
      const inventory = await prisma.$transaction(async (tx) => {
        const existingInventory = await tx.inventory.findFirst({
          where: { name: data.name },
        });

        if (existingInventory) {
          throw new Error("Inventory with this name already exists");
        }

        const item = await tx.item.create({
          data: {
            item_name: data.name,
            location: data.location || "",
            size: data.size,
            unit: data.unit,
            quantity: data.quantity,
            expiryDate: data.expiryDate,
            price: data.price,
            amount: data.amount,
          },
        });

        const inventory = await tx.inventory.create({
          data: {
            name: data.name,
            status: data.status || "active",
            unit: data.unit,
            sizeType: data.sizeType || "none",
            itemId: item.id,
          },
          include: {
            item: true,
          },
        });

        return inventory;
      });

      return inventory;
    } catch (error: any) {
      throw new Error(`Failed to create inventory: ${error.message}`);
    }
  }

  async getInventoryById(id: string) {
    try {
      const existingInventory = await prisma.inventory.findUnique({
        where: { id },
      });

      if (!existingInventory) return null;

      const inventories = await prisma.inventory.findMany({
        where: {
          name: existingInventory.name,
        },
        include: {
          
          receipts: {
            include: {
              item: true,
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
          
          issuance: {
            select: {
              quantity: true,
              createdAt: true,
              issuanceDirective: true,
              status: true,
              issuanceDate: true,
              inventory: {
                select: {
                  quantity: true,
                  createdAt: true,
                  item: {
                    select: {
                      amount: true,
                      unit: true,
                      size: true,
                    },
                  },
                },
              },
              issuanceDetail: {
                select: {
                  createdAt: true,
                  status: true,
                },
              },
            },
          },
          item: {
            select: {
              unit: true,
              size: true,
              item_name: true,
            }
          },
        },
      });

      const items = await prisma.item.findMany({
        where: {
          inventoryId: id,
        },
        include: {
          receipt: true
        }
      });

      if (inventories.length === 0) return null;

      const quantitySummary = {
        totalQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: 0,
      };

      const sizeQuantities: Record<string, number> = {};

      inventories.forEach((inventory) => {
        if (inventory.receipts && inventory.receipts.length > 0) {
          inventory.receipts.forEach((receipt) => {
            if (receipt.item && receipt.item.length > 0) {
              receipt.item.forEach((item) => {
                const quantity = parseInt(item.quantity || "0", 10);
                const size = item.size || "No Size";

                if (receipt.status === "pending") {
                  quantitySummary.pendingQuantity += quantity;
                } else {
                  quantitySummary.totalQuantity += quantity;
                  quantitySummary.availableQuantity += quantity;
                }

                if (receipt.status !== "pending") {
                  if (!sizeQuantities[size]) {
                    sizeQuantities[size] = 0;
                  }
                  sizeQuantities[size] += quantity;
                }
              });
            }
          });
        }

        // Account for issuances
        if (inventory.issuance && inventory.issuance.length > 0) {
          inventory.issuance.forEach((issuance) => {
            const quantity = parseInt(issuance.quantity || "0", 10);
            const size = issuance.inventory?.item?.size || "No Size";

            if (issuance.status === "pending") {
              // Pending issuances don't affect available quantity
              quantitySummary.pendingQuantity += quantity;
            } else {
              // For issued items, subtract from available quantity
              quantitySummary.totalQuantity -= quantity;
              quantitySummary.availableQuantity -= quantity;
            }

            // Adjust the size quantities for completed issuances
            if (issuance.status !== "pending" && sizeQuantities[size]) {
              sizeQuantities[size] -= quantity;
              if (sizeQuantities[size] < 0) sizeQuantities[size] = 0;
            }
          });
        }
      });

      const sizeStockLevels: Record<string, string> = {};
      Object.entries(sizeQuantities).forEach(([size, quantity]) => {
        if (quantity <= 30) {
          sizeStockLevels[size] = "Low Stock";
        } else if (quantity <= 98) {
          sizeStockLevels[size] = "Mid Stock";
        } else {
          sizeStockLevels[size] = "High Stock";
        }
      });

      return {
        ...inventories.find((inv) => inv.id === id), // Return the originally requested inventory
        quantitySummary,
        items,
        sizeQuantities,
        sizeStockLevels,
      };
    } catch (error: any) {
      throw new Error(`Failed to get inventory by ID: ${error.message}`);
    }
  }

  async getInventories(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string
  ): Promise<InventoryResponseType> {
    try {
      const skip = (page - 1) * pageSize;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { unit: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

      const [inventories] = await Promise.all([
        prisma.inventory.findMany({
          where: { ...where, status } as any,
          include: {
            receipts: {
              include: {
                item: true,
              },
            },
            issuance: true,
            item: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        }),
      ]);

      const consolidatedMap = new Map<string, any>();

      inventories.forEach((inventory) => {
        const name = inventory.name;

        if (consolidatedMap.has(name)) {
          const existing = consolidatedMap.get(name);

          if (inventory.item && existing.item) {
            const existingQuantity = parseInt(
              existing.item.quantity || "0",
              10
            );
            const newQuantity = parseInt(inventory.item.quantity || "0", 10);
            existing.item.quantity = (
              existingQuantity + newQuantity
            ).toString();
          }

          existing.receipts = [...existing.receipts, ...inventory.receipts];
          existing.issuance = [...existing.issuance, ...inventory.issuance];
        } else {
          consolidatedMap.set(name, { ...inventory });
        }
      });

      const consolidatedArray = Array.from(consolidatedMap.values()).map(
        (inventory) => {
          let totalQuantity = 0;
          let grandTotalAmount = 0;

          // Calculate totals from receipts
          inventory.receipts.forEach((receipt: any) => {
            receipt.item.forEach((item: any) => {
              const quantity = parseInt(item.quantity || "0", 10);
              const price = parseFloat(item.price || "0");

              if (receipt.status !== "pending") {
                totalQuantity += quantity;
                grandTotalAmount += quantity * price;
              }
            });
          });

          // Subtract issued quantities and their amounts
          inventory.issuance.forEach((issuance: any) => {
            if (issuance.status !== "pending") {
              const issuedQuantity = parseInt(issuance.quantity || "0", 10);
              const price = parseFloat(issuance.inventory?.item?.price || "0");

              totalQuantity -= issuedQuantity;
              grandTotalAmount -= issuedQuantity * price;
            }
          });

          // Ensure grandTotalAmount doesn't go below 0
          grandTotalAmount = Math.max(0, grandTotalAmount);

          // Determine stock level
          let stockLevel = "Out of Stock";
          if (totalQuantity > 0) {
            if (totalQuantity <= 100) {
              stockLevel = "Low Stock";
            } else if (totalQuantity <= 499) {
              stockLevel = "Mid Stock";
            } else {
              stockLevel = "High Stock";
            }
          }

          return {
            ...inventory,
            totalQuantity,
            stockLevel,
            grandTotalAmount: grandTotalAmount.toFixed(2),
          };
        }
      );

      const paginatedInventories = consolidatedArray.slice(
        skip,
        skip + pageSize
      );

      return {
        data: paginatedInventories,
        total: consolidatedMap.size,
        currentPage: page,
        totalPages: Math.ceil(consolidatedMap.size / pageSize),
      };
    } catch (error: any) {
      throw new Error(`Failed to get inventories: ${error.message}`);
    }
  }

  async issuanceInventories() {
    return await prisma.inventory.findMany({});
  }

  async createItemType(data: createItemTypeDto) {
    return await prisma.inventory.create({
      data: {
        sizeType: data.sizeType,
        name: data.name,
        unit: data.unit,
      },
    });
  }

  async fetchItemTypes() {
    return await prisma.inventory.findMany({
      select: {
        sizeType: true,
        name: true,
        unit: true,
        id: true,
      },
    });
  }

  async archiveInventory(id: string) {
    return await prisma.inventory.update({
      where: {
        id,
      },
      data: {
        status: "archived",
      },
    });
  }

  async unarchiveInventory(id: string) {
    return await prisma.inventory.update({
      where: {
        id,
      },
      data: {
        status: "active",
      },
    });
  }
}
