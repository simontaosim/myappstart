import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn,
} from "typeorm";
import { VideoCategory } from "./VideoCategory";

@Entity()
 export class Video {
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

    @Column()
    address: string;

    @Column({default: false})
    isPublished: boolean;

    @Column("text")
    body: string;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

    @DeleteDateColumn()
    deletedDate: Date;

    @ManyToOne(type=> VideoCategory, cate => cate.videos, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "cateId" })
    cate: VideoCategory

    @Column("int", { nullable: true })
    cateId: number;
    

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

