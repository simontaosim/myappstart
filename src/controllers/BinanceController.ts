import * as koa from 'koa';
import {  httpPost, httpGet } from "../decorators/HttpRoutes";
import BinanceService from '../services/partners/BinanceService';

export default class BinanceController {
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