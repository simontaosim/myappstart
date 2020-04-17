import * as koa from 'koa';
import * as jwt from 'jsonwebtoken';
import { getJWTSecret } from '../services/utils/cache';

export default async function tokenParse(ctx: koa.Context, next: koa.Next){
    const authorization = ctx.header.authorization;
    if(authorization){
        const token = authorization.split(' ')[1];
        try {
            const secret = await getJWTSecret();
            const decoded: any = jwt.verify(token, secret);
            ctx.userId = decoded.data.userId;
            await next();
        } catch (e) {
            console.error('token parse fail', e);
            await next();
        }   
        
    }else{
        await next();

    }
}