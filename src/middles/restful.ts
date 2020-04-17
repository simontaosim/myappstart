import * as koa from 'koa';
export default async function (ctx: koa.Context, next: koa.Next ){
    ctx.rest = ctx.rest = (data:any) => {
        ctx.response.type = 'application/json';
        ctx.response.body = data;
    };
    try {
        await next();
    } catch (e) {
        // 返回错误:
        console.error(e);
        ctx.response.status = 400;
        ctx.response.type = 'application/json';
        ctx.response.body = {
            code: e.code || 'internal:unknown_error',
            message: e.message || '',
            error: e,
        };
    }
}