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

    @Column({type: 'int', nullable: false, default: 0})
    up20PercentTimes: number;

    @Column({type: 'int', nullable: false, default: 0})
    down10PercentTimes: number;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

}
