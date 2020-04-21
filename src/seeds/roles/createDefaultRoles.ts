import { Factory, Seeder } from 'typeorm-seeding'
import { Connection } from 'typeorm';
import RoleService from '../../services/daos/RoleService';
import { getKey, putKey } from '../../services/utils/cache';
 
export default class CreateDefaultRoles implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    console.log("正在建立默认角色");
   const roleRepository = new RoleService(connection);
   const { nobody, admin } = await roleRepository.seed();

   try {
    let nobodyCacheId = await getKey("default_role_nobody");
    if(!nobodyCacheId){
      nobodyCacheId = await putKey("default_role_nobody", nobody.id.toString());
    }

    let adminCacheId = await getKey("default_role_admin");
    if(!adminCacheId){
      adminCacheId = await putKey("default_role_admin", admin.id.toString());
    }
    
   } catch (e) {
    console.error(e);
    
   }
   
  }
}