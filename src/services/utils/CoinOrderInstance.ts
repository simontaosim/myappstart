export interface Position  {
    money: number,
    isBack: boolean,
    isStarted: boolean,
    limitLoss: number,
    limitWin: number,
    price: number,
    quantity: number,
}
export const AutoStart = {
    isStarted: false,
    allMoney: 150,
}



export const OrderPositions: Position[] = [
    {
        money: 0,
        isBack: true,
        isStarted: false,
        limitLoss: 0,
        limitWin: 0,
        price: 0,
        quantity: 0,
    },
    {
        money: 0,
        isBack: true,
        isStarted: false,
        limitLoss: 0,
        limitWin: 0,
        price: 0,
        quantity: 0,

    },
    {
        money: 0,
        isBack: true,
        isStarted: false,
        limitLoss: 0,
        limitWin: 0,
        price: 0,
        quantity: 0,


    }
]