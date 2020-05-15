import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
    Unique,
} from "typeorm";


@Entity()
@Unique(["price"])
export class CoinPricePossible {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    ticker: string;

    @Column({type: 'money', nullable:false})
    price: number;

    @Column({type: 'int', nullable: false, default: 0})
    upPercentTimes: number;

    @Column({type: 'int', nullable: false, default: 0})
    downPercentTimes: number;

    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

}
