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

    @Column({type: 'decimal', nullable: false})
    price: number;

    @Column({type: 'decimal', nullable: true})
    cost: number;

    @Column({type: 'decimal', nullable: false})
    limitWin: number;

    @Column({type: 'decimal', nullable: false})
    limitLoss: number;

    @Column({type: 'decimal', nullable: false})
    quantity: number

    @Column()
    ticker: string;

    @Column({default: false})
    isBack: boolean;

    @Column({default: false})
    isSuccess: boolean;

    @Column({nullable: true, type: 'decimal'})
    profit: number


    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

}
