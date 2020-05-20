import * as koa from 'koa';
import {   httpGet } from "../decorators/HttpRoutes";
import { getKey, putKey } from '../services/utils/cache';

export default class BinanceController {

 
    @httpGet("/trade/start")
    async start(ctx: koa.Context){
        try {
            const startKey = `is_BTCUSDT_order_start`;
            await putKey(startKey, '100');
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
            const startKey = `is_BTCUSDT_order_start`;
            await putKey(startKey, '0');
            ctx.rest({
                code: "stop:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
}