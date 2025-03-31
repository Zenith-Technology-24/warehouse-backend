import { Receipt, User } from "@prisma/client";
import prisma from "@/generic/prisma";

interface InventoryPayload {
  id?: string;
  name: string;
  sizeType: "none" | "apparrel" | "numerical";
  quantity: string;
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

export interface ReceiptsResponseType {
  data: Receipt[];
  total: number;
  currentPage: number;
  totalPages: number;
}

export interface CurrentReceipt {
  data: Receipt[];
}

interface CreateReceiptDto {
  source?: string;
  receipt_date: Date;
  issuanceDirective?: string;
  quantity?: string;
  inventory?: InventoryPayload[];
}
export class ReceiptService {
  private async getCurrentReceipt(
    id: string,
    inventoryId: string,
    issuanceDirective: string,
    size: string,
    itemId: string
  ): Promise<CurrentReceipt | null> {
    try {
      const [receipts] = await Promise.all([
        prisma.receipt.findMany({
          where: {
            id,
          },
          skip: 0,
          take: 1,
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
                    inventoryId: true,
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
      ]);
      const newReceipts = await Promise.all(
        receipts.map(async (receipt) => {
          const receiptItems = await prisma.item.findMany({
            where: {
              id: itemId,
              receiptId: id,
              issuanceDetailId: null,
              inventoryId,
              size,
            },
          });

          const issuedItems = await prisma.item.findMany({
            where: {
              receiptId: id,
              receiptRef: issuanceDirective,
              inventoryId,
              issuanceDetailId: {
                not: null,
              },
              size,
            },
            include: {
              IssuanceDetail: true,
            },
          });

          if (receiptItems.length === 0) {
            return {
              ...receipt,
              max_quantity: 0,
              issued_quantity: 0,
              current_quantity: 0,
              quantity_string: `${0}/${0}`,
            };
          }

          const totalReceiptQuantity = receiptItems.reduce((acc, item) => {
            return Number(item.quantity || "0");
          }, 0);

          const totalIssuedQuantity = issuedItems.reduce((acc, item) => {
            return Number(item.quantity || "0");
          }, 0);

          const remainingQuantity = Math.max(
            0,
            totalReceiptQuantity - totalIssuedQuantity
          );

          if (issuedItems.length > 0) {
            const issuanceDetailMap = new Map();

            issuedItems.forEach((item) => {
              if (item.issuanceDetailId) {
                if (!issuanceDetailMap.has(item.issuanceDetailId)) {
                  issuanceDetailMap.set(item.issuanceDetailId, {
                    totalQuantity: 0,
                    detail: item.IssuanceDetail,
                  });
                }

                const entry = issuanceDetailMap.get(item.issuanceDetailId);
                entry.totalQuantity += Number(item.quantity || "0");
              }
            });

            for (const [detailId, info] of issuanceDetailMap.entries()) {
              if (info.detail && info.totalQuantity >= totalReceiptQuantity) {
                await prisma.issuanceDetail.update({
                  where: { id: detailId },
                  data: { status: "withdrawn" },
                });
              }
            }
          }

          return {
            ...receipt,
            max_quantity: totalReceiptQuantity,
            issued_quantity: totalIssuedQuantity,
            current_quantity: remainingQuantity,
            is_consumed: totalIssuedQuantity >= totalReceiptQuantity,
            quantity_string: `${totalIssuedQuantity}/${totalReceiptQuantity}`,
          };
        })
      );

      const formattedReceipts = newReceipts.map((receipt) => {
        const formattedInventories = receipt.inventory.map((inv) => {
          if (inv.item) {
            const formattedItem = {
              ...inv.item,
              price: inv.item.price
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(inv.item.price))
                : "0.00",
              amount: inv.item.amount
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(inv.item.amount))
                : "0.00",
            };

            return { ...inv, item: formattedItem };
          }
          return inv;
        });

        const totalAmount = receipt.inventory.reduce((sum, inv) => {
          if (inv.item?.amount) {
            return sum + parseFloat(inv.item.amount);
          }
          return sum;
        }, 0);

        return {
          ...receipt,
          inventory: formattedInventories,
          totalAmount: new Intl.NumberFormat("en-EN", {
            maximumFractionDigits: 2,
          }).format(totalAmount),
        };
      });

      return {
        data: formattedReceipts,
      };
    } catch (error: any) {
      throw new Error(`Failed to get receipts: ${error.message}`);
    }
  }

