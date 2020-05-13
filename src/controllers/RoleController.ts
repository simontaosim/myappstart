import * as koa from 'koa';
import { httpPut, httpGet, httpPost } from '../decorators/HttpRoutes';

import RestService from '../services/daos/RestService';
import { Role } from '../entity/Role';
import { In, Like, Not } from 'typeorm';

export default class RoleController{
    @httpGet('/roles')
    async list(ctx: koa.Context) {
        const { resource } = ctx.params;
        let { filter, range, sort } = ctx.query;
        const repository = ctx.DBConnection.getRepository(Role);

        filter = filter ? JSON.parse(filter) : {};
        if (filter.id) {
            const list = await repository.find({
                where: {
                    id: In(filter.id),
                }
            })
            return ctx.rest(list);
        }

        range = range ? JSON.parse(range) : [0, 10];
        sort = sort ? JSON.parse(sort) : ["id", 'desc'];

        try {
            const conditions = [];
            const searchSelect = ['name','name_zh']
            if (filter.q) {
                for (let index = 0; index < searchSelect.length; index++) {
                    const condition: object = {};
                    const field = searchSelect[index];
                    condition[field] = Like(`%${filter.q}%`);
                    conditions.push(condition);
                }
            }
            else {
                conditions.push({ ...filter,   name: Not( "admin") })
            }
            const list = await repository.find({
                where: conditions,
                select: ['id', 'name','name_zh', 'createdDate', 'updatedDate', 'acl'],
                skip: range[0],
                take: range[1] - range[0],
                order: {
                    [`${sort[0]}`]:sort[1]
                }
            });
          
            ctx.rest(list);
            const count = await repository.count({
                where: conditions
            })
            const head = {
                'Content-Range': `${resource} ${range[0]}-${range[1]}/${count}`,
            };
            ctx.res.writeHead(200, head);
        } catch (e) {
            ctx.status = 400;
            throw e;
        }


    }

    @httpPut('/roles/:id')
    async update(ctx: koa.Context){
        const {id } = ctx.params;
        try {
            let  updateParams  = (ctx.request as any).body; 
            const restService = new RestService("roles", ctx.DBConnection);
            
            await restService.update(id, {
                name: updateParams.name? updateParams.name: updateParams.name_zh,
                name_zh: updateParams.name_zh,
                id: id,
            });
            ctx.rest({
                id: id,
                data: {
                    ...updateParams,
                    id,
                },
                code: "roles:update:success"
            })
        } catch (e) {
            throw e;
        }
       
    }

    @httpPost("/roles")
    async create(ctx: koa.Context){
        const { name, name_zh } = (ctx.request as any).body;
        const repository = ctx.DBConnection.getRepository(Role);
        const roleFind = await repository.findOne({
            where: {
                name: name? name: name_zh,
                name_zh: name_zh? name_zh : name
            }
        })
        if(roleFind){
            ctx.status = 400;
            ctx.res.statusMessage = "ROLE_ALREADY_EXIST";
            return ctx.rest({
                code: "users:create:fail",
                reason: "PASSWORD_REPEAT_WRONG"
            })
        }
        try {
            
            const instance =  repository.create({
                name: name? name: name_zh,
                name_zh: name_zh? name_zh : name
            })
            const createRlt: any = await repository.save(instance);
            return ctx.rest({
                id: createRlt.id,
                data: createRlt,
                code: "resource:create:success"
            })
        } catch (e) {
            throw e;
        }
    }

    
}