import { Repository, LessThanOrEqual, LessThan, MoreThanOrEqual, Connection } from "typeorm";
import { getKey, putKey } from "../utils/cache";
import { CoinPricePossible } from "../../entity/CoinPricePossible";
import { CoinOrder } from "../../entity/CoinOrder";
import { Socket } from "socket.io";

const Binance = require('node-binance-api');

export default class BinanceService {
    private binance: any;
    public possible: number;
    private possibleRepository: Repository<CoinPricePossible>
    private orderRepository: Repository<CoinOrder>

    //凯利公式定值
    private position = 0.511;
    private winPossibility = 1.00511 / 3;
    private limitWin = 0.01;
    private limintLoss = 0.005;
    constructor(connection: Connection, io:Socket) {
        const possibleRepository = connection.getRepository(CoinPricePossible);
        const orderRepository = connection.getRepository(CoinOrder);
        this.possibleRepository = possibleRepository;
        this.orderRepository = orderRepository;

        this.binance = new Binance().options({
            APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
            APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
        let oldPrice = 0;
        this.binance.websockets.bookTickers('BTCUSDT', async (ticker:any, error:any)=>{
            if(!error){
                let newPriceNumber = Number.parseFloat(ticker.bestBid);
                if(newPriceNumber === oldPrice){
                    return false;
                }
                try {
                    const upPercentPrice = await this.possibleRepository.findOne({
                        where: {
                            price: LessThanOrEqual(newPriceNumber / (1 + this.limitWin)),
                            updatedDate: LessThan(new Date()),
                            ticker:'BTCUSDT',
                        },
                        order: {
                            updatedDate: "ASC",
                        }
                    })
                    if (upPercentPrice) {
                        upPercentPrice.upPercentTimes = upPercentPrice.upPercentTimes + 1;
                        await this.possibleRepository.save(upPercentPrice);
                    }
                    const downPercentPrice = await this.possibleRepository.findOne({
                        where: {
                            price: MoreThanOrEqual(newPriceNumber / (1 - this.limintLoss)),
                            updatedDate: LessThan(new Date()),
                            ticker: 'BTCUSDT',
                        },
                        order: {
                            updatedDate: "ASC",
                        }
                    })
                    if (downPercentPrice) {
                        downPercentPrice.downPercentTimes = downPercentPrice.downPercentTimes + 1;
                        await this.possibleRepository.save(downPercentPrice);
                    }
                    io.emit('fromUp', upPercentPrice);
                    io.emit('fromDown', downPercentPrice);
                    let newPricePossible = await this.possibleRepository.findOne({
                        where: {
                            price: newPriceNumber,
                            ticker: 'BTCUSDT',
                        }
                    })
                    if (!newPricePossible) {
                        newPricePossible = this.possibleRepository.create({
                            price: newPriceNumber,
                            ticker: 'BTCUSDT',
                            showTimes: 1,
                        });
                        await this.possibleRepository.save(newPricePossible);
                    } else {
                        newPricePossible.showTimes += 1;
                        await this.possibleRepository.save(newPricePossible);
                    }
                    
                    await putKey(`is_BTCUSDT_order_start`, newPriceNumber.toString());
                    io.emit('lastestPrice', newPricePossible);
                    const startKey = `is_BTCUSDT_order_start`;
                    const isStarted = await getKey(startKey);
                    console.log({isStarted});
                    if (isStarted !== '0' && isStarted) {
                        io.emit('isAutoTraderStart', true);
                        const startMoney = Number.parseFloat(isStarted);
                        this.startOrder('BTCUSDT',startMoney, io, newPricePossible);
                    }
                    oldPrice = newPriceNumber;
                } catch (error) {
                    if(error.detail.includes("already exists")){
                        console.log('补上没有写入的');
                        
                        const missingPrice = await this.possibleRepository.findOne({
                            where: {
                                price: newPriceNumber,
                                ticker: 'BTCUSDT',
                            }
                        })
                        if(missingPrice){
                            missingPrice.showTimes += 1;
                            await this.possibleRepository.save(missingPrice)
                        }
                        
                    }
                    
                }
            }
        });
    }

    calculateWinPossibility = async (ticker: string, price: CoinPricePossible, io:Socket) => {
        const allPossible = price.upPercentTimes + price.downPercentTimes;
      
        const currentPrice = price.price;
        const allShow = await this.possibleRepository.createQueryBuilder('coin_price_possible')
            .where("ticker=:ticker", { ticker })
            .select('SUM(coin_price_possible.showTimes)').getRawOne();

        const targetShow = await this.possibleRepository.createQueryBuilder('coin_price_possible')
            .where("price>=:price and ticker=:ticker", { price: Number.parseFloat(currentPrice.toString()) * (1 + this.limitWin), ticker })
            .select('SUM(coin_price_possible.showTimes)').getRawOne();

        console.log({ showPossible: targetShow.sum / allShow.sum });
        if (price.upPercentTimes >= 10 && allPossible! === 0 && price.downPercentTimes >= 10) {
            //数据足够大才有意义
            return (price.upPercentTimes / allPossible + targetShow.sum / allShow.sum) / 2
        }
        // return (targetShow.sum / allShow.sum) 
        return (targetShow.sum / allShow.sum) / 2

        //频率比例， 上涨可能性，二者的平均数来确定最终概率.

    }

    canBuy = async (ticker: string, price: CoinPricePossible, io:Socket) => {
        this.possible = await this.calculateWinPossibility(ticker, price, io);
        console.log("最終概率", this.possible);
        io.emit('currentPossible', this.possible);
        if (this.possible >= this.winPossibility) {
            return true;
        }
        return null;
    }

    sellOutAll = async (ticker: string, price: CoinPricePossible, io:Socket) => {
        const updateOrder = async  (orders: CoinOrder[]) => {
            for (let index = 0; index < orders.length; index++) {
                const order = orders[index];
                const profit = order.quantity*order.price - order.cost;
                order.isBack = true;
                order.profit = profit;
                await this.orderRepository.save(order);
                //處理倉位
                const backMoney =order.cost + profit;
                const moneyPositionStr = await getKey(`all_money_position_${ticker}`);
                let moneyPosition = Number.parseFloat(moneyPositionStr);
                moneyPosition = moneyPosition + backMoney;
                console.log("此單獲益",profit.toString());
                console.log("當前倉位", moneyPosition);
                await putKey(`all_money_position_${ticker}`, moneyPosition.toString());

            }
        }
        let orders = await  this.orderRepository.find({
            limitLoss: LessThanOrEqual(price.price),
            ticker,
            isBack: false,
        })
        await updateOrder(orders);
     
        orders = await this.orderRepository.find({
            limitWin: MoreThanOrEqual(price.price),
            ticker,
            isBack: false,
        })
        await updateOrder(orders);


    }

    stopOrder  = async (ticker: string ) => {
        const startKey = `is_${ticker}_order_start`;
        const usedMoneyKey: string = `${ticker}_used_money`;
        //獲取當前價格
        await putKey(startKey, '0');
        await putKey(`all_money_position_${ticker}`, '0');
        await putKey(usedMoneyKey, '0');
    }

    startOrder = async (ticker: string, usedMoney: number, io:Socket, price: CoinPricePossible) => {
        await putKey(`all_money_position_${ticker}`, usedMoney.toString());
        //記錄投資過的錢的總數
        const usedMoneyKey: string = `${ticker}_used_money`;
        //獲取當前價格
        io.emit('isAutoTraderStart', true);
        const moneyToPut = usedMoney*this.position;
        //倉位
        if(!price){
            console.error("price lost, check the getPrices Method");
            return false;
        }
        const canBuy = await  this.canBuy(ticker, price, io);
        if(canBuy){
            console.log('可以購買，開始下單');
            io.emit('canBuy', true);
            const order = this.orderRepository.create({
                price: price.price,
                cost: moneyToPut,
                quantity: moneyToPut/price.price,
                limitLoss: price.price*(1-this.limintLoss),
                limitWin: price.price*(1+this.limitWin),
                ticker
            });
            await this.orderRepository.save(order);
            const allMoneyPut = await getKey(usedMoneyKey);
            if(!allMoneyPut){
                putKey(usedMoneyKey, moneyToPut.toString());
            }else{
                let allMoney = Number.parseFloat(allMoneyPut)
                allMoney+=moneyToPut;
                putKey(usedMoneyKey, allMoney.toString());
            }
            const positionStr = await getKey(`all_money_position_${ticker}`);
            const newPosition = Number.parseFloat(positionStr) - Number.parseFloat(moneyToPut.toString());
            console.log("當前倉位", newPosition);
            await putKey(`all_money_position_${ticker}`, newPosition.toString());
        }else{
            io.emit('canBuy', false);
        }
        await this.sellOutAll(ticker, price, io);

    }

}
