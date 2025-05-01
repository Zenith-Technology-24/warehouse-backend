import prisma from "@/generic/prisma";
import { ProductStatus } from "@prisma/client";

export interface DashboardSummary {
  totalItems: number;
  totalInStock: number;
  totalIssuedItems: number;
  totalReceiptItems: number;
  totalReturnedItems: number;
  totalAmount: string;
  users: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
  };
}

export class DashboardService {
  async getSummary(): Promise<DashboardSummary> {
    try {
      const inventories = await prisma.inventory.findMany({
        where: {
          status: {
            not: "archived",
          },
        },
        include: {
          receipts: {
            where: {
              status: {
                not: "archived",
              },
            },
            include: {
              item: true
            },
          },
          issuanceDetails: {
            where: {
              status: {
                not: "archived",
              },
            },
            select: {
              quantity: true,
              status: true,
              issuanceId: true,
              items: {
                select: {
                  id: true,
                  quantity: true,
                  amount: true,
                  price: true,
                  issuanceDetailId: true,
                },
              }
            },
          },
          ReturnedItems: {
            where: {
              status: {
                not: "archived",
              },
            },
            select: {
              id: true,
              receiptRef: true,
            },
          },
          InventoryTransaction: {
            where: {
              status: {
                not: "archived",
              },
            },
            select: {
              id: true,
              quantity: true,
              type: true,
              price: true,
              amount: true,
              issuanceId: true,
              receiptId: true,
            },
          },
        },
      });

      let totalInStock = 0;
      let totalIssuedItems = 0;
      let totalReceiptItems = 0;
      let totalReturnedItems = 0;
      let totalAmount = 0;
      let currentPrice = 0;
      inventories.forEach((inventory) => {


        inventory.receipts.forEach((receipt) => {
          receipt.item
            .filter((i) => i.issuanceDetailId === null)
            .forEach((item) => {
              if (item.inventoryId === inventory.id) {
                const quantity = parseInt(item.quantity || "0");
                currentPrice = parseFloat(item.price || "0");
                if (receipt.status !== "pending") {
                  totalReceiptItems += quantity;
                  totalInStock += quantity;
                  totalAmount += quantity * currentPrice;
                }
              }
            });
        });

        inventory.issuanceDetails.forEach((detail) => {
          const issuedQuantity = parseInt(detail.quantity || "0");

          if (detail.status === "withdrawn") {
            totalIssuedItems += issuedQuantity;
            totalInStock -= issuedQuantity;;
            totalAmount -= issuedQuantity * currentPrice;
          }
        });

        inventory.InventoryTransaction.forEach((transaction) => {
          const quantity = parseInt(transaction.quantity || "0");

          if (transaction.type === "RETURNED") {
            if(inventory.ReturnedItems.length > 0){
              totalReturnedItems += quantity;

              totalInStock += quantity;
              totalAmount += quantity * currentPrice;
            }
          } else if (transaction.type === "ISSUANCE") {
            // if (
            //   transaction.issuanceId &&
            //   !inventory.issuanceDetails.some(
            //     (d) =>
            //       d.status === "pending" &&
            //       d.issuanceId === transaction.issuanceId
            //   )
            // ) {
            // }
          } else if (transaction.type === "RECEIPT") {
            if (
              !inventory.receipts.some((r) => r.id === transaction.receiptId)
            ) {
              totalReceiptItems += quantity;
            }
          }
        });

        if (inventory.ReturnedItems && inventory.ReturnedItems.length > 0) {
          const returnedFromTransactions =
            inventory.InventoryTransaction.filter(
              (t) => t.type === "RETURNED"
            ).length;

          if (returnedFromTransactions === 0) {
            const returnCount = inventory.ReturnedItems.length;
            totalReturnedItems += returnCount;
            totalInStock += returnCount;

            inventory.ReturnedItems.forEach((item) => {
              const originalItem = inventory.receipts
                .flatMap((receipt) => receipt.item)
                .find((i) => i.receiptRef === item.receiptRef);

              if (originalItem) {
                const price = parseFloat(originalItem.price || "0");
                totalAmount += price;
              }
            });
          }
        }
      });

      totalInStock = Math.max(0, totalInStock);
      totalAmount = Math.max(0, totalAmount);

      // const distinctItems = await prisma.item.findMany();

      // const totalItems = distinctItems.reduce((acc, item) => {
      //   const itemQuantity = parseInt(item.quantity || "0");
      //   acc += itemQuantity;
      //   return acc;
      // }, 0);

      const stonks = await this.getItemsByStockLevel();
      const users = await this.getUserReports();

      const totalReceived = await prisma.receipt.count({
        where: {
          status: {
            not: "archived",
          },
        },
      });
      const totalIssued = await prisma.issuance.count({
        where: {
          status: {
            not: "archived",
          },
          issuanceStatus: {
            not: "archived",
          }
        },
      });
      return {
        totalItems: totalReceiptItems,
        totalInStock,
        totalIssuedItems: totalIssued,
        totalReceiptItems: totalReceived,
        totalReturnedItems,
        users,
        ...stonks,
        totalAmount: new Intl.NumberFormat("en-EN", {
          style: "currency",
          currency: "PHP",
          maximumFractionDigits: 2,
        }).format(totalAmount),
      };
    } catch (error: any) {
      throw new Error(`Failed to get dashboard summary: ${error.message}`);
    }
  }

