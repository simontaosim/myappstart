import * as koa from 'koa';
import * as uuid from 'uuid';
import {  httpPost } from "../decorators/HttpRoutes";
import ipfsnode from '../utils/ipfsnode';
import { readFile, createReadStream } from 'fs';

export default class UploadController {
    @httpPost("/upload")
    async upload(ctx: koa.Context){
        
        console.log("开始上传图片。。。");
        const filename = ctx.request.body.filename || uuid.v4();
        const file = ctx.request.files.file;
       const stream  = createReadStream(file.path);
       console.log(stream);
        const ext = file.name.split('.').pop(); 
        const ipfs = await ipfsnode();
        await ipfs.files.touch(`/images/${file.name}`);
        await  ipfs.files.write(`/images/${file.name}`, stream);
        const stat = await ipfs.files.stat(`/images/${file.name}`);
       ctx.rest({
           filename,
           file,
           ext,
           stat,
           cid: stat.cid.toString()
       })
    }
}