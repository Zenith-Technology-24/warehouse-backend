import { Inventory, ProductStatus, SizeType } from "@prisma/client";
import prisma from "@/generic/prisma";

import {
  determineStockLevel,
  initializeSizeQuantities,
  createQuantitySummary,
  formatCurrency,
  processOriginalInventoryItem,
  processItems,
  processReturnedTransactions,
  processReturnedItems,
  processIssuanceDetails,
  processInventoryItems,
  processWithdrawnIssuance,
  calculateAvailableQuantities,
  generateSizeDetailsGroups,
  processInventoryItems2,
} from "@/utils/inventoryHelper";

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

      const query = await prisma.inventory.findUnique({
        where: { id, status: { not: "archived" }, deletedAt: null },
        include: {
          item: true,
          receipts: {
            where: { status: { not: "archived" } },
            include: {
              item: { where: { inventoryId: id } },
              user: { select: { firstname: true, lastname: true } },
            },
          },
          issuance: {
            where: { status: { not: "archived" } },
            include: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: { select: { name: true } },
                },
              },
            },
          },
          issuanceDetails: {
            where: { status: { not: "archived" } },
            include: {
              endUser: true,
              issuance: {
                include: {
                  inventory: true,
                  user: {
                    select: {
                      firstname: true,
                      lastname: true,
                      roles: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },
          ReturnedItems: {
            where: { status: { not: "archived" } },
            select: {
              id: true,
              itemName: true,
              size: true,
              receiptRef: true,
              status: true,
              itemId: true,
            },
          },
          InventoryTransaction: {
            where: { status: { not: "archived" } },
            select: {
              id: true,
              quantity: true,
              type: true,
              price: true,
              amount: true,
              size: true,
            },
          },
        },
      });

      if (!query) return null;

      const issuanceData = await Promise.all(
        query?.issuanceDetails.map(async (detail) => {
          const inventoryData = await prisma.inventory.findUnique({
            where: {
              id: detail.inventoryId || "",
              status: { not: "archived" },
            },
          });
          return {
            ...detail,
            user: detail.issuance.user,
            issuance: undefined,
            inventory: inventoryData,
          };
        }) || []
      );

      const inventory = {
        ...query,
        issuanceDetails: query?.issuance,
        issuance: issuanceData,
      };

      const items = await prisma.item.findMany({
        where: {
          inventoryId: id,
          receipt: {
            status: {
              not: "archived",
            },
          },
        },
        include: {
          receipt: {
            where: { status: { not: "archived" } },
            include: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      const quantitySummary = createQuantitySummary();
      const sizeQuantities = {};

      processOriginalInventoryItem(inventory, sizeQuantities, quantitySummary);

      processItems(items, sizeQuantities, quantitySummary);

      if (inventory.InventoryTransaction) {
        processReturnedTransactions(
          inventory.InventoryTransaction,
          sizeQuantities,
          quantitySummary
        );
      }

      if (inventory.ReturnedItems && inventory.ReturnedItems.length > 0) {
        inventory.ReturnedItems = await processReturnedItems(
          inventory.ReturnedItems,
          sizeQuantities,
          quantitySummary
        );
      }

      const issuances = await prisma.issuanceDetail.findMany({
        where: { inventoryId: inventory.id, status: { not: "archived" } },
        include: {
          issuance: {
            include: {
              user: {
                select: {
                  firstname: true,
                  lastname: true,
                  roles: { select: { name: true } },
                },
              },
            },
          },
        },
      });

      const issuance = await Promise.all(
        issuances.map(async (detail) => {
          const [itemData, issuanceData] = await Promise.all([
            prisma.item.findFirst({
              where: { issuanceDetailId: detail.id || "" },
            }),
            prisma.issuance.findUnique({
              where: { id: detail.issuanceId || "" },
            }),
          ]);

          return {
            ...detail,
            issuanceDirective: issuanceData?.issuanceDirective,
            user: detail.issuance.user,
            issuance: undefined,
            ...itemData,
          };
        })
      );

      processIssuanceDetails(issuance || [], sizeQuantities, quantitySummary);

      processInventoryItems(items, sizeQuantities);

      processWithdrawnIssuance(
        inventory.issuanceDetails,
        items,
        sizeQuantities,
        inventory
      );

      const totalAvailable = calculateAvailableQuantities(sizeQuantities);

      quantitySummary.availableQuantity =
        totalAvailable - quantitySummary.pendingQuantity;
      quantitySummary.totalQuantity = totalAvailable;

      const groupedSizeDetails = generateSizeDetailsGroups(sizeQuantities);

      const newItems = await processInventoryItems2(items, id);

      return {
        ...inventory,
        quantitySummary: {
          ...quantitySummary,
          returnedQuantity: quantitySummary.returnedQuantity,
          grandTotalAmount: formatCurrency(Math.max(0, quantitySummary.grandTotalAmount)),
        },
        sizeDetails: groupedSizeDetails,
        detailedQuantities: sizeQuantities,
        issuance: issuance.filter((iss) => iss.status !== "withdrawn"),
        items: newItems
          .filter((item) => item.issuanceDetailId == null)
          .filter((item) => !item.is_consumed),
        receipt: undefined,
      };
    } catch (error: any) {
      throw new Error(`Failed to get inventory by ID: ${error.message}`);
    }
  }

  async getInventories(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string,
    filter?: string
  ): Promise<InventoryResponseType> {
    try {
      filter = filter === "All" ? "" : filter;

      const skip = filter ? undefined : (page - 1) * pageSize;
      const take = filter ? undefined : pageSize;

      const where = search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { unit: { contains: search, mode: "insensitive" } },
            ],
          }
        : {};

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
              issuanceId: true,
            },
          },

          ReturnedItems: {
            select: {
              id: true,
              itemName: true,
              size: true,
              receiptRef: true,
              status: true,
              itemId: true,
            },
          },

          InventoryTransaction: {
            select: {
              id: true,
              quantity: true,
              type: true,
              price: true,
              amount: true,
              
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take,
      });

      const processedInventories = inventories.map((inventory) => {
        let totalQuantity = 0;
        let availableQuantity = 0;
        let pendingQuantity = 0;
        let pendingIssuanceQuantity = 0;
        let withdrawnQuantity = 0;
        let returnedQuantity = 0;
        let grandTotalAmount = 0;

        if (inventory.item) {
          const quantity = parseInt(inventory.item.quantity || "0", 10);
          const price = parseFloat(inventory.item.price || "0");

          totalQuantity += quantity;
          availableQuantity += quantity;
          grandTotalAmount += quantity * price;
        }
        let currentPrice = 0;

        inventory.receipts.forEach((receipt) => {
          // Skip archived receipts
          if (receipt.status === "archived") return;
          
          receipt.item
            .filter((i) => (i.issuanceDetailId === null))
            .forEach((item) => {
              if (item.inventoryId === inventory.id) {
                const quantity = parseInt(item.quantity || "0", 10);
                currentPrice = parseFloat(item.price || "0");
                if (receipt.status === "pending") {
                  pendingQuantity += quantity;
                } else {
                  totalQuantity += quantity;
                  availableQuantity += quantity;
                  grandTotalAmount += quantity * currentPrice;
                }
              }
            });
        });

        inventory.InventoryTransaction.forEach((transaction) => {
          // Skip archived transactions
          if (transaction.status === "archived") return;
          
          const quantity = parseInt(transaction.quantity || "0", 10);
          const price = parseFloat(transaction.price || "0");

          if (transaction.type === "RETURNED") {
            returnedQuantity += quantity;

            availableQuantity += quantity;
            totalQuantity += quantity;
            grandTotalAmount += quantity * price;
          }
        });

        if (inventory.ReturnedItems && inventory.ReturnedItems.length > 0) {
          inventory.ReturnedItems.forEach((item) => {
            // Skip archived returned items
            if (item.status === "archived") return;
            
            const matchingItem = inventory.receipts
              .flatMap((receipt) => {return {...receipt.item, status: receipt.status}})
              .find((i) => i.id === item.itemId && i.status !== "archived");

            if (matchingItem) {
              const quantity = 1;
              const price = parseFloat(matchingItem.price || "0");

              returnedQuantity += quantity;
              availableQuantity += quantity;
              totalQuantity += quantity;
              grandTotalAmount += quantity * price;
            }
          });
        }

        inventory.issuanceDetails.forEach((detail) => {
          // Skip archived issuance details
          if (detail.status === "archived") return;
          
          const issuedQuantity = parseInt(detail.quantity || "0", 10);
          if (detail.status === "pending") {
            pendingIssuanceQuantity += issuedQuantity;
          } else if (detail.status === "withdrawn") {
            withdrawnQuantity += issuedQuantity;
            availableQuantity -= issuedQuantity;
            grandTotalAmount -= issuedQuantity * currentPrice;
          }
        });

        if (inventory.issuance && inventory.issuance.status === "withdrawn") {
          // Skip if issuance is archived
          if (inventory.issuance.status === "withdrawn") {
            const issuedQuantity = parseInt(
              inventory.issuance.quantity || "0",
              10
            );

            withdrawnQuantity += issuedQuantity;
            availableQuantity -= issuedQuantity;
          }
        }

        availableQuantity = Math.max(0, availableQuantity);
        grandTotalAmount = Math.max(0, grandTotalAmount);

        totalQuantity = Math.max(0, totalQuantity - withdrawnQuantity);

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
          availableQuantity,
          returnedQuantity,
          stockLevel,
          grandTotalAmount: new Intl.NumberFormat("en-EN", {
            maximumFractionDigits: 2,
          }).format(grandTotalAmount),
        };
      });

      let filteredInventories = processedInventories;
      let totalCount = 0;

      if (!filter) {
        totalCount = await prisma.inventory.count({
          where: {
            ...where,
            status: status as ProductStatus | undefined,
          } as any,
        });
      } else {
        filteredInventories = processedInventories.filter(
          (inv) => inv.stockLevel === filter
        );
        totalCount = filteredInventories.length;
      }

      const paginatedInventories = filter
        ? filteredInventories.slice((page - 1) * pageSize, page * pageSize)
        : filteredInventories;

      return {
        data: paginatedInventories.filter((inv) => inv.receipts.length > 0),
        total: totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize),
      };
    } catch (error: any) {
      throw new Error(`Failed to get inventories: ${error.message}`);
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
        createdAt: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { unit: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

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
      });

      const processedInventories = inventories.map((inventory) => {
        let totalQuantity = 0;
        let grandTotalAmount = 0;

        if (inventory.item) {
          const quantity = parseInt(inventory.item.quantity || "0", 10);
          const price = parseFloat(inventory.item.price || "0");

          totalQuantity += quantity;
          grandTotalAmount += quantity * price;
        }

        inventory.receipts.forEach((receipt) => {
          receipt.item.forEach((item) => {
            if (item.inventoryId === inventory.id) {
              const quantity = parseInt(item.quantity || "0", 10);
              const price = parseFloat(item.price || "0");
              if (receipt.status !== "pending") {
                totalQuantity += quantity;
                grandTotalAmount += quantity * price;
              }
            }
          });
        });

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

        totalQuantity = Math.max(0, totalQuantity);
        grandTotalAmount = Math.max(0, grandTotalAmount);

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

      return processedInventories;
    } catch (error) {
      console.error("error fetching activity logs", error);
      throw error;
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
      where: {
        deletedAt: null,
      },
      select: {
        sizeType: true,
        name: true,
        unit: true,
        id: true,
      },
    });

    const consolidatedMap = new Map();

    inventories.forEach((inventory) => {
      if (!consolidatedMap.has(inventory.name)) {
        consolidatedMap.set(inventory.name, inventory);
      }
    });

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

  async deleteItem(id: string) {
    return await prisma.inventory.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async updateInventory(
    id: string,
    data: { name: string; sizeType: SizeType; unit: string }
  ) {
    return await prisma.inventory.update({
      where: {
        id,
      },
      data: {
        name: data.name,
        sizeType: data.sizeType,
        unit: data.unit,
      },
    });
  }
}