  async create(data: CreateReceiptDto, user: User): Promise<Receipt> {
    try {
      const receipt = await prisma.$transaction(async (tx) => {
        const existingReceipt = await tx.receipt.findFirst({
          where: {
            issuanceDirective: data.issuanceDirective,
          },
        });

        if (existingReceipt) {
          throw new Error(
            "Receipt with this issuance directive already exists"
          );
        }

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
                OR: [{ name: inventoryItem.name }, { id: inventoryItem.id }],
              },
              include: { item: true },
            });

            if (existingInventory) {
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
                  receiptRef: data.issuanceDirective,
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
                  },
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
                  receiptRef: data.issuanceDirective,
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
        for (const item of existingReceipt.item) {
          await tx.item.delete({
            where: { id: item.id },
          });
        }

        await tx.receipt.update({
          where: { id },
          data: {
            inventory: {
              disconnect: existingReceipt.inventory.map((inv) => ({
                id: inv.id,
              })),
            },
          },
        });

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
            const existingInventory = await tx.inventory.findFirst({
              where: {
                OR: [{ id: inventoryItem.id }, { name: inventoryItem.name }],
              },
            });

            if (existingInventory) {
              const inventory = await tx.inventory.update({
                where: { id: existingInventory.id },
                data: {
                  quantity: String(
                    parseInt(inventoryItem.item.quantity || "1") +
                      parseInt(existingInventory.quantity || "0")
                  ),
                  receipts: {
                    connect: { id: receipt.id },
                  },
                },
              });

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
                  inventoryId: inventory.id,
                },
              });

              // if (inventoryItem.id) {
              //   const transaction = await tx.inventoryTransaction.create({
              //     data: {
              //       quantity: String(inventoryItem.item.quantity),
              //       type: "RECEIPT",
              //       inventoryId: inventoryItem.id,
              //       receiptId: receipt.id,
              //       size: inventoryItem.item.size
              //     }
              //   });

