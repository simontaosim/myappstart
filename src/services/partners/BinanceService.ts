import { Repository, LessThanOrEqual, LessThan, MoreThan, MoreThanOrEqual } from "typeorm";
import { CoinPrice } from "../../entity/CoinPrice";
import { getKey, putKey } from "../utils/cache";

export default class BinanceService {
    private binance: any;
    public currentPrice: number;
    public possible: number;
    private repository: Repository<CoinPrice>;
    private price: CoinPrice;

    //凯利公式定值
    private position = 0.1;
    private winPossibility = 1.01/3;
    private limitWin = 0.01;
    private limintLoss = 0.005;
    constructor(repository: any) {
        this.repository = repository;
        const Binance = require('node-binance-api');
        this.binance = new Binance().options({
            APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
            APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
    }

    getCurrentPrice = async (ticker: string) => {
        try {
            const prices = await this.binance.futuresPrices();
            const newPriceNumber = Number.parseFloat(prices[ticker]);
            const newPrice = this.repository.create({
                price: Number.parseFloat(newPriceNumber.toFixed(2)),
                lastPrice: this.currentPrice,
                ticker,
            })
            await this.repository.save(newPrice);
            this.price = newPrice;
            //反向统计避免重复计算； 找出小于当前价格10%的价格；找出大于当前价格5%的价格，并且更新
            const up20PercentPrice = await this.repository.findOne({
                where: {
                    price: LessThanOrEqual(newPriceNumber * (1 - this.limitWin)),
                    createdDate: LessThan(new Date()),
                },
                order: {
                    createdDate: "DESC",
                }

            })
            console.log({up20PercentPrice});
            
            if(up20PercentPrice){
                up20PercentPrice.up20PercentTimes = up20PercentPrice.up20PercentTimes + 1;
                await this.repository.save(up20PercentPrice);
            }
            const down10PercentPrice = await this.repository.findOne({
                where: {
                    price: MoreThanOrEqual(newPriceNumber * (1 + this.limintLoss)),
                    createdDate: LessThan(new Date()),
                },
                order: {
                    createdDate: "DESC",
                }
            })
            console.log({down10PercentPrice});
            
            if(down10PercentPrice){
                down10PercentPrice.down10PercentTimes = down10PercentPrice.down10PercentTimes + 1;
                await this.repository.save(down10PercentPrice);
            }
            this.currentPrice = Number.parseFloat(prices[ticker]);
        } catch (e) {
            console.error(e);
            throw e;
        }



    }

    calculateWinPossibility = async () => {
        const allPossible = this.price.up20PercentTimes + this.price.down10PercentTimes;
        return this.price.up20PercentTimes / allPossible;

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