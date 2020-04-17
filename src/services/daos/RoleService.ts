import { Connection, Repository } from "typeorm";
import { Role } from "../../entity/Role";

export default class RoleService {
    private repository: Repository<Role>;
    constructor(connection:Connection){
        this.repository = connection.getRepository(Role);
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