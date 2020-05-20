import * as koa from 'koa';
import {   httpGet } from "../decorators/HttpRoutes";
import CoinOrderInstance from '../services/utils/CoinOrderInstance';

export default class BinanceController {

 
    @httpGet("/trade/start")
    async start(ctx: koa.Context){
        try {
          CoinOrderInstance.isStarted = true;
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
            CoinOrderInstance.isStarted = false;
            ctx.rest({
                code: "stop:trade:success",
            })
        
        } catch (e) {
            throw e;
        }
    } 
}