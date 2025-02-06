import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, JoinTable, ManyToMany } from 'typeorm';
import { User } from './user.entity';
import { IssuanceStatus } from '../enums/item.enum';
import { Inventory } from './inventory.entity';

@Entity('issuance')
export class Issuance {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column()
    directive_no!: string;

    @CreateDateColumn({ type: 'timestamp' })
    issuance_date!: Date;

    @Column({ type: 'timestamp' })
    expiry_date!: Date;

    @Column()
    document_num!: string;

    @Column()
    item_name!: string;

    @Column()
    location!: string;

    @Column()
    supplier!: string;

    @Column()
    quantity!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    price!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    amount!: number;

    @Column({ nullable: true })
    size?: string;

    @Column({
        type: 'enum',
        enum: IssuanceStatus,
        default: IssuanceStatus.PENDING
    })
    status!: IssuanceStatus

    @Column({ default: false })
    is_archived!: boolean;

    @ManyToMany(() => Inventory)
    @JoinTable({
        name: 'issuance_inventory',
        joinColumn: {
            name: 'issuance_id',
            referencedColumnName: 'id'
        },
        inverseJoinColumn: {
            name: 'inventory_id',
            referencedColumnName: 'id'
        }
    })
    inventory_items!: Inventory[];
}