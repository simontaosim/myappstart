import * as koa from 'koa';
import { IACLParams } from './interfaces';
import PermissionService from '../services/daos/PermissionService';
import { User } from '../entity/User';
import { Post } from '../entity/Post';
import { Role } from '../entity/Role';
import { Permission } from '../entity/Permission';
import DefaultResourceService from '../services/daos/DefaultResourceService';
import { PostTag } from '../entity/PostTag';


export default async function (ctx: koa.Context, next: koa.Next ){
    if(ctx.acl){
        const ACLParams: IACLParams = ctx.acl;
        const resourceModel ={ 
            'users': User,
            "posts": Post,
            'roles': Role,
            'permissions': Permission,
            'tags': PostTag
        }
        console.log({
            ACLParams
        });
        //模块访问
        const permissionService = new PermissionService(ctx.DBConnection);
        //权限判断以单条记录的acl优先，接着才判断permissions;
        //acl通过，permissions无法阻止;
        //acl不通过，permission也无法通过;
        if(resourceModel[ACLParams.resource] && ACLParams.resourceId){
            //先判断单个条目权限
            const resposity = ctx.DBConnection.getRepository(resourceModel[ACLParams.resource]);
            const one = await resposity.findOne(ACLParams.resourceId);

            const defaultService = new DefaultResourceService(ctx.DBConnection);
            const defaultIds =  await defaultService.getDefaultResource(ACLParams.resource);

            if(
                defaultIds.includes(ACLParams.resourceId) 
                && ACLParams.method === 'remove'
                ){
                ctx.status = 403;
                return ctx.body = {
                    code: `${ACLParams.method}:fail`,
                    reason: 'default resources can not deleted'
                }
            }
        }

        const moduleAccess = await permissionService.isAccess(ACLParams);


        if(!moduleAccess){
            ctx.status = 403;
            ctx.body = {
                code: "resource no access"
            }
        }else{
            await next();
        }
      
    }else{
        await next();
    }
  
    
}