import * as koa from 'koa';
import {  httpPost, httpGet } from "../decorators/HttpRoutes";

export default class BinanceController {
    @httpGet("/binance")
    async binance(ctx: koa.Context){
        const Binance = require('node-binance-api');
        const binance = new Binance().options({
        APIKEY: 'lR7PKoiFSubZqjdtokWDexSYA2JrPhvToZfUGlxLYpSWjfBwxNSfxFFOtzYuDT7E',
        APISECRET: 'A1fqkdb9hNTlt1Q1rjD1Bs4SaRZlinJvQId4UhV9ggoWwbsjqs2Sh1Y97Fx5WyIt'
        });
        const prices =  await binance.futuresPrices();
        ctx.body = prices;
    }   
}