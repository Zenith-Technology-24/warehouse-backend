import { Between } from 'typeorm';
import { AppDataSource } from '../database/data-source';
import { SalesInventory } from '../models/sales_inventories.entity';
import moment from 'moment';

export class SalesInventoryService {
    private salesInventoryRepository = AppDataSource.getRepository(SalesInventory);

    async createSalesInventory(salesInventory: Partial<SalesInventory>): Promise<SalesInventory> {
        const newSalesInventory = this.salesInventoryRepository.create(salesInventory);
        return this.salesInventoryRepository.save(newSalesInventory);
    }

    async deleteSalesInventory(id: number): Promise<boolean> {
        const result = await this.salesInventoryRepository.delete(id);
        return result.affected !== 0;
    }

    async getSalesInventory(id: number): Promise<SalesInventory | null> {
        const result = await this.salesInventoryRepository.findOne(
            {
                where: { id },
                relations: { inventory: true }
            }
        );

        if (!result) {
            return null;
        }
        return result;
    }

    async updateSalesInventory(id: number, inventory: Partial<SalesInventory>): Promise<SalesInventory | null> {
        const existingSalesInventory = await this.salesInventoryRepository.findOne({ where: { id } });

        if (!existingSalesInventory) {
            return null;
        }
        Object.assign(existingSalesInventory, inventory);
        return this.salesInventoryRepository.save(existingSalesInventory);
    }

    async countSalesinventory(): Promise<Number> {
        const todayStart = moment().startOf('day').toDate();
        const todayEnd = moment().endOf('day').toDate();

        const activeSales = await this.salesInventoryRepository
            .createQueryBuilder('salesInventory')
            .innerJoinAndSelect('salesInventory.sales', 'sales')
            .where('sales.status = :status', { status: 'active' })
            .andWhere('salesInventory.created_at BETWEEN :start AND :end', { start: todayStart, end: todayEnd })
            .getMany();

        const totalAmount = activeSales
            .reduce((total, sales) => total + parseFloat(sales.total_price as any), 0)
            .toFixed(2);

        return parseFloat(totalAmount);
    }
}
