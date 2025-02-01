import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Status } from '../enums/inventory.enum';
import { SalesInventory } from './sales_inventories.entity';

@Entity()
export class Inventory {
    [x: string]: any;
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    product_name!: string;

    @Column()
    category!: string;

    @Column()
    size!: string;

    @Column()
    in_stock!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    cost!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price!: number;

    @Column({
        type: 'enum',
        enum: Status,
        default: Status.ACTIVE,
    })
    status!: Status;

    @CreateDateColumn({ type: 'timestamp' })
    created_at!: Date;

    @UpdateDateColumn({ type: 'timestamp' })
    updated_at!: Date;

    @OneToMany(() => SalesInventory, salesInventory => salesInventory.inventory)
    salesInventory!: SalesInventory[];
}