              //   await tx.item.update({
              //     where: {
              //       id: item.id
              //     },
              //     data: {
              //       inventoryTransactionId: transaction.id
              //     }
              //   })
              // }
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
      const receipt = await prisma.receipt.findUnique({
        where: {
          id,
        },
        include: {
          item: {
            select: {
              id: true,
              location: true,
              size: true,
              quantity: true,
              expiryDate: true,
              item_name: true,
              unit: true,
              price: true,
              amount: true,
              inventoryId: true,
              receiptId: true,
              receiptRef: true,
              issuanceDetailId: true,
              inventory: {
                select: {
                  id: true,
                  name: true,
                  sizeType: true,
                  quantity: true,
                  unit: true,
                  status: true,
                },
              },
            },
          },
          user: {
            select: {
              lastname: true,
              firstname: true,
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

      if (!receipt) return null;

      const inventoryIds = receipt.item.map((item) => item.inventoryId);

      const inventories = await prisma.inventory.findMany({
        where: {
          id: {
            in: inventoryIds as string[],
          },
        },
      });

      const inventoryMap = new Map();
      inventories.forEach((inv) => {
        inventoryMap.set(inv.id, inv);
      });

      const itemsWithInventory = await Promise.all(
        receipt.item
          .filter((item) => item.issuanceDetailId === null)
          .map(async (item) => {
            console.log(item.id);
            const currentReceipt = await this.getCurrentReceipt(
              item.receiptId || "",
              item.inventoryId,
              receipt.issuanceDirective,
              item.size,
              item.id
            );

            if (!currentReceipt?.data.length) {
              return {
                ...item,
              };
            }

            return {
              ...item,
              inventory: item.inventoryId
                ? inventoryMap.get(item.inventoryId)
                : null,

              price: item.price
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(item.price))
                : "0.00",
              amount: item.amount
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(item.amount))
                : "0.00",
              ...currentReceipt.data[0],
              quantity: item.quantity,
            };
          })
      );

      const totalAmount = receipt.item.reduce((sum, item) => {
        return sum + parseFloat(item.amount || "0");
      }, 0);

      return {
        ...receipt,
        item: itemsWithInventory,
        totalAmount: new Intl.NumberFormat("en-EN", {
          maximumFractionDigits: 2,
        }).format(totalAmount),
      };
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
                    inventoryId: true,
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

      const newReceipts = await Promise.all(
        receipts.map(async (receipt) => {
          const receiptItems = await prisma.item.findMany({
            where: {
              receiptId: receipt.id,
            },
          });

          const issuedItems = await prisma.item.findMany({
            where: {
              receiptRef: receipt.issuanceDirective,
              issuanceDetailId: {
                not: null,
              },
            },
            include: {
              IssuanceDetail: true,
            },
          });

          if (receiptItems.length === 0) {
            return {
              ...receipt,
              max_quantity: 0,
              issued_quantity: 0,
              current_quantity: 0,
              quantity_string: `${0}/${0}`,
            };
          }

          const totalReceiptQuantity = receiptItems.reduce((acc, item) => {
            return acc + Number(item.quantity || "0");
          }, 0);

          const totalIssuedQuantity = issuedItems.reduce((acc, item) => {
            return acc + Number(item.quantity || "0");
          }, 0);

          const remainingQuantity = Math.max(
            0,
            totalReceiptQuantity - totalIssuedQuantity
          );

          if (issuedItems.length > 0) {
            const issuanceDetailMap = new Map();

            issuedItems.forEach((item) => {
              if (item.issuanceDetailId) {
                if (!issuanceDetailMap.has(item.issuanceDetailId)) {
                  issuanceDetailMap.set(item.issuanceDetailId, {
                    totalQuantity: 0,
                    detail: item.IssuanceDetail,
                  });
                }

                const entry = issuanceDetailMap.get(item.issuanceDetailId);
                entry.totalQuantity += Number(item.quantity || "0");
              }
            });

            for (const [detailId, info] of issuanceDetailMap.entries()) {
              if (info.detail && info.totalQuantity >= totalReceiptQuantity) {
                await prisma.issuanceDetail.update({
                  where: { id: detailId },
                  data: { status: "withdrawn" },
                });
              }
            }
          }

          return {
            ...receipt,
            max_quantity: totalReceiptQuantity,
            issued_quantity: totalIssuedQuantity,
            current_quantity: remainingQuantity,
            is_consumed: totalIssuedQuantity >= totalReceiptQuantity,
            quantity_string: `${totalIssuedQuantity}/${totalReceiptQuantity}`,
          };
        })
      );

      const formattedReceipts = newReceipts.map((receipt) => {
        const formattedInventories = receipt.inventory.map((inv) => {
          if (inv.item) {
            const formattedItem = {
              ...inv.item,
              price: inv.item.price
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(inv.item.price))
                : "0.00",
              amount: inv.item.amount
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(inv.item.amount))
                : "0.00",
            };

            return { ...inv, item: formattedItem };
          }
          return inv;
        });

        const totalAmount = receipt.inventory.reduce((sum, inv) => {
          if (inv.item?.amount) {
            return sum + parseFloat(inv.item.amount);
          }
          return sum;
        }, 0);

        return {
          ...receipt,
          inventory: formattedInventories,
          totalAmount: new Intl.NumberFormat("en-EN", {
            maximumFractionDigits: 2,
          }).format(totalAmount),
        };
      });

      return {
        data: formattedReceipts,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error: any) {
      throw new Error(`Failed to get receipts: ${error.message}`);
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
        receiptDate: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
        ...(search
          ? {
              OR: [
                {
                  issuanceDirective: { contains: search, mode: "insensitive" },
                },
                { source: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const receipts = await prisma.receipt.findMany({
        where: { ...where, status } as any,
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
                  inventoryId: true,
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
      });

      const formattedReceipts = receipts.map((receipt) => {
        const formattedInventories = receipt.inventory.map((inv) => {
          if (inv.item) {
            const formattedItem = {
              ...inv.item,
              price: inv.item.price
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(inv.item.price))
                : "0.00",
              amount: inv.item.amount
                ? new Intl.NumberFormat("en-EN", {
                    maximumFractionDigits: 2,
                  }).format(parseFloat(inv.item.amount))
                : "0.00",
            };

            return { ...inv, item: formattedItem };
          }
          return inv;
        });

        const totalAmount = receipt.inventory.reduce((sum, inv) => {
          if (inv.item?.amount) {
            return sum + parseFloat(inv.item.amount);
          }
          return sum;
        }, 0);

        return {
          ...receipt,
          inventory: formattedInventories,
          totalAmount: new Intl.NumberFormat("en-EN", {
            maximumFractionDigits: 2,
          }).format(totalAmount),
        };
      });

      return formattedReceipts;
    } catch (error: any) {
      throw new Error(`Failed to get receipts: ${error.message}`);
    }
  }

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

  async deleteReceipt(id: string): Promise<Receipt> {
    return await prisma.receipt.delete({
      where: {
        id,
      },
    });
  }
}
