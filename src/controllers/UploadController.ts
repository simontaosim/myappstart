import * as koa from 'koa';

import { httpGet } from "../decorators/HttpRoutes";
import Jobs from '../utils/Jobs';

export default class UploadController {
    @httpGet("/upload")
    async upload(ctx: koa.Context){
        // await Jobs.push("test", {good: 'test1'});
        // await Jobs.push("test", {good: 'test2'});
        // await Jobs.push("test", {good: 'test3'});
        await Jobs.pop("test", (value:any) =>{
            console.log({
                value
            });
            ctx.body = {value};
            
        });
        // ctx.body = "push";
       
    }
}