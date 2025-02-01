import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToMany, JoinTable, OneToOne, OneToMany, ManyToOne } from 'typeorm';
import { Status } from '../enums/sales.enum';
import { Customer } from './customer.entity';
import { SalesInventory } from './sales_inventories.entity';

@Entity('sales')
export class Sales {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Customer, customer => customer.sales)
    @JoinColumn({ name: 'customer_id' })
    customer!: Customer

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

    @OneToMany(() => SalesInventory, salesInventory => salesInventory.sales)
    salesInventory!: SalesInventory[];
}
