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
        try {
            ctx.rest({
                code: "start:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
    @httpGet("/trade/stop")
    async stop(ctx: koa.Context){
        try {

            ctx.rest({
                code: "stop:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
}