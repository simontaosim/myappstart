import * as koa from 'koa';

import {  httpPost, httpPut } from "../decorators/HttpRoutes";
import * as striptags from 'striptags';
import * as removeEmptyLines from 'remove-blank-lines';
import { Video } from '../entity/Video';
import { VideoCategory } from '../entity/VideoCategory';

function checkPostParams(ctx: koa.Context){

    const  params = (ctx.request  as any).body;
    const { title, body, cover } = params;
    if(title==="" || !title || title.trim().length === 0){
     ctx.status = 400;
     ctx.res.statusMessage = "TITLE_REQUIRED";
     return  {
         status: 'deny',
         reason: 'TITLE_REQUIRED' 
     }
    }

    if(!body){
     ctx.status = 400;
     ctx.res.statusMessage = "BODY_REQUIRED";
     return  {
        status: 'deny',
        reason: 'BODY_REQUIRED' 
    }
    }
    if(body){
        let text = striptags(body);
        text = removeEmptyLines(text);
        if(text.trim().length <=10){
         ctx.status = 400;
         ctx.res.statusMessage = "BODY_REQUIRE_MORE_THAN_10";
         return  {
            status: 'deny',
            reason: 'BODY_REQUIRE_MORE_THAN_50' 
        }
        }

    }
    return {
        status: 'pass',
    }
}

export default class VideoController {
    @httpPost("/videos")
    async create(ctx: koa.Context){
       const  createParams = (ctx.request  as any).body;
       const { title, body, cover, address, isPublished, cateId } = createParams;
       const checkPass = checkPostParams(ctx);
       if(checkPass.status!=='pass'){
           return ctx.rest({
               code: 'post:create:fail',
               reason: checkPass.reason
           })
       }
       const videoRepository = ctx.DBConnection.getRepository(Video);
       const video = videoRepository.create({
           title,
           body,
           cover,
           address,
           authorId: ctx.userId,
           isPublished: isPublished? isPublished : false,
       })
       if(cateId){
           const cateRepository = ctx.DBConnection.getRepository(VideoCategory);
           const cate = await cateRepository.findOne(cateId);
           video.cate = cate;
       }
       await videoRepository.save(video);
       ctx.rest({
           data: video,
            id: video.id,
       })
       
    }

    @httpPut("/videos/:id")
    async update(ctx: koa.Context){
        const { id } = ctx.params;
        const  updateParams = (ctx.request  as any).body;
       const { title, body, cover, address, isPublished, cateId } = updateParams;
       const checkPass = checkPostParams(ctx);
       if(checkPass.status!=='pass'){
           return ctx.rest({
               code: 'post:update:fail',
               reason: checkPass.reason
           })
       }
       const videoRepository = ctx.DBConnection.getRepository(Video);
       let video = await videoRepository.findOne(id);
       if(!video){
           ctx.status = 404;
           ctx.res.statusMessage = "POST_NOT_FOUND";
           return ctx.rest({
               code: 'post:update:fail',
               reason: 'POST_NOT_FOUND'
           })
       }
   
       video.title !== title  &&  (video.title = title);
       video.cover !== cover  &&  (video.cover = cover);
       video.body !== body  &&  (video.body = body);
       video.address !== address  &&  (video.tags = address);
       video.isPublished = isPublished;
       if(cateId){
        const cateRepository = ctx.DBConnection.getRepository(VideoCategory);
        const cate = await cateRepository.findOne(cateId);
        video.cate = cate;
    }
       await videoRepository.save(video);
       ctx.rest({
        data: video,
         id: video.id,
        })
    }
}