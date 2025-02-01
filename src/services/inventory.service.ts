import { Inventory } from './../models/inventory.entity';
import { AppDataSource } from '../database/data-source';
import moment from 'moment';

interface PaginatedInventoryResponse {
    data: Inventory[];
    total: number;
    currentPage: number;
    totalPages: number;
}

export class InventoryService {
    private inventoryRepository = AppDataSource.getRepository(Inventory);

    async getAllInventory({ req }: any): Promise<PaginatedInventoryResponse> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const status = req.body.status !== 'all' ? req.body.status : null;
        const searchTerm = req.body.search ? `%${req.body.search}%` : '%';

        const query = this.inventoryRepository.createQueryBuilder('inventory')
            .where('inventory.product_name LIKE :search', { search: searchTerm });

        if (status) {
            query.andWhere('inventory.status = :status', { status });
        }

        query.orderBy('inventory.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [data, total] = await query.getManyAndCount();

        return {
            data,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }

    async getExportInventory({ req }: any) {
        const { status, search, start_date, end_date } = req.body;

        const searchTerm = search ? `%${search}%` : '%';

        const modifiedStartDate = end_date ? moment(start_date).startOf('day').toISOString() : null;
        const modifiedEndDate = end_date ? moment(end_date).add(2, 'day').toISOString() : null;

        const query = this.inventoryRepository.createQueryBuilder('inventory')
            .where('inventory.product_name LIKE :search', { search: searchTerm });

        if (status && status !== 'all') {
            query.andWhere('inventory.status = :status', { status });
        }

        if (start_date && modifiedEndDate) {
            query.andWhere('inventory.created_at BETWEEN :start_date AND :end_date', {
                start_date: modifiedStartDate,
                end_date: modifiedEndDate
            });
        }

        query.orderBy('inventory.created_at', 'DESC');

        const data = await query.getMany();

        return data;
    }

    async getAllProductNames({ req }: any) {
        const products = await this.inventoryRepository.find();

        const productNames = products.map((product) => ({
            ...product,
            id: product.id, name: product.product_name
        }));
        return productNames
    }

    async createInventory(inventory: Partial<Inventory>): Promise<Inventory> {
        const newInventory = this.inventoryRepository.create(inventory);
        return this.inventoryRepository.save(newInventory);
    }

    async getInventory(id: number): Promise<Inventory | null> {
        const inventory = await this.inventoryRepository.findOne({ where: { id } });

        if (!inventory) {
            return null;
        }
        return inventory;
    }

    async updateInventory(id: number, inventory: Partial<Inventory>): Promise<Inventory | null> {
        const existingInventory = await this.inventoryRepository.findOne({ where: { id } });

        if (!existingInventory) {
            return null;
        }
        Object.assign(existingInventory, inventory);
        return this.inventoryRepository.save(existingInventory);
    }

    async deleteInventory(id: number): Promise<boolean> {
        const result = await this.inventoryRepository.delete(id);
        return result.affected !== 0;
    }

    async updateStatus(id: number, status: string): Promise<Inventory | null> {
        await this.inventoryRepository.update(id, { status } as any);

        const updatedInventory = await this.inventoryRepository.findOne({
            where: { id }
        });
        return updatedInventory || null;
    }

    async countInventories(): Promise<Number> {
        const activeInventoriesCount = await this.inventoryRepository.count({
            where: { status: 'active' } as any,
        })
        return activeInventoriesCount
    }
}
