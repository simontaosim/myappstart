import * as koa from 'koa';

import { httpGet, httpPost, httpPut, httpDelete } from '../decorators/HttpRoutes';
import RestService from '../services/daos/RestService';
import DefaultResourceService from '../services/daos/DefaultResourceService';

export default class RestController{

    @httpDelete('/:resource')
    async removeMany(ctx: koa.Context){
        const { resource } = ctx.params;
        let {filter, range, sort} = ctx.query;
        filter = filter? JSON.parse(filter) : {};
       if(filter.id){
           const restService = new RestService(resource, ctx.DBConnection);
           const defaultResourceService = new DefaultResourceService(ctx.DBConnection);
           const defaultIds = await defaultResourceService.getDefaultResource(resource);
           for (let index = 0; index < defaultIds.length; index++) {
               const defaultId = defaultIds[index];
               if(filter.id.includes(defaultId)){
                   ctx.status = 403;
                   return ctx.body = {
                       code: `delete:fail`,
                       reason: 'default resources can not deleted'
                   };
                //    break;
               }
           }
           await restService.removeMany(filter.id);
           return ctx.rest({
               data: {
                   id: filter.id,
               }
           });
       }else{
           return ctx.rest({
               data: {
                   ids: [],
               }
           })
       }
    }

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
            let  createParams  = (ctx.request as any).body; 
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
            if(!data){
                ctx.status = 404;
                ctx.rest({
                    code: "not found"
                });
            }else{
                ctx.rest(data);
            }
        
        } catch (e) {
            throw e;
        }
    }

    @httpPut('/:resource/:id')
    async updateOne(ctx: koa.Context){
        try {
            const { resource, id } = ctx.params;
            const restService = new RestService(resource, ctx.DBConnection);
            const data = await restService.update(id, (ctx.request as any).body);
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