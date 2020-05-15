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

    @Column({type: 'money', nullable: true})
    cost: number;

    @Column()
    ticker: string;

    @Column({default: false})
    isBack: boolean;

    @Column({default: false})
    isSuccess: boolean;

    @Column({nullable: true, type: 'money'})
    profit: number


    @UpdateDateColumn()
    updatedDate: Date;
    
    @CreateDateColumn()
    createdDate: Date;

}
