import { Repository, LessThanOrEqual, LessThan, MoreThanOrEqual, Connection } from "typeorm";
import { CoinPricePossible } from "../../entity/CoinPricePossible";
import { CoinOrder } from "../../entity/CoinOrder";
import { Socket } from "socket.io";
import { AutoStart, OrderPositions } from "../utils/CoinOrderInstance";

const Binance = require('node-binance-api');

export default class BinanceService {
    private binance: any;
    public possible: number;
    private possibleRepository: Repository<CoinPricePossible>
    private currentPrice:number = 0;

    //凯利公式定值
    private position = 0.511;
    private winPossibility = 1.00511 / 3;
    private limitWin = 0.01;
    private limitLoss = 0.005;
    constructor(connection: Connection, io:Socket) {
        const possibleRepository = connection.getRepository(CoinPricePossible);
        this.possibleRepository = possibleRepository;

        this.binance = new Binance().options({
            APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
            APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
        this.binance.websockets.bookTickers('BTCUSDT', async (ticker:any, error:any)=>{
            if(!error){
               this.currentPrice = Number.parseFloat(ticker.bestBid);
            }
        });
    }

     storePirces =   (io:Socket) => {

        let timer:NodeJS.Timer;
        timer = setInterval(async ()=>{

            if(this.currentPrice){
              
                let newPrice = await this.possibleRepository.findOne({where: {
                    ticker: "BTCUSDT",
                    price: this.currentPrice,
                }});
                if(!newPrice){
                    newPrice = this.possibleRepository.create({
                        ticker: "BTCUSDT",
                        price: this.currentPrice,
                        showTimes: 1
                    })
                }else{
                    newPrice.showTimes += 1;
                }
              
                await this.possibleRepository.save(newPrice);
                io.emit("latest", newPrice);
            }
        },500)
    }

    staticPrices =   (io: Socket) => {
        let timer:NodeJS.Timer;
        timer = setInterval(async ()=>{
            if(this.currentPrice){
                const upPercentPrice = await this.possibleRepository.findOne({
                    where: {
                        price: LessThanOrEqual(this.currentPrice / (1 + this.limitWin)),
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
                        price: MoreThanOrEqual(this.currentPrice / (1 - this.limitLoss)),
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
            }
        },500)
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

    listenAutoTrade = async (io:Socket) => {
        let timer:NodeJS.Timer;
        timer = setInterval(async () => {
            let canBuy = false;
            let price = null;
            if(this.currentPrice){
                price = await this.possibleRepository.findOne({where: {
                    price: this.currentPrice,
                    ticker: 'BTCUSDT'
                }})
                if(!price){
                   return false;
                }
            }
            console.log({allMoney: AutoStart.allMoney});
            if(AutoStart.isStarted && this.currentPrice){
                let wholeMoney = 0;
                for (let i = 0; i < OrderPositions.length; i++) {
                    const orderPosition = OrderPositions[i];
                    if(!orderPosition.isStarted){
                        orderPosition.money = AutoStart.allMoney*this.position;
                        AutoStart.allMoney -= orderPosition.money;
                        console.log({allMoney: AutoStart.allMoney});
                        orderPosition.isStarted = true;
                    }
                    console.log(i, orderPosition);
                    if(orderPosition.isBack){
                        //当前价格是否可以下单;
                        console.log('当前价格是否可以下单', i);
                        if(price){
                            canBuy = await this.canBuy('BTCUSDT', price, io );
                        }else{
                            continue;
                        }
                        if(canBuy){
                            console.log('可以下单:', i);
                            orderPosition.price = this.currentPrice;
                            orderPosition.quantity = orderPosition.money*this.position/this.currentPrice;
                            orderPosition.limitLoss = this.currentPrice*(1 - this.limitLoss);
                            orderPosition.limitWin = this.currentPrice*(1+ this.limitWin);
                            orderPosition.money = orderPosition.money*(1-this.position);
                            orderPosition.isBack = false;
                        }else{
                            console.log("不能下单");
                        }

                    }else{
                        //如果当前款项没有回来；
                        if(orderPosition.limitLoss >= this.currentPrice){
                            //止损
                            console.log('正在止损');
                            const backMoney = orderPosition.quantity * this.currentPrice;
                            orderPosition.money += backMoney;
                            const distance  = orderPosition.quantity * (this.currentPrice - orderPosition.price);
                            io.emit('distance', distance);
                        }
                        if(orderPosition.limitWin <= this.currentPrice){
                            //止盈
                            console.log('正在止盈');

                            const backMoney = orderPosition.quantity * this.currentPrice;
                            orderPosition.money += backMoney;
                            const distance  = orderPosition.quantity * (this.currentPrice - orderPosition.price);
                            io.emit('distance', distance);
                        }
                      
                    }
                    wholeMoney += orderPosition.money;
                }

                console.log({wholeMoney});
                io.emit('wholeMoney', wholeMoney);

            }else{
                for (let j = 0; j < OrderPositions.length; j++) {
                    const orderPosition = OrderPositions[j];
                    if(orderPosition.isBack){
                        orderPosition.isStarted = false;
                    }else{
                        console.log("等待回款");
                         //如果当前款项没有回来；
                         if(orderPosition.limitLoss >= this.currentPrice){
                            //止损
                            const backMoney = orderPosition.quantity * this.currentPrice;
                            orderPosition.money += backMoney;
                            const distance  = orderPosition.quantity * (this.currentPrice - orderPosition.price);
                            io.emit('distance', distance);
                        }
                        if(orderPosition.limitWin <= this.currentPrice){
                            //止盈
                            const backMoney = orderPosition.quantity * this.currentPrice;
                            orderPosition.money += backMoney;
                            const distance  = orderPosition.quantity * (this.currentPrice - orderPosition.price);
                            io.emit('distance', distance);
                        }
                    }
                }
            }
        }, 500)
    }

}
