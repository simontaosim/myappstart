import * as koa from 'koa';
import { httpPut, httpPost, httpGet } from '../decorators/HttpRoutes';
import * as bcrypt from 'bcrypt';
import { Role } from '../entity/Role';
import { In } from 'typeorm';
import { User } from '../entity/User';

export default class UserController {
    @httpGet('/users')
    async list(ctx: koa.Context) {
        const { resource } = ctx.params;
        let { filter, range, sort } = ctx.query;
        const repository = ctx.DBConnection.getRepository(User);

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
           let queryString = `user.username != :username ${filter.q? ' and user.username like :q' : ''}`;
            const condition:any = { };
            condition.username = "superAdmin";
            const listSelect = [
                "user.id",
                "user.username",
                "user.createdDate",
                "user.updatedDate",
                "user.acl"
            ]
            if(filter.q){
                condition.q =  `%${filter.q}%`
            }
            let listRecords = [];
            if(filter.roleIds){
                listRecords = await repository.createQueryBuilder('user')
                .leftJoin("user.roles","role")
                .where(queryString, 
                    condition)
                .andWhere("user_role.roleId IN (:...roleIds)", {roleIds:  filter.roleIds})
                .select(listSelect)
                .skip(range[0])
                .take(range[1] - range[0])
                .orderBy(`user.${sort[0]}`, sort[1])
                .getMany();
            }else{
                listRecords = await repository.createQueryBuilder('user')
                .where(queryString, 
                    condition)
                .select(listSelect)
                .skip(range[0])
                .take(range[1] - range[0])
                .orderBy(`user.${sort[0]}`, sort[1])
                .getMany();
            }
            ctx.rest(listRecords);
            let count:any = null;
            if(filter.roleIds){
                count = await repository.createQueryBuilder('user')
                .leftJoin("user.roles","role")
                .where(queryString, 
                    condition)
                .andWhere("user_role.roleId IN (:...roleIds)", {roleIds:  filter.roleIds})
                .select('COUNT(*)').getRawOne();
                const head = {
                    'Content-Range': `${resource} ${range[0]}-${range[1]}/${count.count}`,
                };
                ctx.res.writeHead(200, head);
            }else{
                count = await repository.createQueryBuilder('user')
                .where(queryString, 
                    condition)
                .select('COUNT(*)').getRawOne();
                const head = {
                    'Content-Range': `${resource} ${range[0]}-${range[1]}/${count.count}`,
                };
                ctx.res.writeHead(200, head);
            }
          
        } catch (e) {
            ctx.status = 400;
            throw e;
        }


    }

    @httpPost("/users")
    async create(ctx: koa.Context) {
        const createParams = (ctx.request as any).body;
        const { roleIds, username, password, passwordRepeat } = createParams;
    
        if (!password || password !== passwordRepeat) {
            ctx.status = 202;
            return ctx.rest({
                code: "users:create:fail",
                reason: "PASSWORD_REPEAT_WRONG"
            })
        }
        const userRepository = ctx.DBConnection.getRepository(User);
        let user = await userRepository.findOne({username})
        if(user){
            ctx.status = 400;
            ctx.res.statusMessage = "USERNAME_ALREADY_EXIST";
            return ctx.rest({
                code: "users:create:fail",
                reason: "PASSWORD_REPEAT_WRONG"
            })
        }
        const salt = bcrypt.genSaltSync(Math.random());
        const hash = bcrypt.hashSync(password, salt);
        user = userRepository.create({
            username,
            password: hash,
        });
        const roleRepository = ctx.DBConnection.getRepository(Role);
        const roles = roleIds? await roleRepository.find({
            id: In(roleIds),
        }): [];
      
        user.roles = roles;
       
        try {
            
            await userRepository.save(user);
            return ctx.rest({
                data: {
                    ...user,
                },
                id: user.id,
            })
        } catch (e) {
            console.error(e.detail);
            ctx.status = 400;
            if(e.detail.includes("already exists")){
                ctx.res.statusMessage = 'USERNAME_ALREADY_EXIST';
            }
            
            return ctx.body = e.detail;
            
        }

     
    }


    @httpPut('/users/:id')
    async update(ctx: koa.Context) {
        const { id } = ctx.params;
        const updateParams =( ctx.request as any).body;
        const { password, passwordRepeat } = updateParams;
      
        if (password  && (password !== passwordRepeat)) {
            ctx.status = 400;
            ctx.res.statusMessage = "PASSWORD_REPEAT_WRONG";
            return ctx.rest({
                code: "users:update:fail",
                reason: "PASSWORD_REPEAT_WRONG"
            })
        }
        try {
            const { roleIds } = updateParams;
            const roleRepository = ctx.DBConnection.getRepository(Role);
            const roles = await roleRepository.find({
                id: In(roleIds),
            })
            const userRepository = ctx.DBConnection.getRepository(User);
            const user = await userRepository.findOne(id);
            if (user.isDefault) {
                return ctx.rest({
                    id: id,
                    data: {
                        ...updateParams,
                        id,
                    },
                    code: "roles:update:success"
                })
            }

            user.username = updateParams.username;
            user.roles = roles;
            if (password) {
                const salt = bcrypt.genSaltSync(Math.random());
                const hash = bcrypt.hashSync(password, salt);
                user.password = hash;
            }
            await userRepository.save(user);
            console.log("已经更新的用户User", user);

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


}