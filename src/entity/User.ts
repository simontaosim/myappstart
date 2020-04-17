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
    
    @VersionColumn()
    version: number;

    @ManyToMany(Type => Role, { onDelete: 'SET NULL' })
    @JoinTable()
    roles: Role[];

    @OneToMany(Type => Post, post => post.author, { onDelete: 'SET NULL' })
    posts: Post[];

    @DeleteDateColumn()
    deletedDate: Date;
}

