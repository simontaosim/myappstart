import * as koa from 'koa';

import {  httpPost, httpPut } from "../decorators/HttpRoutes";
import * as striptags from 'striptags';
import * as removeEmptyLines from 'remove-blank-lines';
import { Post } from '../entity/Post';
import { PostTag } from '../entity/PostTag';
import { In } from 'typeorm';

function checkPostParams(ctx: koa.Context){

    const  params = (ctx.request  as any).body;
    const { title, body, tagIds, cover } = params;
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
        if(text.trim().length <=50){
         ctx.status = 400;
         ctx.res.statusMessage = "BODY_REQUIRE_MORE_THAN_50";
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

export default class PostController {
    @httpPost("/posts")
    async create(ctx: koa.Context){
       const  createParams = (ctx.request  as any).body;
       const { title, body, tagIds, cover } = createParams;
       const checkPass = checkPostParams(ctx);
       if(checkPass.status!=='pass'){
           return ctx.rest({
               code: 'post:create:fail',
               reason: checkPass.reason
           })
       }
       const postRepository = ctx.DBConnection.getRepository(Post);
       const post = postRepository.create({
           title,
           body,
           cover,
           authorId: ctx.userId,
       })
       const  tagRepository = ctx.DBConnection.getRepository(PostTag);
       const tags = await tagRepository.find({
           where: {
               id: In(tagIds),
           }
       })
       post.tags = tags;
       await postRepository.save(post);
       ctx.rest({
           data: post,
            id: post.id,
       })
       
    }

    @httpPut("/posts/:id")
    async update(ctx: koa.Context){
        const { id } = ctx.params;
        const  updateParams = (ctx.request  as any).body;
       const { title, body, tagIds, cover } = updateParams;
       const checkPass = checkPostParams(ctx);
       if(checkPass.status!=='pass'){
           return ctx.rest({
               code: 'post:update:fail',
               reason: checkPass.reason
           })
       }
       const postRepository = ctx.DBConnection.getRepository(Post);
       let post = await postRepository.findOne(id);
       if(!post){
           ctx.status = 404;
           ctx.res.statusMessage = "POST_NOT_FOUND";
           return ctx.rest({
               code: 'post:update:fail',
               reason: 'POST_NOT_FOUND'
           })
       }
       const  tagRepository = ctx.DBConnection.getRepository(PostTag);
       const tags = await tagRepository.find({
           where: {
               id: In(tagIds),
           }
       })
       post.title !== title  &&  (post.title = title);
       post.cover !== cover  &&  (post.cover = cover);
       post.body !== body  &&  (post.body = body);
       post.tags !== tags  &&  (post.tags = tags);
       await postRepository.save(post);
       ctx.rest({
        data: post,
         id: post.id,
        })
    }
}