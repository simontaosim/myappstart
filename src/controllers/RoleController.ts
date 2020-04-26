import * as koa from 'koa';
import { httpPut } from '../decorators/HttpRoutes';

import RestService from '../services/daos/RestService';

export default class RoleController{


    @httpPut('/roles/:id')
    async create(ctx: koa.Context){
        const {id } = ctx.params;
        try {
            let  updateParams  = ctx.request.body; 
            const restService = new RestService("roles", ctx.DBConnection);
            
            await restService.update(id, {
                name: updateParams.name? updateParams.name: updateParams.name_zh,
                name_zh: updateParams.name_zh,
                id: id,
            });
            ctx.rest({
                id: id,
                data: {
                    ...updateParams,
                    id,
                },
                code: "roles:update:success"
            })
        } catch (e) {
            throw e;
        }
       
    }

    
}