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
    ManyToMany,
    RelationId,
    JoinTable,
} from "typeorm";
import { User } from "./User";
import { PostTag } from "./PostTag";

@Entity()
 export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("simple-json", {nullable: true})
    cover: {
        small: string,
        cover: string,
        src: string,
    };

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

    @ManyToMany(type => PostTag, { onDelete: 'SET NULL' })
    @JoinTable()
    tags: PostTag[]

    @RelationId((post: Post) => post.tags)
    tagIds: number[]

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

