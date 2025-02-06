import { AppDataSource } from "../database/data-source";
import { Inventory } from "../models/inventory.entity";
import { Issuance } from "../models/issuance.entity";

export class IssuanceService {
  private issuanceRepository = AppDataSource.getRepository(Issuance);
  private inventoryRepository = AppDataSource.getRepository(Inventory);

  async createIssuance(
    createIssuanceDto: Partial<Issuance>
  ): Promise<Issuance | null> {
    const newIssuance = this.issuanceRepository.create(createIssuanceDto);

    if (createIssuanceDto.inventory_items) {
      const inventoryItems = await this.inventoryRepository.findByIds(
        createIssuanceDto.inventory_items.map((item) => item.id)
      );
      newIssuance.inventory_items = inventoryItems;
    }

    return await this.issuanceRepository.save(newIssuance);
  }

  async updateIssuance(
    id: number,
    updateIssuanceDto: Partial<Issuance>
  ): Promise<Issuance | null> {
    const issuance = await this.issuanceRepository.findOne({
      where: { id },
      relations: ["inventory_items"],
    });

    if (!issuance) {
      return null;
    }

    if (updateIssuanceDto.inventory_items) {
      const inventoryItems = await this.inventoryRepository.findByIds(
        updateIssuanceDto.inventory_items.map((item) => item.id)
      );
      issuance.inventory_items = inventoryItems;
      delete updateIssuanceDto.inventory_items; // Remove from DTO to prevent double assignment
    }

    Object.assign(issuance, updateIssuanceDto);
    return await this.issuanceRepository.save(issuance);
  }

  async archiveIssuance(id: number): Promise<Issuance | null> {
    const issuance = await this.issuanceRepository.findOne({
      where: { id },
    });

    if (!issuance) {
      return null;
    }

    issuance.is_archived = true;
    return await this.issuanceRepository.save(issuance);
  }

  async restoreIssuance(id: number): Promise<Issuance | null> {
    const issuance = await this.issuanceRepository.findOne({
      where: { id },
    });

    if (!issuance) {
      return null;
    }

    issuance.is_archived = false;
    return await this.issuanceRepository.save(issuance);
  }

  async deleteIssuance(id: number): Promise<Issuance | null> {
    const issuance = await this.issuanceRepository.findOne({
      where: { id },
    });

    if (!issuance) {
      return null;
    }

    await this.issuanceRepository.delete(id);
    return issuance;
  }

  async findAll(): Promise<Issuance[]> {
    return await this.issuanceRepository.find({
      relations: ["user", "item"],
    });
  }

  async findOne(id: number): Promise<Issuance | null> {
    const issuance = await this.issuanceRepository.findOne({
      where: { id },
      relations: ["inventory_items"],
    });

    if (!issuance) {
      return null;
    }

    return issuance;
  }
}
