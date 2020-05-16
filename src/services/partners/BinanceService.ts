import { Repository, LessThanOrEqual, LessThan, MoreThanOrEqual, Connection } from "typeorm";
import { getKey, putKey } from "../utils/cache";
import { CoinPricePossible } from "../../entity/CoinPricePossible";
import { CoinOrder } from "../../entity/CoinOrder";

const Binance = require('node-binance-api');

export default class BinanceService {
    private binance: any;
    public possible: number;
    private possibleRepository: Repository<CoinPricePossible>
    private orderRepository: Repository<CoinOrder>

    //凯利公式定值
    private position = 0.1;
    private winPossibility = 1.01 / 3;
    private limitWin = 0.01;
    private limintLoss = 0.005;
    constructor(connection: Connection) {
        const possibleRepository = connection.getRepository(CoinPricePossible);
        const orderRepository = connection.getRepository(CoinOrder);
        this.possibleRepository = possibleRepository;
        this.orderRepository = orderRepository;

        this.binance = new Binance().options({
            APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
            APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
    }

    getCurrentPrice = async (ticker: string) => {
        try {
            const prices = await this.binance.futuresPrices();
            let newPriceNumber = Number.parseFloat(prices[ticker]);
            newPriceNumber = Number.parseFloat(newPriceNumber.toFixed(2));
            //反向统计避免重复计算； 找出小于当前价格10%的价格；找出大于当前价格5%的价格，并且更新
            const upPercentPrice = await this.possibleRepository.findOne({
                where: {
                    price: LessThanOrEqual(newPriceNumber / (1 + this.limitWin)),
                    updatedDate: LessThan(new Date()),
                    ticker,
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
                    ticker,
                },
                order: {
                    updatedDate: "ASC",
                }
            })
            if (downPercentPrice) {
                downPercentPrice.downPercentTimes = downPercentPrice.downPercentTimes + 1;
                await this.possibleRepository.save(downPercentPrice);
            }
            let newPricePossible = await this.possibleRepository.findOne({
                where: {
                    price: newPriceNumber,
                    ticker,
                }
            })
            if (!newPricePossible) {
                newPricePossible = this.possibleRepository.create({
                    price: newPriceNumber,
                    ticker,
                    showTimes: 1,
                });
            } else {
                newPricePossible.showTimes += 1;
            }
            await this.possibleRepository.save(newPricePossible);
            await putKey(`current_${ticker}_price`, newPriceNumber.toString());
            console.log({
                up: upPercentPrice,
                down: downPercentPrice,
            });
            
        } catch (e) {
            console.error(e);
            throw e;
        }

    }

    calculateWinPossibility = async (ticker: string, price: CoinPricePossible) => {
        const allPossible = price.upPercentTimes + price.downPercentTimes;
        const allShow = await this.possibleRepository.createQueryBuilder('coin_price_possible')
            .where("ticker=:ticker", { ticker })
            .select('SUM(coin_price_possible.showTimes)').getRawOne();

        const targetShow = await this.possibleRepository.createQueryBuilder('coin_price_possible')
            .where("price>=:price and ticker=:ticker", { price: price.price * (1 + this.limitWin), ticker })
            .select('SUM(coin_price_possible.showTimes)').getRawOne();

        console.log({ showPossible: targetShow.sum / allShow.sum });
        if (price.upPercentTimes !== 0 && allPossible! === 0 && price.downPercentTimes !== 0) {
            return (price.upPercentTimes / allPossible + targetShow.sum / allShow.sum) / 2
        }
        return (targetShow.sum / allShow.sum) / 2

        //频率比例， 上涨可能性，二者的平均数来确定最终概率.

    }

    canBuy = async (ticker: string, price: CoinPricePossible) => {
        this.possible = await this.calculateWinPossibility(ticker, price);
        console.log("最終概率", this.possible);
        
        if (this.possible >= this.winPossibility) {
            return true;
        }
        return null;
    }

    startGetPrices = async (ticker: string) => {
        const startKey = `is_${ticker}_start`;
        const isStarted = await getKey(startKey);
        if (isStarted === '0' || !isStarted) {
            await putKey(startKey, '1')
        }
        let timer: NodeJS.Timer;
        timer = setInterval(async () => {
            const isStarted = await getKey(startKey);
            if (isStarted === '0') {
                return clearInterval(timer);
            }
            await this.getCurrentPrice(ticker);
        }, 3000)
    }

    sellOutAll = async (ticker: string, price: CoinPricePossible) => {
        const updateOrder = async  (orders: CoinOrder[]) => {
            for (let index = 0; index < orders.length; index++) {
                const order = orders[index];
                order.isBack = true;
                order.profit = order.cost - (order.quantity*order.price)
                await this.orderRepository.save(order);
                //處理倉位
                const backMoney = order.cost+order.profit;
                const moneyPositionStr = await getKey(`all_money_position_${ticker}`);
                let moneyPosition = Number.parseFloat(moneyPositionStr);
                moneyPosition += backMoney;
                await putKey(`all_money_position_${ticker}`, moneyPosition.toString());


            }
        }
        let orders = await  this.orderRepository.find({
            limitLoss: LessThanOrEqual(price.price),
            ticker,
        })
        await updateOrder(orders);
     
        orders = await this.orderRepository.find({
            limitWin: MoreThanOrEqual(price.price),
            ticker,
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

    startOrder = async (ticker: string, usedMoney: number) => {
        await putKey(`all_money_position_${ticker}`, usedMoney.toString());
        //記錄投資過的錢的總數
        const usedMoneyKey: string = `${ticker}_used_money`;
        //獲取當前價格
        const currentPriceKey: string = `current_${ticker}_price`; 
        const startKey = `is_${ticker}_order_start`;
        const isStarted = await getKey(startKey);
        if (isStarted === '0' || !isStarted) {
            await putKey(startKey, '1')
        }
        let timer: NodeJS.Timer;
        timer = setInterval(async () => {
            const isStarted = await getKey(startKey);
            if (isStarted === '0') {
                return clearInterval(timer);
            }
            const moneyToPut = usedMoney*this.position;
            //倉位
            const currentPrice = await getKey(currentPriceKey);
            if(!currentPrice){
                console.error("price lost, check the getPrices Method");
                return false;
            }
            const price = await this.possibleRepository.findOne({price: Number.parseFloat(currentPrice)});
            if(!price){
                console.error("price lost, check the getPrices Method");
                return false;
            }
            const canBuy = await  this.canBuy(ticker, price);
            if(canBuy){
                const order = this.orderRepository.create({
                    price: price.price,
                    cost: moneyToPut,
                    quantity: moneyToPut/price.price,
                    limitLoss: price.price*this.limintLoss,
                    limitWin: price.price*this.limitWin,
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
                const newPosition = Number.parseFloat(positionStr) - moneyToPut;
                await putKey(`all_money_position_${ticker}`, newPosition.toString());
            }
            await this.sellOutAll(ticker, price);

        }, 3000)
    }

}