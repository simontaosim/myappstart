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
import UserController from './controllers/UserController';
import FileController from './controllers/FileController';
import PostTagController from './controllers/PostTagController';
import PostController from './controllers/PostController';
import BinanceController from './controllers/BinanceController';
import { Socket } from 'socket.io';
import * as http from 'http';
import UserService from './services/daos/UserService';
import RoleService from './services/daos/RoleService';
import BinanceService from './services/partners/BinanceService';

@registerController(
    [
        PostController,
        BinanceController,
        FileController,
        PostTagController,
        UserController,
        RoleController,
        PermissionController,
        AuthController,
        RestController
    ])//the later has less prioritites
export default class App {
    private server: koa<koa.DefaultState, koa.DefaultState>;
    public router: Router<any, {}>;
    private io: Socket;
    constructor() {
        this.server = new koa();
        
    }
    async start(connection: Connection) {
        // socket连接
       
        this.server.use(async (ctx: koa.Context, next: koa.Next) => {
            ctx.DBConnection = connection;
            await next();
        })
        this.server.use(cors({
            origin: '*',
            exposeHeaders: 'Content-Range'
        }));
        this.server.use(koaBody({
            multipart: true,
            formidable: {
                maxFileSize: 10 * 1024 * 1024 * 1024,   // 设置上传文件大小最大限制，默认2M,
                uploadDir: 'upload/',
            }
        }));
        this.server.use(tokenParse);
        this.server.use(resourceAccess);
        this.server.use(guard);
        this.server.use(restful);

        this.server.use(this.router.routes()).use(this.router.allowedMethods());
        const server = http.createServer(this.server.callback());
        this.io = require('socket.io')(server);
        this.server.use(async (ctx: koa.Context, next: koa.Next) => {
            ctx.io = this.io;
            await next();
        })
        const binanceService = new BinanceService(connection, this.io);
        await binanceService.storePirces(this.io);
        await binanceService.staticPrices(this.io);
        //seed;
        const roleService = new RoleService(connection);
        await roleService.findOrCreateNobody();
        await roleService.findOrCreateAdmin();
        await roleService.findOrCreateRegister();
        const userService = new UserService(connection);
        await userService.findOrCreateAdmin();
        
        server.listen(9987, () => {
            console.log('server start at', 9987);
        })
    }
    async stop() {
        //停止服務，用以測試
        function cleanup(): Promise<void> {
            return new Promise((resolve) => {
                console.log('... in cleanup')
                setTimeout(function () {
                    console.log('... cleanup finished');
                    resolve();
                }, 1000)
            });
        }
        const shutdown = gracefulShutdown(this.server, {
            signals: 'SIGINT SIGTERM',
            timeout: 30000,
            development: false,
            onShutdown: cleanup,
            finally: function () {
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