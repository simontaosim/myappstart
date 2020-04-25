import { Connection, Repository } from "typeorm";
import { Role } from "../../entity/Role";
import { getKey, putKey } from "../utils/cache";
import DefaultResourceService from "./DefaultResourceService";

export default class RoleService {
    private repository: Repository<Role>;
    private  connection:Connection;
    constructor(connection:Connection){
        this.connection = connection;
        this.repository = connection.getRepository(Role);
    }

    getNobodyId = async () => {
        let nobodyId = await getKey("default_role_nobody");
        if(!nobodyId){
            const nobody = await  this.findOrCreateNobody();
            return nobody.id;
        }
        return parseInt(nobodyId);
    }

    getAdminId = async () => {
        let adminId = await getKey("default_role_admin");
        if(!adminId){
            const admin = await this.findOrCreateAdmin();
            return admin.id;
        }
        return parseInt(adminId);
    }

    getRegisterId = async () => {
        let registerId = await getKey("default_role_register");
        if(!registerId){
            const register = await this.findOrCreateRegister();
            return register.id;
        }
        return parseInt(registerId);
    }
    
    findOrCreateNobody = async () => {
        let nobody = await this.repository.findOne({name: 'nobody', isDefault: true});
        if(!nobody){
            nobody = this.repository.create({
                name: 'nobody',
                name_zh: "匿名用户",
                isDefault: true,
            })
            await this.repository.save(nobody);
            const defaultResourceService = new DefaultResourceService(this.connection);
            await defaultResourceService.create("roles", nobody.id);
        }
        await putKey("default_role_nobody", nobody.id.toString());
        
        return nobody;
    }

    findOrCreateAdmin = async () => {
        let admin  =await this.repository.findOne({name: 'admin', isDefault: true});
        if(!admin){
            admin = this.repository.create({
                name: 'admin',
                name_zh: '超管',
                isDefault: true,
            });
            await this.repository.save(admin);
            const defaultResourceService = new DefaultResourceService(this.connection);
            await defaultResourceService.create("roles", admin.id);
        }
        return admin;

    }

    findOrCreateRegister = async () => {
        let register = await this.repository.findOne({name: 'register', isDefault: true});
        if(!register){
            register = this.repository.create({
                name: "register",
                name_zh: '已注册用户',
                isDefault: true,
            })
            await this.repository.save(register);
            const defaultResourceService = new DefaultResourceService(this.connection);
            await defaultResourceService.create("roles", register.id);
        }
        return register;

    }
    
    seed = async  () => {
      const nobody = await this.findOrCreateNobody();
      const admin = await this.findOrCreateAdmin();
      return {
          nobody, admin,
      }
    }

}