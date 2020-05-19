import * as koa from 'koa';
import RoleService from '../services/daos/RoleService';
import { IACLParams } from './interfaces';
import { RESOURCES } from '../constants';


export default async function resourceAccess(ctx: koa.Context, next: koa.Next) {
    console.log("access", ctx.path);
    
    if(ctx.path.includes('socket.io')){
        return await next();
    }
    const elements = ctx.path.split('/')
    const method = ctx.request.method;
    const resource = elements[1];
    if (RESOURCES.includes(resource)) {
        const resourceId: number = parseInt(elements[2]);
        let roleIds: Array<number> = [];
        const roleService = new RoleService(ctx.DBConnection);
        const nobodyId = await roleService.getNobodyId();
        roleIds.push(nobodyId);
        if (Array.isArray(ctx.roleIds)) {
            roleIds = roleIds.concat(ctx.roleIds);
        }
        const ACLParams: IACLParams = {
            roleIds,
            resourceId,
            userId: ctx.userId,
            resource,
            method: 'unknown',
        }

        switch (method) {
            case "POST":
                ACLParams.method = 'post';
                break;
            case "PUT":
                ACLParams.method = 'put';
                break;
            case "DELETE":
                ACLParams.method = 'remove';
                break;
            case "GET":
                ACLParams.method = 'get';
                break;
            default:
                ctx.status = 406;
                return;
        }
        ctx.acl = ACLParams;
        await next();
    }else{
        await next();
    }

}