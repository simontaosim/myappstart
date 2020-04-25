import * as koa from 'koa';
import * as jwt from 'jsonwebtoken';
import { getJWTSecret } from '../services/utils/cache';
import RoleService from '../services/daos/RoleService';
import UserService from '../services/daos/UserService';

export default async function tokenParse(ctx: koa.Context, next: koa.Next){
    const authorization = ctx.header.authorization;
    if(authorization){
        const token = authorization.split(' ')[1];
        try {
            const secret = await getJWTSecret();
            const decoded: any = jwt.verify(token, secret);
            const userId = decoded.data.userId;
            ctx.userId = userId;
            const userService = new UserService(ctx.DBConnection);
            const user_roleIds = await userService.getRoleIds(userId);
            const roleService = new RoleService(ctx.DBConnection);
            let roleIds = ctx.roleIds;
            if(!roleIds){
                roleIds = [];
            }
            roleIds = roleIds.concat(user_roleIds);
            const registerId = await roleService.getRegisterId();
            roleIds.push(registerId);
            ctx.roleIds = roleIds;
            await next();
        } catch (e) {
            console.error('token parse fail', e);
            await next();
        }   
        
    }else{
        await next();

    }
}