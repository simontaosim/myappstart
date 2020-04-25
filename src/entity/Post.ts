import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    ManyToOne,
    DeleteDateColumn,
    JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity()
 export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    cover: string;

    @Column()
    title: string;

    @Column("text")
    body: string;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

    @ManyToOne(type=> User, user => user.posts, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "authorId" })
    author: User

    @Column("int", { nullable: true })
    authorId: number;

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

