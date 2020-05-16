import {
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    UpdateDateColumn, 
    CreateDateColumn,
} from "typeorm";


@Entity()
export class CoinOrder {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: 'money', nullable: false})
    price: number;

    @Column({type: 'money', nullable: true})
    cost: number;

    @Column({type: 'money', nullable: false})
    limitWin: number;

    @Column({type: 'money', nullable: false})
    limitLoss: number;

    @Column({type: 'float', nullable: false})
    quantity: number

    @Column()
    ticker: string;

    @Column({default: false})
    isBack: boolean;

    @Column({default: false})
    isSuccess: boolean;

    @Column({nullable: true, type: 'numeric'})
    profit: number


    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

}
