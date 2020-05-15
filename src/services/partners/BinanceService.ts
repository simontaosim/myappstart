import { Repository, LessThanOrEqual, LessThan, MoreThan, MoreThanOrEqual } from "typeorm";
import { CoinPrice } from "../../entity/CoinPrice";
import { getKey, putKey } from "../utils/cache";
import { CoinPricePossible } from "../../entity/CoinPricePossible";

export default class BinanceService {
    private binance: any;
    public currentPrice: number;
    public possible: number;
    private repository: Repository<CoinPrice>;
    private possibleRepository: Repository<CoinPricePossible>
    private price: CoinPricePossible;

    //凯利公式定值
    private position = 0.1;
    private winPossibility = 1.01/3;
    private limitWin = 0.01;
    private limintLoss = 0.005;
    constructor(repository: any, possibleRepository:any) {
        this.repository = repository;
        this.possibleRepository = possibleRepository;
        const Binance = require('node-binance-api');
        this.binance = new Binance().options({
            APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
            APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
    }

    getCurrentPrice = async (ticker: string) => {
        try {
            const prices = await this.binance.futuresPrices();
            let  newPriceNumber = Number.parseFloat(prices[ticker]);
            newPriceNumber =Number.parseFloat(newPriceNumber.toFixed(2));
            const newPrice = this.repository.create({
                price: newPriceNumber,
                lastPrice: this.currentPrice,
                ticker,
            })
            await this.repository.save(newPrice);
            //反向统计避免重复计算； 找出小于当前价格10%的价格；找出大于当前价格5%的价格，并且更新
            const upPercentPrice = await this.possibleRepository.findOne({
                where: {
                    price: LessThanOrEqual(newPriceNumber * (1 - this.limitWin)),
                    updatedDate: LessThan(new Date()),
                    ticker,
                },
                order: {
                    updatedDate: "DESC",
                }

            })
            console.log({upPercentPrice});
            
            if(upPercentPrice){
                upPercentPrice.upPercentTimes = upPercentPrice.upPercentTimes + 1;
                await this.possibleRepository.save(upPercentPrice);
            }
            const downPercentPrice = await this.possibleRepository.findOne({
                where: {
                    price: MoreThanOrEqual(newPriceNumber * (1 + this.limintLoss)),
                    updatedDate: LessThan(new Date()),
                    ticker,
                },
                order: {
                    updatedDate: "DESC",
                }
            })
            console.log({downPercentPrice});
            
            if(downPercentPrice){
                downPercentPrice.downPercentTimes = downPercentPrice.downPercentTimes + 1;
                await this.possibleRepository.save(downPercentPrice);
            }
            let newPricePossible = await this.possibleRepository.findOne({where: {
                price: newPriceNumber,
                ticker,
            }})
            if(!newPricePossible){
                newPricePossible = this.possibleRepository.create({
                    price: newPriceNumber,
                    ticker,
                });
                await this.possibleRepository.save(newPricePossible);
            }

            this.price = newPricePossible;

            this.currentPrice = Number.parseFloat(prices[ticker]);
        } catch (e) {
            console.error(e);
            throw e;
        }



    }

    calculateWinPossibility = async () => {
        const allPossible = this.price.upPercentTimes + this.price.downPercentTimes;
        if(allPossible === 0){
            return 0;
        }
        return this.price.upPercentTimes / allPossible;

    }

    canBuy = async () => {
        this.possible = await this.calculateWinPossibility();
        if (this.possible >= this.winPossibility) {
            return {
                price: this.currentPrice,
                position: this.position,
                limitHighSellPrice: this.currentPrice * (1 + this.limitWin),
                limitLowSellPrice: this.currentPrice * (1 - this.limintLoss),
                possible: this.possible,
                wishPossible: this.winPossibility,
            };
        }
        return null;
    }

    startAutoTrade = async (ticker) => {
        //开始自动交易
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
            console.log('当前价格', this.price.price);
            const canBuy = await this.canBuy();
            if (canBuy) {
                console.log(canBuy);
            } else {
                console.log(this.currentPrice, "不能买", {
                    possible: this.possible,
                    wishPossible: this.winPossibility,
                });
            }
        }, 1000)
    }

    stopAuthTrader = async (ticker) => {
        const startKey = `is_${ticker}_start`;
        await putKey(startKey, '0')
    }

}