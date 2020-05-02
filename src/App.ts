import * as koa from 'koa';
import * as Router from 'koa-router';
import * as  koaBody from 'koa-body';
import * as gracefulShutdown from 'http-graceful-shutdown'
import * as cors from '@koa/cors';

import { registerController } from './decorators/HttpRoutes';
import RestController from './controllers/RestController';
import AuthController from './controllers/AuthController';
import { Connection } from 'typeorm';
import restful from './middles/restful';
import resourceAccess from './middles/resourceAccess';
import tokenParse from './middles/tokenParse';
import guard from './middles/guard';
import PermissionController from './controllers/PermissionController';
import RoleController from './controllers/RoleController';
import UploadController from './controllers/UploadController';
import UserController from './controllers/UserController';

@registerController(
    [
        UserController,
        UploadController,
        RoleController,
        PermissionController,
        AuthController, 
        RestController 
    ])//the later has less prioritites
export default class App{
    private server:koa<koa.DefaultState, koa.DefaultState>;
    public router: Router<any, {}>;
    constructor(){
        this.server = new koa();
    }
    start(connection: Connection){
        this.server.use(async (ctx: koa.Context, next: koa.Next) => {
            ctx.DBConnection = connection;
            await next();
        })
        this.server.use(cors({
            origin: '*',
            exposeHeaders: 'Content-Range'
        }));
        this.server.use(koaBody());
        this.server.use(tokenParse);
        this.server.use(resourceAccess);
        this.server.use(guard);
        this.server.use(restful);
        
        this.server.use(this.router.routes()).use(this.router.allowedMethods());
        
        this.server.listen(8080, ()=>{
            console.log('server start at', 8080);
        })
    }
    async stop(){
        //停止服務，用以測試
        function cleanup(): Promise<void> {
            return new Promise((resolve) => {
              console.log('... in cleanup')
              setTimeout(function() {
                  console.log('... cleanup finished');
                  resolve();
              }, 1000)       
            });
          }
        const shutdown = gracefulShutdown(this.server,  {
            signals: 'SIGINT SIGTERM',
            timeout: 30000,
            development: false,
            onShutdown: cleanup,
            finally: function() {
                console.log('Server gracefulls shutted down.....')
            }
        });
        try {
            await shutdown();
        } catch (e) {
            console.error(e);
        }
        
    }
}