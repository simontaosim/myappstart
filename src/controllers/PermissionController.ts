import * as koa from 'koa';
import { httpPost } from '../decorators/HttpRoutes';

import RestService from '../services/daos/RestService';
import { Permission } from '../entity/Permission';

export default class PermissionController{


    @httpPost('/permissions')
    async create(ctx: koa.Context){
        
        try {
            let  createParams  = (ctx.request as any).body; 
            const restService = new RestService("permissions", ctx.DBConnection);
            const repository = ctx.DBConnection.getRepository(Permission);
            let data = await repository.findOne({
                roleId: createParams.roleId,
                resource: createParams.resource? createParams.resource: "users",
            });
            
            if(data){
                await restService.update(data.id, {
                    ...createParams,
                    resource: createParams.resource? createParams.resource: 'users',
                    get: createParams.get ||  false,
                    put: createParams.put || false,
                    post: createParams.post || false,
                    grant: createParams.grant || false,
                    remove: createParams.remove || false,
                });
            }else{
                data =  await restService.create({
                    ...createParams,
                    resource: createParams.resource? createParams.resource: 'users',
                    get: createParams.get ||  false,
                    put: createParams.put || false,
                    post: createParams.post || false,
                    grant: createParams.grant || false,
                    remove: createParams.remove || false,
                })
            }
            ctx.rest({
                id: data.id,
                data: data,
                code: "permissions:create:success"
            })
        } catch (e) {
            throw e;
        }
       
    }

    
}