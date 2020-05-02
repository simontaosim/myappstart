import * as koa from 'koa';
import { httpPut } from '../decorators/HttpRoutes';

import { Role } from '../entity/Role';
import { In } from 'typeorm';
import { User } from '../entity/User';

export default class UserController{


    @httpPut('/users/:id')
    async update(ctx: koa.Context){
        const {id } = ctx.params;
        try {
            let  updateParams  = ctx.request.body; 

            const { roleIds } = updateParams;
            const roleRepository =  ctx.DBConnection.getRepository(Role);
            const roles = await roleRepository.find({
                id: In(roleIds),
            })
            const userRepository = ctx.DBConnection.getRepository(User);
            const user = await userRepository.findOne(id);
            console.log("检查要更新的用户", user);

            user.username = updateParams.username;
            user.roles = roles;
            
            await  userRepository.save(user);
            console.log('更新了user');
            
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