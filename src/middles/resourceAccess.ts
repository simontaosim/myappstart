import * as koa from 'koa';
import RoleService from '../services/daos/RoleService';
interface IPermissionParams {
    roleIds: Array<number>;
    resource: string;
    method: "post" | "get" | "remove" | "put" | "unknown"
}
interface IACLParams  {
    roleIds: Array<number>,
    resourceId: number,    
    userId: number,
}

export default async function resourceAccess(ctx: koa.Context, next: koa.Next) {
    const elements = ctx.path.split('/')
    const method = ctx.request.method;
    const resource = elements[1];
    const resourceId:number = parseInt(elements[2]);
    let roleIds:Array<number> = [];
    const roleService = new RoleService(ctx.DBConnection);
    const nobody = await roleService.findOrCreateNobody();
    roleIds.push(nobody.id);
    if(Array.isArray(ctx.roleIds)){
        roleIds = roleIds.concat(ctx.roleIds);
    }
    const permissionParams: IPermissionParams = {
        roleIds,
        resource,
        method: 'unknown'
    }
    const ACLParams: IACLParams = {
        roleIds,
        resourceId,
        userId: ctx.userId,
    }
    ctx.acl = ACLParams;

    switch (method) {
        case "POST":
            permissionParams.method = 'post';
            break;
        case "PUT":
            permissionParams.method = 'put';
            break;
        case "DELETE":
            permissionParams.method = 'remove';
            break;
        case "GET":
            permissionParams.method = 'get';
            break;
        default:
            ctx.status = 406;
            return;
    }
    
    await next();
}