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
  
      // Get the inventory with all related data using a single query
      const query = await prisma.inventory.findUnique({
        where: { id },
        include: {
          item: true,
          receipts: {
            include: {
              item: {
                where: { inventoryId: id }, // Only include items related to this inventory
              },
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                },
              },
            },
          },
          issuance: {
            include: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: {
                    select: {
                      name: true,
                    },
                  },
                },
              }
            }
          },
          issuanceDetails: {
            include: {
              endUser: true,
              issuance: {
                include: {
                  user: {
                    select: {
                      firstname: true,
                      lastname: true,
                      roles: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  }
                },
              },
            },
          },
        },
      });

      const inventory = {
        ...query,
        issuanceDetails: query?.issuance,
        issuance: query?.issuanceDetails.map((detail) => {
          return {
            ...detail,
            user: detail.issuance.user,
            issuance: undefined
          }
        })
      };
  
      if (!inventory) return null;
  
      // Fetch all items directly associated with this inventory
      const items = await prisma.item.findMany({
        where: { inventoryId: id },
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
                    },
                  },
                },
              },
            },
          },
        },
      });
  
      // Initialize quantity tracking
      const quantitySummary = {
        totalQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: 0,
        pendingIssuanceQuantity: 0,
        withdrawnQuantity: 0,
        grandTotalAmount: 0,
      };
  
      // Track quantities by size
      const sizeQuantities: Record<
        string,
        {
          pending: number; // Pending receipts
          available: number; // Available quantities from non-pending receipts
          withdrawn: number; // Withdrawn issuances
        }
      > = {};
  
      // Step 1: Process direct items linked to this inventory
      if (inventory.item) {
        const quantity = parseInt(inventory.item.quantity || "0", 10);
        const size = inventory.item.size || "No Size";
        const price = parseFloat(inventory.item.price || "0");
        const amount = quantity * price;
  
        // Initialize size quantities if not exists
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = {
            pending: 0,
            available: 0,
            withdrawn: 0,
          };
        }
  
        // Add to available
        sizeQuantities[size].available += quantity;
        quantitySummary.grandTotalAmount += amount;
      }
  
      // Step 2: Process receipt items to add to inventory
      items.forEach((item) => {
        const quantity = parseInt(item.quantity || "0", 10);
        const size = item.size || "No Size";
        const price = parseFloat(item.price || "0");
        const amount = quantity * price;
  
        // Initialize size quantities if not exists
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = {
            pending: 0,
            available: 0,
            withdrawn: 0,
          };
        }
  
        // Handle pending vs. active receipts
        if (item.receipt?.status === "pending") {
          quantitySummary.pendingQuantity += quantity;
          sizeQuantities[size].pending += quantity;
        } else {
          // Only count as available if receipt is not pending
          sizeQuantities[size].available += quantity;
          quantitySummary.grandTotalAmount += amount;
        }
      });
  
      // Step 3: Process issuanceDetails to adjust quantities
      inventory.issuance?.forEach((detail) => {
        const quantity = parseInt(detail.quantity || "0", 10);
        
        // Find the most appropriate item for size information
        const itemForSize = items.find(
          item => item.receipt?.status === "active"
        ) || inventory.item;
        
        const size = itemForSize?.size || "No Size";
        
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = {
            pending: 0,
            available: 0,
            withdrawn: 0,
          };
        }
  
        if (detail.status === "pending") {
          // Pending issuances - mark as pending but don't reduce available yet
          sizeQuantities[size].pending += quantity;
          quantitySummary.pendingIssuanceQuantity += quantity;
          quantitySummary.pendingQuantity += quantity;
        } else if (detail.status === "withdrawn") {
          // Withdrawn items are tracked for reporting
          sizeQuantities[size].withdrawn += quantity;
          quantitySummary.withdrawnQuantity += quantity;
        }
      });
  
      // Also check legacy issuance relation (for backward compatibility)
      if (inventory.issuanceDetails && inventory.issuanceDetails.status === "withdrawn") {
        const quantity = parseInt(inventory.issuanceDetails.quantity || "0", 10);
        
        // Find size from an active item
        const itemForSize = items.find(
          item => item.receipt?.status === "active"
        ) || inventory.item;
        
        const size = itemForSize?.size || "No Size";
        
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = {
            pending: 0,
            available: 0,
            withdrawn: 0,
          };
        }
        
        sizeQuantities[size].withdrawn += quantity;
        quantitySummary.withdrawnQuantity += quantity;
      }
  
      // Step 4: Calculate final available quantities and totals
      let totalAvailable = 0;
  
      // Process size quantities to calculate final values
      Object.keys(sizeQuantities).forEach((size) => {
        // Final available = (receipts) - (withdrawn)
        const finalAvailable = Math.max(
          0,
          sizeQuantities[size].available - sizeQuantities[size].withdrawn
        );
        sizeQuantities[size].available = finalAvailable;
  
        // Add to total available
        totalAvailable += finalAvailable;
      });
  
      // Update summary values
      quantitySummary.availableQuantity = totalAvailable;
      quantitySummary.totalQuantity = 
        totalAvailable + quantitySummary.pendingQuantity;
  
      // Step 5: Create size details for UI display
      const sizeDetails: Array<{
        size: string;
        pairs: string;
        status: string;
        type: "pending" | "available" | "withdrawn";
      }> = [];
  
      // Helper function for determining stock level
      function determineStockLevel(quantity: number): string {
        if (quantity <= 30) return "Low Stock";
        if (quantity <= 98) return "Mid Stock";
        return "High Stock";
      }
  
      Object.entries(sizeQuantities).forEach(([size, quantities]) => {
        // Handle pending receipt items
        if (quantities.pending > 0) {
          const stockLevel = determineStockLevel(quantities.pending);
          sizeDetails.push({
            size,
            pairs: String(quantities.pending),
            status: stockLevel,
            type: "pending",
          });
        }
  
        // Handle pending issuance items
        if (quantities.pending > 0) {
          const stockLevel = determineStockLevel(quantities.pending);
          sizeDetails.push({
            size,
            pairs: String(quantities.pending),
            status: stockLevel,
            type: "pending",
          });
        }
  
        // Handle available items
        if (quantities.available > 0) {
          const stockLevel = determineStockLevel(quantities.available);
          sizeDetails.push({
            size,
            pairs: String(quantities.available),
            status: stockLevel,
            type: "available",
          });
        }
      });
  
      const groupedSizeDetails = {
        pending: sizeDetails
          .filter((detail) => detail.type === "pending")
          .map(({ size, pairs, status }) => ({ size, pairs, status })),
        available: sizeDetails
          .filter((detail) => detail.type === "available")
          .map(({ size, pairs, status }) => ({ size, pairs, status })),
        total: Object.entries(sizeQuantities).map(([size, quantities]) => {
          // Total = available (already adjusted for withdrawn) + pending
          const totalPairs = quantities.available + quantities.pending;
          const stockLevel = determineStockLevel(totalPairs);
          return {
            size,
            pairs: String(totalPairs),
            status: stockLevel,
          };
        }),
      };
  
      return {
        ...inventory,
        quantitySummary: {
          ...quantitySummary,
          grandTotalAmount: new Intl.NumberFormat("en-EN", {
            maximumFractionDigits: 2,
          }).format(quantitySummary.grandTotalAmount),
        },
        items,
        sizeDetails: groupedSizeDetails,
        detailedQuantities: sizeQuantities,
        // For debugging
        debug: {
          withdrawnTotal: quantitySummary.withdrawnQuantity,
          pendingIssuanceTotal: quantitySummary.pendingIssuanceQuantity,
        },
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

      // Get total count first for pagination
      const totalCount = await prisma.inventory.count({
        where: { ...where, status: status as ProductStatus | undefined } as any,
      });

      // Fetch inventories with all necessary relationships
      const inventories = await prisma.inventory.findMany({
        where: { ...where, status: status as ProductStatus | undefined } as any,
        include: {
          item: true,
          receipts: {
            include: {
              item: true,
            },
          },
          issuance: {
            select: {
              id: true,
              status: true,
              quantity: true,
              issuanceDetails: true,
            },
          },
          issuanceDetails: {
            select: {
              quantity: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: pageSize,
      });

      // Process each inventory to calculate accurate quantities and amounts
      const processedInventories = inventories.map((inventory) => {
        let totalQuantity = 0;
        let grandTotalAmount = 0;

        // 1. First process direct items linked to this inventory
        if (inventory.item) {
          const quantity = parseInt(inventory.item.quantity || "0", 10);
          const price = parseFloat(inventory.item.price || "0");

          totalQuantity += quantity;
          grandTotalAmount += quantity * price;
        }

        // 2. Process items from receipts
        inventory.receipts.forEach((receipt) => {
          receipt.item.forEach((item) => {
            // Only count items that belong to this inventory
            if (item.inventoryId === inventory.id) {
              const quantity = parseInt(item.quantity || "0", 10);
              const price = parseFloat(item.price || "0");

              // Only count if receipt is approved (not pending)
              if (receipt.status !== "pending") {
                totalQuantity += quantity;
                grandTotalAmount += quantity * price;
              }
            }
          });
        });

        // 3. Subtract issuance quantities (withdrawn items)
        // Check both direct issuance and issuanceDetails
        inventory.issuanceDetails.forEach((detail) => {
          if (detail.status === "withdrawn") {
            const issuedQuantity = parseInt(detail.quantity || "0", 10);
            const price = inventory.item
              ? parseFloat(inventory.item.price || "0")
              : 0;

            totalQuantity -= issuedQuantity;
            grandTotalAmount -= issuedQuantity * price;
          }
        });

        // Also check the legacy issuance relation
        if (inventory.issuance && inventory.issuance.status === "withdrawn") {
          const issuedQuantity = parseInt(
            inventory.issuance.quantity || "0",
            10
          );
          const price = inventory.item
            ? parseFloat(inventory.item.price || "0")
            : 0;

          totalQuantity -= issuedQuantity;
          grandTotalAmount -= issuedQuantity * price;
        }

        // Ensure values don't go below 0
        totalQuantity = Math.max(0, totalQuantity);
        grandTotalAmount = Math.max(0, grandTotalAmount);

        // Determine stock level based on available quantity
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
          grandTotalAmount: new Intl.NumberFormat("en-EN", {
            maximumFractionDigits: 2,
          }).format(grandTotalAmount),
        };
      });

      return {
        data: processedInventories,
        total: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
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
