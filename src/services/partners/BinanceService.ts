import { Repository, LessThanOrEqual, LessThan, MoreThanOrEqual, Connection } from "typeorm";
import { getKey, putKey } from "../utils/cache";
import { CoinPricePossible } from "../../entity/CoinPricePossible";
import { CoinOrder } from "../../entity/CoinOrder";
import { Socket } from "socket.io";
import CoinOrderInstance from "../utils/CoinOrderInstance";

const Binance = require('node-binance-api');

export default class BinanceService {
    private binance: any;
    public possible: number;
    private possibleRepository: Repository<CoinPricePossible>
    private orderRepository: Repository<CoinOrder>
    private currentPrice:number = 0;

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
        this.binance.websockets.bookTickers('BTCUSDT', async (ticker:any, error:any)=>{
            if(!error){
               this.currentPrice = Number.parseFloat(ticker.bestBid);
            }
        });
    }

     storePirces = async  (io:Socket) => {
        const currentPrice = this.currentPrice;
        let timer:NodeJS.Timer;
        timer = setInterval(async ()=>{
            if(currentPrice){
              
                let newPrice = await this.possibleRepository.findOne({where: {
                    ticker: "BTCUSDT",
                    price: currentPrice,
                }});
                if(!newPrice){
                    newPrice = this.possibleRepository.create({
                        ticker: "BTCUSDT",
                        price: currentPrice,
                    })
                }
                newPrice.showTimes += 1;
                await this.possibleRepository.save(newPrice);
                console.log(newPrice);
                io.emit("latest", newPrice);
            }
        },500)
    }

    staticPrices = async  (io: Socket) => {
        const currentPrice = this.currentPrice;
        let timer:NodeJS.Timer;
        timer = setInterval(async ()=>{
            if(currentPrice){
                const upPercentPrice = await this.possibleRepository.findOne({
                    where: {
                        price: LessThanOrEqual(currentPrice / (1 + this.limitWin)),
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
                        price: MoreThanOrEqual(currentPrice / (1 - this.limintLoss)),
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

    startOrder = async (ticker: string,  io:Socket, price: CoinPricePossible) => {
        
        //獲取當前價格
        io.emit('isAutoTraderStart', true);
        const moneyToPut = CoinOrderInstance.usedMoney*this.position;
        //倉位
        if(!price){
            console.error("price lost, check the getPrices Method");
            return false;
        }
        const canBuy = await  this.canBuy(ticker, price, io);
        if(canBuy){
            console.log('可以購買，開始下單');
            io.emit('canBuy', true);
            if(moneyToPut > 10 && CoinOrderInstance.isBack){
                const order = this.orderRepository.create({
                    price: price.price,
                    cost: moneyToPut,
                    quantity: moneyToPut/price.price,
                    limitLoss: price.price*(1-this.limintLoss),
                    limitWin: price.price*(1+this.limitWin),
                    ticker
                });
                await this.orderRepository.save(order);
                console.log("下的单", order);
                CoinOrderInstance.isBack = false;
            }
        
        }else{
            io.emit('canBuy', false);
        }

    }

}