  async getItemsByStatus(): Promise<Record<string, number>> {
    try {
      const inventories = await prisma.inventory.findMany();

      const statusCounts: Record<string, number> = {
        active: 0,
        archived: 0,
        withdrawn: 0,
        pending: 0,
      };

      inventories.forEach((inventory) => {
        if (statusCounts[inventory.status]) {
          statusCounts[inventory.status]++;
        }
      });

      return statusCounts;
    } catch (error: any) {
      throw new Error(`Failed to get items by status: ${error.message}`);
    }
  }

  async getItemsByStockLevel(): Promise<{
    counts: {
      highStock: number;
      midStock: number;
      lowStock: number;
      outOfStock: number;
      total: number;
    };
    percentages: {
      highStock: string | number;
      midStock: string | number;
      lowStock: string | number;
      outOfStock: string | number;
    };
  }> {
    try {
      const inventories = await prisma.inventory.findMany({
        where: {
          status: "active",
        },
        include: {
          item: true,
          receipts: {
            include: {
              item: true,
            },
          },
          issuanceDetails: {
            select: {
              quantity: true,
              status: true,
              issuanceId: true,
            },
          },
          ReturnedItems: true,
          InventoryTransaction: {
            select: {
              quantity: true,
              type: true,
              date: true,
            },
          },
        },
      });

      // Initialize counters
      const counts = {
        highStock: 0,
        midStock: 0,
        lowStock: 0,
        outOfStock: 0,
        total: 0,
      };

      inventories.forEach((inventory) => {
        let availableQuantity = 0;
        let withdrawnQuantity = 0;

        // Calculate available quantity from base item
        if (inventory.item) {
          const quantity = parseInt(inventory.item.quantity || "0");
          availableQuantity += quantity;
        }

        // Add quantities from receipts
        inventory.receipts.forEach((receipt) => {
          receipt.item
            .filter((i) => i.issuanceDetailId === null)
            .forEach((item) => {
              if (item.inventoryId === inventory.id) {
                const quantity = parseInt(item.quantity || "0");
                if (receipt.status !== "pending") {
                  availableQuantity += quantity;
                }
              }
            });
        });

        // Subtract issued quantities
        inventory.issuanceDetails.forEach((detail) => {
          const issuedQuantity = parseInt(detail.quantity || "0");
          if (detail.status === "withdrawn") {
            withdrawnQuantity += issuedQuantity;
            availableQuantity -= issuedQuantity;
          }
        });

        // Add returned quantities
        inventory.InventoryTransaction.forEach((transaction) => {
          if (transaction.type === "RETURNED") {
            const quantity = parseInt(transaction.quantity || "0");
            availableQuantity += quantity;
          }
        });

        // Handle returned items not in transactions
        if (inventory.ReturnedItems && inventory.ReturnedItems.length > 0) {
          const alreadyCountedReturns = inventory.InventoryTransaction.filter(
            (t) => t.type === "RETURNED"
          ).length;

          if (alreadyCountedReturns === 0) {
            const returnCount = inventory.ReturnedItems.length;
            availableQuantity += returnCount;
          }
        }

        // Ensure non-negative available quantity
        availableQuantity = Math.max(0, availableQuantity);

        // Determine stock level and increment counter
        if (availableQuantity === 0) {
          counts.outOfStock++;
        } else if (availableQuantity <= 100) {
          counts.lowStock++;
        } else if (availableQuantity <= 499) {
          counts.midStock++;
        } else {
          counts.highStock++;
        }
      });

      // Calculate total and percentages
      counts.total =
        counts.highStock +
        counts.midStock +
        counts.lowStock +
        counts.outOfStock;

      const calculatePercentage = (value: number): string => {
        if (counts.total === 0) return "0%";
        return `${((value / counts.total) * 100).toFixed(1)}%`;
      };

      const percentages = {
        highStock: calculatePercentage(counts.highStock),
        midStock: calculatePercentage(counts.midStock),
        lowStock: calculatePercentage(counts.lowStock),
        outOfStock: calculatePercentage(counts.outOfStock),
      };

      return {
        counts,
        percentages: {
          ...counts,
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to get items by stock level: ${error.message}`);
    }
  }

  async getUserReports() {
    const users = await prisma.user.findMany({});

    const totalUsers = users.length;
    const activeUsers = users.filter((user) => user.status === "active").length;
    const inactiveUsers = users.filter(
      (user) => user.status !== "active"
    ).length;

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
    };
  }

  async getRecentTransactions(limit: number = 5) {
    try {
      const recentTransactions = await prisma.inventoryTransaction.findMany({
        take: limit,
        orderBy: {
          date: "desc",
        },
        include: {
          inventory: true,
          item: true,
        },
      });

      return recentTransactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        itemName: transaction.inventory?.name || "Unknown Item",
        quantity: transaction.quantity,
        date: transaction.date,
        amount: transaction.amount
          ? new Intl.NumberFormat("en-EN", {
              style: "currency",
              currency: "PHP",
              maximumFractionDigits: 2,
            }).format(parseFloat(transaction.amount))
          : "N/A",
      }));
    } catch (error: any) {
      throw new Error(`Failed to get recent transactions: ${error.message}`);
    }
  }
}
