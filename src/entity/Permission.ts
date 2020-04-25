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
    AfterUpdate,
    AfterRemove,
} from "typeorm";
import { Role } from "./Role";

@Entity()
export class Permission {
    @AfterUpdate()
    updateCounters() {
      console.log("此处更新role");
      
    }

    @AfterRemove()
    removeRole(){
        console.log("此时删除了role");
        
    }
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

    @Column({default: false})
    isDefault: boolean;

    @Column({default: false})
    grant: boolean;

    @ManyToOne(type=> Role, role => role.permissions, { onDelete: 'CASCADE', onUpdate: "CASCADE"  })
    @JoinColumn({
        name: "roleId",
    })
    role: Role;

    @Column("int", { nullable: true})
    roleId: number;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;
    
    @VersionColumn()
    version: number;

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
