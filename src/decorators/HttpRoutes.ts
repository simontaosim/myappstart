import * as Router from 'koa-router';
const router = new Router();
const allRouterInfo = {}
export function registerController(_Controllers: Array<any>) {
    return function <T extends {new(...args:any[]):{}}>(constructor:T) {
        for (let index = 0; index < _Controllers.length; index++) {
            const name = _Controllers[index].name;
            const stack = allRouterInfo[name];
            for (let j = 0; j < stack.length; j++) {
                const route = stack[j];
                router[route.method](route.url, route.handler);
            }
        }
        constructor.prototype.router  = router;
    };
}

function httpMehod(url:string, method:string) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        let stack = allRouterInfo[target.constructor.name];
        if(!stack){
            stack = [{ method, url, handler: target[propertyKey] }];
        }else{
            stack.push({ method, url, handler: target[propertyKey] })
        }
        allRouterInfo[target.constructor.name] = stack;
    };
}

export function httpGet(url:string) {
    return httpMehod(url, "get");
}

export function httpPost(url: string){
    return httpMehod(url, 'post');
}

export function httpPatch(url: string){
    return httpMehod(url, "patch");
}

export function httpDelete(url: string){
    return httpMehod(url, 'delete');
}

export function httpPut(url: string){
    return httpMehod(url, 'put')
}