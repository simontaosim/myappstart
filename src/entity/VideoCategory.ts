import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    OneToMany,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Video } from "./Video";


@Entity()
export class VideoCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    name: string;

    @OneToMany(Type => VideoCategory, videoCategory => videoCategory.videoCategory, { onDelete: 'SET NULL' })
    subCategories: VideoCategory[];

    @ManyToOne(type=> VideoCategory, videoCategory => videoCategory.subCategories, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "fCategoryId" })
    videoCategory: VideoCategory;

    @Column("int", { nullable: true })
    fCategoryId: number;

    @OneToMany(Type => Video, video => video.cate, { onDelete: 'SET NULL' })
    videos: Video[];

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

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
