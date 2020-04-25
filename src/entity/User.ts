import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    ManyToMany,
    JoinTable,
    OneToMany,
    DeleteDateColumn,
    Unique,
    RelationId,
} from "typeorm";

import { Role } from './Role';
import { Post } from "./Post";

@Entity()
@Unique(["username"])
 export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    username: string;

    @Column()
    password: string;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

    @Column({default: false})
    isDefault: boolean
    
    @VersionColumn()
    version: number;

    @RelationId((user: User) => user.roles)
    roleIds: number[]

    @ManyToMany(Type => Role, { onDelete: 'SET NULL' })
    @JoinTable()
    roles: Role[];

    @OneToMany(Type => Post, post => post.author, { onDelete: 'SET NULL' })
    posts: Post[];

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

