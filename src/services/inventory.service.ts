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
            },
          },
        },
      });

      const items = await prisma.item.findMany({
        where: {
          inventoryId: id,
        },
        include: {
          receipt: {
            include: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: {
                    select: {
                      name: true,
                    }
                  },
                },
              },
            },
          },
        },
      });

      if (inventories.length === 0) return null;

      const quantitySummary = {
        totalQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: 0,
        grandTotalAmount: 0
      };
      
      const sizeQuantities: Record<string, { pending: number; available: number }> = {};
      const sizeDetails: Array<{ size: string; pairs: string; status: string; type: 'pending' | 'available' }> = [];
      
      items.forEach((item) => {
        const quantity = parseInt(item.quantity || "0", 10);
        const size = item.size || "No Size";
        const price = parseFloat(item.price || "0");
        const amount = quantity * price;
      
        // Initialize size quantities if not exists
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = { pending: 0, available: 0 };
        }
      
        if (item.receipt?.status === "pending") {
          quantitySummary.pendingQuantity += quantity;
          sizeQuantities[size].pending += quantity;
      
          // Update or create pending entry
          const existingPendingEntry = sizeDetails.find(
            detail => detail.size === size && detail.type === 'pending'
          );
          let stockLevel = "High Stock";
          if (sizeQuantities[size].pending <= 30) {
            stockLevel = "Low Stock";
          } else if (sizeQuantities[size].pending <= 98) {
            stockLevel = "Mid Stock";
          }
      
          if (existingPendingEntry) {
            existingPendingEntry.pairs = String(sizeQuantities[size].pending);
            existingPendingEntry.status = stockLevel;
          } else {
            sizeDetails.push({
              size,
              pairs: String(sizeQuantities[size].pending),
              status: stockLevel,
              type: 'pending'
            });
          }
        } else {
          quantitySummary.totalQuantity += quantity;
          quantitySummary.availableQuantity += quantity;
          quantitySummary.grandTotalAmount += amount;
          sizeQuantities[size].available += quantity;
      
          // Update or create available entry
          const existingAvailableEntry = sizeDetails.find(
            detail => detail.size === size && detail.type === 'available'
          );
          let stockLevel = "High Stock";
          if (sizeQuantities[size].available <= 30) {
            stockLevel = "Low Stock";
          } else if (sizeQuantities[size].available <= 98) {
            stockLevel = "Mid Stock";
          }
      
          if (existingAvailableEntry) {
            existingAvailableEntry.pairs = String(sizeQuantities[size].available);
            existingAvailableEntry.status = stockLevel;
          } else {
            sizeDetails.push({
              size,
              pairs: String(sizeQuantities[size].available),
              status: stockLevel,
              type: 'available'
            });
          }
        }
      });
      
      // Ensure grandTotalAmount doesn't go below 0
      quantitySummary.grandTotalAmount = Math.max(0, quantitySummary.grandTotalAmount);

      const groupedSizeDetails = {
        pending: sizeDetails.filter(detail => detail.type === 'pending')
          .map(({ size, pairs, status }) => ({ size, pairs, status })),
        available: sizeDetails.filter(detail => detail.type === 'available')
          .map(({ size, pairs, status }) => ({ size, pairs, status })),
        total: Object.entries(sizeQuantities).map(([size, quantities]) => {
          const totalPairs = quantities.pending + quantities.available;
          let stockLevel = "High Stock";
          if (totalPairs <= 30) {
            stockLevel = "Low Stock";
          } else if (totalPairs <= 98) {
            stockLevel = "Mid Stock";
          }
          return {
            size,
            pairs: String(totalPairs),
            status: stockLevel
          };
        })
      };

      return {
        ...inventories.find((inv) => inv.id === id),
        quantitySummary: {
          ...quantitySummary,
          grandTotalAmount: quantitySummary.grandTotalAmount.toFixed(2)
        },
        items,
        sizeDetails: groupedSizeDetails, // Now returns an object with pending and available arrays
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
    const inventories = await prisma.inventory.findMany({
      select: {
        sizeType: true,
        name: true,
        unit: true,
        id: true,
      },
    });

    // Create a Map to consolidate items by name
    const consolidatedMap = new Map();

    inventories.forEach((inventory) => {
      if (!consolidatedMap.has(inventory.name)) {
        consolidatedMap.set(inventory.name, inventory);
      }
    });

    // Convert Map back to array
    return Array.from(consolidatedMap.values());
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
