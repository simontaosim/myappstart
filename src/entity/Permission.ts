import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    VersionColumn,
    DeleteDateColumn,
    ManyToOne,
    JoinColumn
} from "typeorm";
import { Role } from "./Role";

@Entity()
export class Permission {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    resource: string;

   @Column({ default: false })
   get: boolean;

   @Column({ default: false })
   put: boolean;

   @Column({ default: false })
    post: boolean;

    @Column({ default: false })
    remove: boolean;

    @ManyToOne(type=> Role, role => role.permissions, { onDelete: 'SET NULL' })
    @JoinColumn({ name: "roleId" })
    role: Role;

    @Column("int", { nullable: true })
    roleId: number;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

    @DeleteDateColumn()
    deletedDate: Date;

}
