import { Connection, Repository } from "typeorm";
import { User } from "../../entity/User";
import RoleService from "./RoleService";

import  * as bcrypt from 'bcrypt';


interface IUserParams {
    username: string;
    password: string;
    mobile?: string;
    email?: string;
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
        const admin:User =  this.repository.create({
            ...userParams,
        });
        await this.repository.save(admin);
        return admin;
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
        })
        if(!admin){
            admin =  await this.registerUser(SUPERADMIN);
            const roleService = new RoleService(this.connection);
            const adminRole = await roleService.findOrCreateAdmin()
          
            if(!admin.roles){
                admin.roles = [adminRole];
            }else if(admin.roles && !admin.roles.includes(adminRole)){
                admin.roles.push(adminRole);
            }

            await this.repository.save(admin);
        }
        return admin;
    }
    findByUsername = async (username:string) => {
        const user = await  this.repository.findOne({username})
        return user
    }
    findById = async (id:number) => {
        const user = await this.repository.findOne(id);
        return user;
    }

}