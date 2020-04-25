import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    ManyToMany,
    DeleteDateColumn,
    OneToMany,
    RelationId
} from "typeorm";

import { User } from './User';
import { Permission } from "./Permission";

@Entity()
export class Role {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    name: string;

    @Column({nullable: true})
    name_zh:  string;

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

    @RelationId((role: Role) => role.permissions)
    permissionIds: number[]

    @OneToMany(type => Permission, permission => permission.role, {  onDelete: 'CASCADE', onUpdate: "CASCADE" })
    permissions: Permission[]

    @DeleteDateColumn()
    deletedDate: Date;

    @Column("simple-json", {nullable: true})
    acl: {
        write: {
         roles: number[],
         users: number[]
        },
        read: {
         roles: number[],
         users: number[]
        }
     }

}
