import * as koa from 'koa';
import { httpPost, httpGet } from '../decorators/HttpRoutes';
import UserService from '../services/daos/UserService';
import AuthService from '../services/daos/AuthService';
import { Permission } from '../entity/Permission';
import RoleService from '../services/daos/RoleService';


export default class AuthController{
    @httpPost('/login')
   async  login(ctx: koa.Context){
        const userService = new UserService(ctx.DBConnection);
        const   body  = ctx.request.body; 
        const user = await userService.findByUsername(body.username);
        if(!user){
            return ctx.rest({
                code: "auth:fail:notfound",
                reason: "user is not exist"
            })
        }
        const authService = new AuthService(user);
        const authed = authService.checkPassword(body.password);
        if(authed){
            ctx.rest({
                token: await authService.createToken(12),
                userId: user.id,
                code: "user:login.success"
            })
        }else{
            ctx.status = 401;
            ctx.rest({
                code: "auth:fail:password",
                reason: "password"
            })
        }
    }

    @httpGet('/check')
    async check(ctx: koa.Context){
        if(ctx.userId){
            const userService = new UserService(ctx.DBConnection);
            const user = await userService.findById(ctx.userId);
        
            if(user){
                return ctx.rest({
                    isLogined: true
                })
            }
        }
        return ctx.rest({
            isLogined: false,
        })
    }

    @httpGet('/get_permissions')
    async getPermissions(ctx: koa.Context){
        const roleService = new RoleService (ctx.DBConnection)
        const adminId = await roleService.getAdminId();
        if(ctx.userId){
            const userService = new UserService(ctx.DBConnection);
            const user = await userService.findById(ctx.userId);
            let permissions = [];
            const roles = user.roles;
            for (let index = 0; index < roles.length; index++) {
                const role = roles[index];
                const permissionRepository = ctx.DBConnection.getRepository(Permission);
                const permissionsAdd = await permissionRepository.find({
                    roleId: role.id
                })
                 permissions =permissions.concat(permissionsAdd);
                 if(adminId === role.id){
                     console.log("超级管理");
                     permissions.push('superAdmin')
                 }
            }
            const permissionNames = [];
            for (let index = 0; index < permissions.length; index++) {
                const permission = permissions[index];
                
                console.log("每个角色", permission);
                
                if(permission !== 'superAdmin'){
                    if(permission.post){
                        permissionNames.push(`post_${permission.resource}`);
                    }
                    if(permission.put){
                        permissionNames.push(`put_${permission.resource}`);
                    }
                    if(permission.remove){
                        permissionNames.push(`remove_${permission.resource}`);
                    }
                    if(permission.get){
                        permissionNames.push(`get_${permission.resource}`);
                    }
                }else{
                    permissionNames.push(permission);
                }
                
            }

            permissionNames.push('nobody');
            permissionNames.push('register');
            console.log({permissionNames});


            if(user){
                return ctx.rest({
                    isLogined: true,
                    permissions: permissionNames
                })
            }
        }
        return ctx.rest({
            isLogined: false,
        })
    }

    @httpPost('/register')
    async register(ctx: koa.Context){
        const userService = new UserService(ctx.DBConnection);
        const   body  = ctx.request.body; 
        const userExist = await userService.findByUsername(body.username);
        if(userExist){
            ctx.status = 203;
            return ctx.rest({
                code: "user:register:fail",
                reason: 'username exist'
            })
        }
        const user  = await userService.registerUser(body);
        const authService = new AuthService(user);
        const token = await authService.createToken(3);
        // 3 hours for new user logined
        ctx.rest({
            userId: user.id,
            token,
            code: 'user:register.success',
        })
    }
}