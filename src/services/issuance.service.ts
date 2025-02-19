import prisma from "@/generic/prisma";
import {
  CreateIssuanceInput,
  UpdateIssuanceInput,
} from "@/schema/issuance.schema";
import { Issuance, User } from "@prisma/client";

export class IssuanceService {
  async createIssuance(data: CreateIssuanceInput, user: User) {
    try {
      const { endUsers, ...issuanceData } = data;
      let issuanceEndUser = null;
      const issuance = await prisma.issuance.create({
        data: {
          directiveNo: issuanceData.directive_no,
          documentNum: issuanceData.document_no,
          issuanceDate: new Date(),
          expiryDate: issuanceData.expiry_date,
          user: {
            connect: {
              id: user.id,
            },
          },
        },
      });

      for (const endUser of endUsers) {
        console.log("Searching for user with:", {
          name: endUser.name,
          id: endUser.id,
        });
        let user = await prisma.endUser.findFirst({
          where: {
            OR: [
              { name: { equals: endUser.name } },
              { id: { equals: endUser.id } },
            ],
          },
        });
        console.log("Found user:", user);
        // If it doesn't exist, create new end user
        if (!user) {
          user = await prisma.endUser.create({
            data: {
              name: endUser.name || "NKWN",
            },
          });

          // Create new end user items
          issuanceEndUser = await prisma.issuanceEndUser.create({
            data: {
              issuance: {
                connect: { id: issuance.id },
              },
              endUser: {
                connect: { id: user.id },
              },
            },
          });
        } else {
          issuanceEndUser = await prisma.issuanceEndUser.create({
            data: {
              issuance: {
                connect: { id: issuance.id },
              },
              endUser: {
                connect: { id: user.id },
              },
            },
          });
        }

        // Create IssuanceEndUserItem entries
        for (const item of endUser.items) {
          // Check if inventory exists
          let inventoryItem = await prisma.inventory.findUnique({
            where: { id: item.inventoryId },
          });

          if (!inventoryItem) {
            // Create new inventory item if it doesn't exist
            inventoryItem = await prisma.inventory.create({
              data: {
                itemName: item.itemName || "Unknown Item",
                location: item.location || "Default Location",
                supplier: item.supplier || "Default Supplier",
                quantity: item.quantity || 0,
                price: item.price || 0,
                amount: item.amount || 0,
                size: item.size,
                unit: item.unit || "ea",
                status: item.status || "active",
              },
            });
          }

          await prisma.issuanceEndUserItem.create({
            data: {
              issuanceEndUser: {
                connect: { id: issuanceEndUser.id },
              },
              inventory: {
                connect: { id: inventoryItem.id },
              },
              quantity: item.quantity || 0,
            },
          });
        }
      }

      return await prisma.issuance.findUnique({
        where: { id: issuance.id },
        include: {
          endUsers: {
            include: {
              endUser: true,
              items: {
                include: {
                  inventory: true,
                },
              },
            },
          },
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create issuance: ${error}`);
    }
  }

  async updateIssuance(id: string, data: UpdateIssuanceInput) {
    try {
      const { endUsers, ...issuanceData } = data;
      if (Object.keys(data).length === 1 && "status" in data) {
        const updatedIssuance = await prisma.issuance.update({
          where: { id },
          data: { status: data.status },
          include: {
            endUsers: {
              include: {
                endUser: true,
                items: {
                  include: {
                    inventory: true,
                  },
                },
              },
            },
            user: true,
          },
        });
        return updatedIssuance;
      }
      let issuanceEndUser = null;
      const updatedIssuance = await prisma.issuance.update({
        where: { id },
        data: {
          directiveNo: issuanceData.directive_no,
          documentNum: issuanceData.document_no,
          expiryDate: issuanceData.expiry_date,
        },
      });

      await prisma.issuanceEndUserItem.deleteMany({
        where: {
          issuanceEndUser: {
            issuanceId: id,
          },
        },
      });

      // Then delete IssuanceEndUser records
      await prisma.issuanceEndUser.deleteMany({
        where: { issuanceId: id },
      });

      for (const endUser of endUsers) {
        let user = await prisma.endUser.findFirst({
          where: {
            OR: [
              { name: { equals: endUser.name } },
              { id: { equals: endUser.id } },
            ],
          },
        });
        if (!user) {
          user = await prisma.endUser.create({
            data: {
              name: endUser.name || "NKWN",
            },
          });

          // Create new end user items
          issuanceEndUser = await prisma.issuanceEndUser.create({
            data: {
              issuance: {
                connect: { id: updatedIssuance.id },
              },
              endUser: {
                connect: { id: user.id },
              },
            },
          });
        } else {
          issuanceEndUser = await prisma.issuanceEndUser.create({
            data: {
              issuance: {
                connect: { id: updatedIssuance.id },
              },
              endUser: {
                connect: { id: user.id },
              },
            },
          });
        }

        for (const item of endUser.items) {
          // Check if inventory exists
          let inventoryItem = await prisma.inventory.findUnique({
            where: { id: item.inventoryId },
          });

          if (!inventoryItem) {
            // Create new inventory item if it doesn't exist
            inventoryItem = await prisma.inventory.create({
              data: {
                itemName: item.itemName || "Unknown Item",
                location: item.location || "Default Location",
                supplier: item.supplier || "Default Supplier",
                quantity: item.quantity || 0,
                price: item.price || 0,
                amount: item.amount || 0,
                size: item.size,
                unit: item.unit || "ea",
                status: item.status || "active",
              },
            });
          }

          await prisma.issuanceEndUserItem.create({
            data: {
              issuanceEndUser: {
                connect: { id: issuanceEndUser.id },
              },
              inventory: {
                connect: { id: inventoryItem.id },
              },
              quantity: item.quantity || 0,
            },
          });
        }
      }

      return await prisma.issuance.findUnique({
        where: { id },
        include: {
          endUsers: {
            include: {
              endUser: true,
              items: {
                include: {
                  inventory: true,
                },
              },
            },
          },
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update issuance: ${error}`);
    }
  }

  async getIssuanceById(id: string) {
    return await prisma.issuance.findUnique({
      where: { id },
      include: {
        endUsers: {
          include: {
            endUser: true,
            items: {
              include: {
                inventory: true,
              },
            },
          },
        },
        user: {
          select: {
            lastname: true,
            firstname: true,
            username: true,
            email: true,
            roles: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
    });
  }
  async getIssuances(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string
  ): Promise<Issuance> {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [{ directiveNo: { contains: search, mode: "insensitive" } }],
        }
      : {};

    const [issuances, total] = await Promise.all([
      prisma.issuance.findMany({
        where: {
          ...where,
          status: status === "all" ? undefined : status,
        } as never,
        skip,
        take: pageSize,
        include: {
          endUsers: {
            include: {
              endUser: true,
              items: {
                include: {
                  inventory: true,
                },
              },
            },
          },
          user: {
            select: {
              lastname: true,
              firstname: true,
              username: true,
            },
          },
        },
      }),
      prisma.issuance.count({ where: where as never }),
    ]);

    return {
      // @ts-expect-error malformed types
      data: issuances,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
