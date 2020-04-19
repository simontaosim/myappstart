import * as koa from 'koa';
import { httpPost, httpGet } from '../decorators/HttpRoutes';
import UserService from '../services/daos/UserService';
import AuthService from '../services/daos/AuthService';


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
            console.log({user});
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