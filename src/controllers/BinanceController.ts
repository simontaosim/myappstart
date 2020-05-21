import * as koa from 'koa';
import {   httpGet } from "../decorators/HttpRoutes";
import { AutoStart } from '../services/utils/CoinOrderInstance';

export default class BinanceController {

 
    @httpGet("/trade/start")
    async start(ctx: koa.Context){
        try {
          AutoStart.isStarted = true;
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
            AutoStart.isStarted = false;
            ctx.rest({
                code: "stop:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
}