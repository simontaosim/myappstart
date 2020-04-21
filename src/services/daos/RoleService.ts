import { Connection, Repository } from "typeorm";
import { Role } from "../../entity/Role";
import { getKey, putKey } from "../utils/cache";

export default class RoleService {
    private repository: Repository<Role>;
    constructor(connection:Connection){
        this.repository = connection.getRepository(Role);
    }

    getNobodyId = async () => {
        let nobodyId = await getKey("default_role_nobody");
        if(!nobodyId){
            const nobody = await  this.findOrCreateNobody();
            return nobody.id;
        }
        return nobodyId;
    }

    getAdminId = async () => {
        let adminId = await getKey("default_role_admin");
        if(!adminId){
            const admin = await this.findOrCreateAdmin();
            return admin.id;
        }
        return adminId;
    }
    
    findOrCreateNobody = async () => {
        let nobody = await this.repository.findOne({name: 'nobody', isDefault: true});
        if(!nobody){
            nobody = this.repository.create({
                name: 'nobody',
                isDefault: true,
            })
            await this.repository.save(nobody);
        }
        await putKey("default_role_nobody", nobody.id.toString());
        return nobody;
    }

    findOrCreateAdmin = async () => {
        let admin  =await this.repository.findOne({name: 'admin', isDefault: true});
        if(!admin){
            admin = this.repository.create({
                name: 'admin',
                isDefault: true,
            });
            await this.repository.save(admin);
        }
        return admin;

    }
    
    seed = async  () => {
      const nobody = await this.findOrCreateNobody();
      const admin = await this.findOrCreateAdmin();
      return {
          nobody, admin,
      }
    }

}