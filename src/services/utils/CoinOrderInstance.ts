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



export const OrderPositions: Position[] = []