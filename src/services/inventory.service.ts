import prisma from "@/generic/prisma";
import {
  CreateInventoryInput,
  InventoriesResponseType,
  UpdateInventoryInput,
} from "@/schema/inventory.schema";
import { Decimal } from "@prisma/client/runtime/library";

export class InventoryService {
  // Get inventory by ID
  async getInventoryById(id: string) {
    return await prisma.inventory.findUnique({
      where: {
        id,
      },
      include: {
        issuances: true,
      },
    });
  }

  async getInventories(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    status?: string
  ): Promise<InventoriesResponseType> {
    const skip = (page - 1) * pageSize;

    const where = search
      ? {
          OR: [
            { itemName: { contains: search, mode: "insensitive" } },
            { location: { contains: search, mode: "insensitive" } },
            { supplier: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};

    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        where: { ...where, status } as never,
        skip,
        take: pageSize,
        include: {
          issuances: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      }),
      prisma.inventory.count({ where: where as never }),
    ]);

    return {
      data: inventories as never,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async archiveInventory(id: string) {
    try {
      const inventory = await prisma.inventory.update({
        where: {
          id,
        },
        data: {
          status: "archived",
        },
      });

      return inventory;
    } catch (error) {
      throw new Error(`Failed to archive inventory: ${error}`);
    }
  }

  async unarchiveInventory(id: string) {
    try {
      const inventory = await prisma.inventory.update({
        where: {
          id,
        },
        data: {
          status: "active",
        },
      });

      return inventory;
    } catch (error) {
      throw new Error(`Failed to unarchive inventory: ${error}`);
    }
  }

  async createInventory(data: CreateInventoryInput) {
    try {
      const inventory = await prisma.inventory.create({
        data: {
          itemName: data.item_name,
          location: data.location,
          supplier: data.supplier,
          quantity: data.quantity,
          price: new Decimal(data.price),
          amount: new Decimal(data.amount),
          size: data.size,
          status: data.status as "active" | "archived",
        },
      });

      return inventory;
    } catch (error) {
      throw new Error(`Failed to create inventory: ${error}`);
    }
  }

  async updateInventory(id: string, data: UpdateInventoryInput) {
    try {
      const inventory = await prisma.inventory.update({
        where: {
          id,
        },
        data: {
          itemName: data.item_name,
          location: data.location,
          supplier: data.supplier,
          quantity: data.quantity,
          price: data.price ? new Decimal(data.price) : undefined,
          amount: data.amount ? new Decimal(data.amount) : undefined,
          size: data.size,
          status: data.status as "active" | "archived",
        },
      });

      return inventory;
    } catch (error) {
      throw new Error(`Failed to update inventory: ${error}`);
    }
  }

  async deleteInventory(id: string) {
    return await prisma.inventory.delete({
      where: {
        id,
      },
    });
  }

  async inventoryIssuance() {
    return {
      data: await prisma.inventory.findMany({
        where: {},
        select: {
          id: true,
          itemName: true,
          quantity: true,
          amount: true,
          price: true,
          size: true,
          supplier: true,
          location: true,
          unit: true,
        },
      }),
    };
  }
}
