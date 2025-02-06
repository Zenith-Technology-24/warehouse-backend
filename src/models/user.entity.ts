import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert, ManyToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    email!: string;

    @Column()
    firstname!: string;

    @Column({nullable: true})
    username!: string;

    @Column()
    lastname!: string;

    @Exclude()
    @Column()
    password!: string;

    @ManyToMany(() => Role, role => role.users)
    roles!: Role[];

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, 10);
    }
}
