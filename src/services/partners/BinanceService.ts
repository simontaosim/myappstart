import { Repository, LessThanOrEqual, LessThan, MoreThan, MoreThanOrEqual } from "typeorm";
import { CoinPrice } from "../../entity/CoinPrice";
import { getKey, putKey } from "../utils/cache";
import { CoinPricePossible } from "../../entity/CoinPricePossible";

const googleTrends = require('google-trends-api');
const Binance = require('node-binance-api');

export default class BinanceService {
    private binance: any;
    public currentPrice: number;
    public possible: number;
    private repository: Repository<CoinPrice>;
    private possibleRepository: Repository<CoinPricePossible>
    private price: CoinPricePossible;

    //凯利公式定值
    private position = 0.1;
    private winPossibility = 1.01 / 3;
    private limitWin = 0.01;
    private limintLoss = 0.005;
    constructor(repository: any, possibleRepository: any) {
        this.repository = repository;
        this.possibleRepository = possibleRepository;
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
            const newPrice = this.repository.create({
                price: newPriceNumber,
                lastPrice: this.currentPrice,
                ticker,
            })
            await this.repository.save(newPrice);
            //反向统计避免重复计算； 找出小于当前价格10%的价格；找出大于当前价格5%的价格，并且更新
            const upPercentPrice = await this.possibleRepository.findOne({
                where: {
                    price: LessThanOrEqual(newPriceNumber / (1 + this.limitWin)),
                    updatedDate: LessThan(new Date()),
                    ticker,
                },
                order: {
                    updatedDate: "DESC",
                }

            })
            console.log({ upPercentPrice });

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
                    updatedDate: "DESC",
                }
            })
            console.log({ downPercentPrice });

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


            this.price = newPricePossible;

            this.currentPrice = Number.parseFloat(prices[ticker]);
        } catch (e) {
            console.error(e);
            throw e;
        }



    }

    getGoogleTrendsPossible = async (startTime: Date, endTime: Date) => {
        try {
            const { ExploreTrendRequest } = require('g-trends')

            const explorer = new ExploreTrendRequest();
            const rlt = await explorer
            .pastHour()
            .addKeyword('bitcoin price')
            .download();

            return rlt;
                
        } catch (e) {
            console.error(e);
            throw e;

        }


    }

    calculateWinPossibility = async (ticker) => {
        console.log('當前價格', this.price);
        
        const allPossible = this.price.upPercentTimes + this.price.downPercentTimes;

        //找出目标价格的最近更新的时间和现在的时间的间隔间，google trends bitcoin price的
        // console.log("目标价格", this.currentPrice * (1 + this.limitWin));
        
        // const targetPrice = await this.possibleRepository.findOne({
        //     where: {
        //         price: MoreThanOrEqual(this.currentPrice * (1 + this.limitWin)),
        //         ticker,
        //     },
        //     order: {
        //         updatedDate: "DESC",
        //     }
        // });
        // const trends = await this.getGoogleTrendsPossible(targetPrice.updatedDate, new Date());
        // try {
        //     const trends = await this.getGoogleTrendsPossible(new Date('2020-5-4'), new Date());
        //     console.log(trends);
        // } catch (e) {
        //     console.error(e);
            
        // }
       

        //取google trends的平均数.
        //计算高于目标价格出现的频率，和总获取价格频率的比例
        const allShow = await this.possibleRepository.createQueryBuilder('coin_price_possible')
            .where("ticker=:ticker", { ticker })
            .select('SUM(coin_price_possible.showTimes)').getRawOne();

        console.log({ allShow });

        const targetShow = await this.possibleRepository.createQueryBuilder('coin_price_possible')
            .where("price>=:price and ticker=:ticker", { price: this.currentPrice * (1 + this.limitWin), ticker })
            .select('SUM(coin_price_possible.showTimes)').getRawOne();

        console.log({ showPossible: targetShow.sum/allShow.sum });
        const possible = ((this.price.upPercentTimes / allPossible===NaN ? 0 : this.price.upPercentTimes / allPossible)+ targetShow.sum/allShow.sum)/2

        //频率比例， 上涨可能性，google trends平均数，三者的平均数来确定最终概率.

        return possible;

    }

    canBuy = async (ticker) => {
        this.possible = await this.calculateWinPossibility(ticker);
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
            const canBuy = await this.canBuy(ticker);
            if (canBuy) {
                console.log(canBuy);
            } else {
                console.log(this.currentPrice, "不能买", {
                    possible: this.possible,
                    wishPossible: this.winPossibility,
                });
            }
        }, 3000)
    }

    stopAuthTrader = async (ticker) => {
        const startKey = `is_${ticker}_start`;
        await putKey(startKey, '0')
    }

}