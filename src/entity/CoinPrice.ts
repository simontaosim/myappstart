import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
} from "typeorm";


@Entity()
export class CoinPrice {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'money', nullable: false})
    price: number;

    @Column({type: 'money',nullable: true})
    lastPrice: number;

    @Column()
    ticker: string;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

}
