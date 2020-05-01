import * as koa from 'koa';

import { httpGet } from "../decorators/HttpRoutes";
import Jobs from '../utils/Jobs';

export default class UploadController {
    @httpGet("/image/:resource/:id/:filename")
    async upload(ctx: koa.Context){
        // await Jobs.push("test", {good: 'test1'});
        // await Jobs.push("test", {good: 'test2'});
        // await Jobs.push("test", {good: 'test3'});
        await Jobs.pop("test", (value:any, currentIndex) =>{
            console.log({
                value,
                currentIndex
            });
            ctx.body = {value, currentIndex};
            
        });
        // ctx.body = "push";
       
    }
}