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
              id: true,
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
  
      // Get all issuance records related to this inventory
      const issuances = await prisma.issuance.findMany({
        where: {
          inventoryId: id,
        },
        select: {
          quantity: true,
          status: true,
          inventory: {
            select: {
              item: {
                select: {
                  size: true,
                }
              }
            }
          }
        }
      });
  
      const quantitySummary = {
        totalQuantity: 0,
        availableQuantity: 0,
        pendingQuantity: 0,
        pendingIssuanceQuantity: 0,
        withdrawnQuantity: 0,
        grandTotalAmount: 0
      };
      
      // Track quantities by size
      const sizeQuantities: Record<string, { 
        pending: number;       // Pending receipts
        available: number;     // Available quantities from non-pending receipts 
        withdrawn: number;    // Withdrawn issuances
      }> = {};
      
      // Step 1: Process receipt items to get base inventory
      items.forEach((item) => {
        const quantity = parseInt(item.quantity || "0", 10);
        // Use actual size from item or default to "No Size"
        const size = item.size || "No Size";
        const price = parseFloat(item.price || "0");
        const amount = quantity * price;
      
        // Initialize size quantities if not exists
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = { 
            pending: 0, 
            available: 0,
            pending: 0,
            withdrawn: 0
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
      
      // Step 2: Process issuances to adjust quantities
      issuances.forEach((issuance) => {
        const quantity = parseInt(issuance.quantity || "0", 10);
        
        // Use the inventory item's size from the items array as it's more reliable
        const itemForIssuance = items.find(item => 
          item.inventoryId === id && item.receipt?.status === "active"
        );
        
        const size = itemForIssuance?.size || "No Size";
        
        if (!sizeQuantities[size]) {
          sizeQuantities[size] = { 
            pending: 0, 
            available: 0,
            pending: 0,
            withdrawn: 0
          };
        }
        
        if (issuance.status === "pending") {
          // Pending issuances
          sizeQuantities[size].pending += quantity;
          quantitySummary.pendingIssuanceQuantity += quantity;
        } else if (issuance.status === "withdrawn") {
          // Withdrawn items are deducted from available
          sizeQuantities[size].withdrawn += quantity;
          quantitySummary.withdrawnQuantity += quantity;
        }
      });
      
      // Step 3: Calculate final available quantities and totals
      let totalAvailable = 0;
      
      // Process size quantities to calculate final values
      Object.keys(sizeQuantities).forEach((size) => {
        // Final available = receipts - withdrawn
        const finalAvailable = Math.max(0, sizeQuantities[size].available - sizeQuantities[size].withdrawn);
        sizeQuantities[size].available = finalAvailable;
        
        // Add to total available
        totalAvailable += finalAvailable;
      });
      
      // Update summary values
      quantitySummary.availableQuantity = totalAvailable;
      quantitySummary.totalQuantity = totalAvailable + quantitySummary.pendingQuantity;
      
      // Step 4: Create size details for UI display
      const sizeDetails: Array<{ 
        size: string; 
        pairs: string; 
        status: string; 
        type: 'pending' | 'available' | 'pending' 
      }> = [];
      
      Object.entries(sizeQuantities).forEach(([size, quantities]) => {
        // Handle pending receipt items
        if (quantities.pending > 0) {
          let stockLevel = determineStockLevel(quantities.pending);
          
          sizeDetails.push({
            size,
            pairs: String(quantities.pending),
            status: stockLevel,
            type: 'pending'
          });
        }
        
        // Handle pending issuance items
        if (quantities.pending > 0) {
          let stockLevel = determineStockLevel(quantities.pending);
          
          sizeDetails.push({
            size,
            pairs: String(quantities.pending),
            status: stockLevel,
            type: 'pending'
          });
        }
        
        // Handle available items
        if (quantities.available > 0) {
          let stockLevel = determineStockLevel(quantities.available);
          
          sizeDetails.push({
            size,
            pairs: String(quantities.available),
            status: stockLevel,
            type: 'available'
          });
        }
      });
  
      // Helper function for determining stock level
      function determineStockLevel(quantity: number): string {
        if (quantity <= 30) return "Low Stock";
        if (quantity <= 98) return "Mid Stock";
        return "High Stock";
      }
  
      const groupedSizeDetails = {
        pending: sizeDetails.filter(detail => detail.type === 'pending')
          .map(({ size, pairs, status }) => ({ size, pairs, status })),
        available: sizeDetails.filter(detail => detail.type === 'available')
          .map(({ size, pairs, status }) => ({ size, pairs, status })),
        total: Object.entries(sizeQuantities).map(([size, quantities]) => {
          // Total = available (which is already adjusted for withdrawn) + pending
          const totalPairs = quantities.available + quantities.pending;
          let stockLevel = determineStockLevel(totalPairs);
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
          grandTotalAmount: new Intl.NumberFormat('en-EN', {maximumFractionDigits: 2}).format(quantitySummary.grandTotalAmount)
        },
        items,
        sizeDetails: groupedSizeDetails,
        detailedQuantities: sizeQuantities,
        // For debugging
        debug: {
          withdrawnTotal: quantitySummary.withdrawnQuantity,
          pendingIssuanceTotal: quantitySummary.pendingIssuanceQuantity
        }
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
  
      const inventories = await prisma.inventory.findMany({
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
      });
  
      // Remove consolidation logic and process each inventory individually
      const processedInventories = inventories.map((inventory) => {
        let totalQuantity = 0;
        let grandTotalAmount = 0;
        
        // Find all items associated with this specific inventory ID
        inventory.receipts.flatMap(receipt => 
          receipt.item.filter(item => item.inventoryId === inventory.id)
        );
        
        // Calculate totals from receipts for this specific inventory
        inventory.receipts.forEach((receipt: any) => {
          receipt.item.forEach((item: any) => {
            if (item.inventoryId === inventory.id) { // Only count items for this inventory
              const quantity = parseInt(item.quantity || "0", 10);
              const price = parseFloat(item.price || "0");
  
              if (receipt.status !== "pending") {
                totalQuantity += quantity;
                grandTotalAmount += quantity * price;
              }
            }
          });
        });
  
        // Subtract issued quantities and their amounts for this specific inventory
        inventory.issuance.forEach((issuance: any) => {
          if (issuance.status !== "pending" && issuance.inventoryId === inventory.id) {
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
          grandTotalAmount: new Intl.NumberFormat('en-EN', {maximumFractionDigits: 2}).format(grandTotalAmount),
        };
      });
  
      const total = processedInventories.length;
      const paginatedInventories = processedInventories.slice(skip, skip + pageSize);
  
      return {
        data: paginatedInventories,
        total: total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
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
