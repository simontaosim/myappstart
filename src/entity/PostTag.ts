import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    ManyToMany,
    DeleteDateColumn,
    RelationId,
    JoinTable
} from "typeorm";

import { Post } from "./Post";

@Entity()
export class PostTag {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    name: string;

    @Column({nullable: true})
    name_zh: string;

    @Column({ default: false })
    isDefault: boolean;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

    @ManyToMany(type => Post, { onDelete: 'CASCADE' })
    @JoinTable()
    posts: Post[];

    @RelationId((postTag: PostTag) => postTag.posts)
    postIds: number[]

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
