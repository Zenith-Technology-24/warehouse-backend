import prisma from "@/generic/prisma";
import { InventoryType } from "@/schema/inventory.schema";
import {
  CreateIssuanceInput,
  UpdateIssuanceInput,
} from "@/schema/issuance.schema";
import { InventoryStatus, Issuance, User } from "@prisma/client";

export class IssuanceService {
  async createIssuance(data: CreateIssuanceInput, user: User) {
    try {
      const { inventoryItems, ...issuanceData } = data;

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

      const inventoryPromises = inventoryItems.map(async (item) => {
        let inventory = await prisma.inventory.findFirst({
          where: {
            id: item.id,
          },
        });

        if (!inventory) {
          inventory = await prisma.inventory.create({
            data: {
              itemName: item.item_name || "No name",
              location: item.location || "No Location",
              supplier: item.supplier || "N/A",
              quantity: item.quantity || 0,
              price: item.price || "0",
              amount: item.amount || "0",
              size: item.size,
              status: (item.status as InventoryStatus) || "active",
            },
          });
        }

        await prisma.issuance.update({
          where: { id: issuance.id },
          data: {
            inventoryItems: {
              connect: {
                id: inventory.id,
              },
            },
          },
        });

        return inventory;
      });

      await Promise.all(inventoryPromises);

      return await prisma.issuance.findUnique({
        where: { id: issuance.id },
        include: {
          inventoryItems: true,
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create issuance: ${error}`);
    }
  }
  async updateIssuance(id: string, data: UpdateIssuanceInput) {
    try {
      const { inventoryItems, ...issuanceData } = data;

      // Update issuance basic information
      await prisma.issuance.update({
        where: { id },
        data: {
          directiveNo: issuanceData.directive_no,
          documentNum: issuanceData.document_no,
          issuanceDate: new Date(),
          expiryDate: issuanceData.expiry_date,
        },
      });

      // First, disconnect all existing inventory items
      await prisma.issuance.update({
        where: { id },
        data: {
          inventoryItems: {
            set: [], // This removes all connections
          },
        },
      });

      // Process each inventory item
      const inventoryPromises = inventoryItems.map(
        async (item: Partial<InventoryType>) => {
          let inventory = await prisma.inventory.findFirst({
            where: {
              itemName: item.item_name,
            },
          });

          if (!inventory) {
            // Create new inventory if it doesn't exist
            inventory = await prisma.inventory.create({
              data: {
                itemName: item.item_name || "No name",
                location: item.location || "No Location",
                supplier: item.supplier || "N/A",
                quantity: item.quantity || 0,
                price: item.price || "0",
                amount: item.amount || "0",
                size: item.size,
                status: (item.status as InventoryStatus) || "active",
              },
            });
          } else {
            // Update existing inventory
            inventory = await prisma.inventory.update({
              where: { id: inventory.id },
              data: {
                location: item.location,
                supplier: item.supplier,
                quantity: item.quantity,
                price: item.price,
                amount: item.amount,
                size: item.size,
                status: (item.status as InventoryStatus) || inventory.status,
              },
            });
          }

          // Connect updated/created inventory to issuance
          await prisma.issuance.update({
            where: { id },
            data: {
              inventoryItems: {
                connect: {
                  id: inventory.id,
                },
              },
            },
          });

          return inventory;
        }
      );

      await Promise.all(inventoryPromises);

      // Return updated issuance with relationships
      return await prisma.issuance.findUnique({
        where: { id },
        include: {
          inventoryItems: true,
          user: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to update issuance: ${error}`);
    }
  }

  async getIssuanceById(id: string) {
    return await prisma.issuance.findUnique({
      where: {
        id,
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
        where: { ...where, status } as never,
        skip,
        take: pageSize,
        include: {
          inventoryItems: true,
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
