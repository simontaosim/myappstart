import * as koa from 'koa';
import {  httpPost, httpGet } from "../decorators/HttpRoutes";
import BinanceService from '../services/partners/BinanceService';

export default class BinanceController {

    @httpGet('/price/bid')
    async bid(ctx: koa.Context){
        const Binance = require('node-binance-api');
        const binance = new Binance().options({
            APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
            APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
        binance.websockets.bookTickers( 'BTCUSDT', (error:any, ticker:any)=>{
            console.log(error);
            console.log(ticker);
        });
        ctx.body = 'just test';
    }
    @httpGet("/trade/start")
    async start(ctx: koa.Context){
        const service = new BinanceService(ctx.DBConnection);
        try {
            await service.startOrder('BTCUSDT', 1000, ctx.io);
            ctx.rest({
                code: "start:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
    @httpGet("/trade/stop")
    async stop(ctx: koa.Context){
        const service = new BinanceService(ctx.DBConnection);
        try {
            await service.stopOrder('BTCUSDT');

            ctx.rest({
                code: "stop:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
}