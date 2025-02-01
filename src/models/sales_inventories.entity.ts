import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from 'typeorm';
import { Inventory } from './inventory.entity';
import { Sales } from './sales.entity';

@Entity('sales_inventories')
export class SalesInventory {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Inventory, inventory => inventory.salesInventory)
    @JoinColumn({ name: 'inventory_id' })
    inventory!: Inventory;

    @ManyToOne(() => Sales, sales => sales.salesInventory)
    @JoinColumn({ name: 'sales_id' })
    sales!: Sales;

    @Column()
    quantity!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    total_price!: number;

    @Column()
    terms!: string;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;
}
