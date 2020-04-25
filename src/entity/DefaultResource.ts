import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
} from "typeorm";

@Entity()
 export class DefaultResource {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: true})
    resource: string;

    @Column()
    resourceId: number ;

}

