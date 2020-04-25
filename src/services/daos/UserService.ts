import { Connection, Repository } from "typeorm";
import { User } from "../../entity/User";
import RoleService from "./RoleService";

import  * as bcrypt from 'bcrypt';
import { getKey, putKey } from "../utils/cache";
import DefaultResourceService from "./DefaultResourceService";


interface IUserParams {
    username: string;
    password: string;
    mobile?: string;
    email?: string;
    isDefault?: boolean,
}


const SUPERADMIN = {
    username: 'superAdmin',
    password: '123666',
}

export default class UserService {
    private repository: Repository<User>;
    private connection: Connection;
    constructor(connection:Connection){
        this.connection = connection;
        this.repository = connection.getRepository(User);
    }

    registerUser = async (userParams: IUserParams) => {
        const salt = bcrypt.genSaltSync(Math.random());
        const hash = bcrypt.hashSync(userParams.password, salt);
        userParams = {
            ...userParams,
            password: hash,
        }
        const user:User =  this.repository.create({
            ...userParams,
        });
     
        await this.repository.save(user);
        user.acl = {
            write: {
                roles: [],
                users: [user.id]
            },
            read: {
                roles: [],
                users: [user.id]
            }
        }
        await this.repository.save(user);
        return user;
    }

    getRoles = async (userId: number) => {
        const user = await  this.repository.findOne({
            where: {
                id: userId,
            },
            relations: ['roles']
        })
        return user.roles;

    }

    findOrCreateAdmin = async () => {
        let admin = await this.repository.findOne({
            username: SUPERADMIN.username,
            isDefault: true,
        })
        if(!admin){
            admin =  await this.registerUser({
                ...SUPERADMIN,
                isDefault: true,
            });
            const roleService = new RoleService(this.connection);
            const adminRole = await roleService.findOrCreateAdmin()
          
            if(!admin.roles){
                admin.roles = [adminRole];
            }else if(admin.roles && !admin.roles.includes(adminRole)){
                admin.roles.push(adminRole);
            }
            await this.repository.save(admin);
            const defaultResourceService = new DefaultResourceService(this.connection);
            await defaultResourceService.create("users", admin.id);
            
        }
        return admin;
    }
    findByUsername = async (username:string) => {
        const user = await  this.repository.findOne({username})
        return user
    }
    findById = async (id:number) => {
        const user = await this.repository.findOne({
            where: {id},
            relations: ["roles"]
        });
        return user;
    }

    getRoleIds = async (id:number): Promise<number[]> => {
        const roleIdsString = await getKey(`get_roleids_by_userId_${id.toString()}`);
        let roleIds = [];
        if(roleIdsString){
            roleIds = JSON.parse(roleIdsString);
            return roleIds;
        }
        const user = await this.repository.findOne({
            where: {id},
            relations: ["roles"]
        });
        roleIds = [];
        for (let index = 0; index < user.roles.length; index++) {
            const role = user.roles[index];
            roleIds.push(role.id);
        }
        await putKey(`get_roleids_by_userId_${id.toString()}`, JSON.stringify(roleIds))
        return roleIds;
    }

}