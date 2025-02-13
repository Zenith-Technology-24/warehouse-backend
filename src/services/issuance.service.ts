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

      // Create IssuanceEndUser entries with their items
      for (const endUser of endUsers) {
        const issuanceEndUser = await prisma.issuanceEndUser.create({
          data: {
            issuance: {
              connect: { id: issuance.id },
            },
            endUser: {
              connect: { id: endUser.endUserId },
            },
          },
        });

        // Create IssuanceEndUserItem entries
        for (const item of endUser.items) {
          await prisma.issuanceEndUserItem.create({
            data: {
              issuanceEndUser: {
                connect: { id: issuanceEndUser.id },
              },
              inventory: {
                connect: { id: item.inventoryId },
              },
              quantity: item.quantity,
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

      // Update issuance basic information
      const updatedIssuance = await prisma.issuance.update({
        where: { id },
        data: {
          directiveNo: issuanceData.directive_no,
          documentNum: issuanceData.document_no,
          expiryDate: issuanceData.expiry_date,
        },
      });

      // Remove all existing IssuanceEndUser entries and their items
      await prisma.issuanceEndUser.deleteMany({
        where: { issuanceId: id },
      });

      // Create new IssuanceEndUser entries with their items
      for (const endUser of endUsers) {
        const issuanceEndUser = await prisma.issuanceEndUser.create({
          data: {
            issuance: {
              connect: { id: updatedIssuance.id },
            },
            endUser: {
              connect: { id: endUser.endUserId },
            },
          },
        });

        // Create IssuanceEndUserItem entries
        for (const item of endUser.items) {
          await prisma.issuanceEndUserItem.create({
            data: {
              issuanceEndUser: {
                connect: { id: issuanceEndUser.id },
              },
              inventory: {
                connect: { id: item.inventoryId },
              },
              quantity: item.quantity,
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
        user: true,
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
          OR: [
            { directiveNo: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [issuances, total] = await Promise.all([
      prisma.issuance.findMany({
        where: { ...where, status: status === 'all' ? undefined : status } as never,
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
          user: true,
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
