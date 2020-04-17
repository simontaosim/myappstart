import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    ManyToMany,
    DeleteDateColumn,
    OneToMany
} from "typeorm";

import { User } from './User';
import { Permission } from "./Permission";

@Entity()
export class Role {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ default: false })
    isDefault: boolean;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

    @ManyToMany(type => User, { onDelete: 'SET NULL' })
    users: User[];

    @OneToMany(type => Permission, permission => permission.role, { onDelete: 'SET NULL'})
    permissions: Permission[]

    @DeleteDateColumn()
    deletedDate: Date;

}
