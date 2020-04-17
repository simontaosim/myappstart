import * as koa from 'koa';

import { httpGet, httpPost, httpPut, httpDelete } from '../decorators/HttpRoutes';
import RestService from '../services/daos/RestService';

export default class RestController{
    @httpGet('/:resource')
    async list (ctx: koa.Context) {
        const { resource  } = ctx.params;
        let {filter, range, sort} = ctx.query;
      
         filter = filter? JSON.parse(filter) : {};
        if(filter.id){
            const restService = new RestService(resource, ctx.DBConnection);
            const list = await restService.listIds(filter.id);
            return ctx.rest(list);
        }

         range = range? JSON.parse(range): [0, 10];
         sort = sort? JSON.parse(sort): ["id",  'desc'];

        try {
            const restService = new RestService(resource, ctx.DBConnection);
            const list = await restService.list({
            skip: range[0],
            take: range[1] - range[0],
            sort:{
                [`${sort[0]}`]:sort[1]
            }, filter
            })
            ctx.rest(list);
            const count = await restService.count({})
            const head = {
                'Content-Range': `${resource} ${range[0]}-${range[1]}/${count}`,
            };
            ctx.res.writeHead(200, head);
        } catch (e) {
            ctx.status= 400;
            throw e;
        }
      
      
    }

    @httpPost('/:resource')
    async create(ctx: koa.Context){
        try {
            const { resource } = ctx.params;
            let  createParams  = ctx.request.body; 
            const restService = new RestService(resource, ctx.DBConnection);
            const data =  await restService.create(createParams)
            ctx.rest({
                id: data.id,
                data: data,
                code: "resource:create:success"
            })
        } catch (e) {
            throw e;
        }
       
    }

    @httpGet("/:resource/:id")
    async getOne(ctx: koa.Context){
        try {
            const { resource, id } = ctx.params;
            const restService = new RestService(resource, ctx.DBConnection);
            const data = await restService.one(id);
            ctx.rest(data);
        
        } catch (e) {
            throw e;
        }
    }

    @httpPut('/:resource/:id')
    async updateOne(ctx: koa.Context){
        try {
            const { resource, id } = ctx.params;
            const restService = new RestService(resource, ctx.DBConnection);
            const data = await restService.update(id, ctx.request.body);
            ctx.rest({
                data,
            })
        } catch (e) {
            throw e;
        }
    }

    @httpDelete("/:resource/:id")
    async deleteOne(ctx: koa.Context){
        const { resource, id } = ctx.params;
        const restService = new RestService(resource, ctx.DBConnection);
        try {
            const deleteRlt = await restService.remove(id);
            ctx.rest({
                data: {
                    id,
                    ...deleteRlt
                }
            });
            ctx.status= 200;
        } catch (e) {
            ctx.status= 400;
            console.error(e.message);
            ctx.rest(e.message);
            
        }
    }
    
}