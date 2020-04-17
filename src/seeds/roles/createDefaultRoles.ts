import { Factory, Seeder } from 'typeorm-seeding'
import { Connection } from 'typeorm';
import RoleService from '../../services/daos/RoleService';
 
export default class CreateDefaultRoles implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
   const roleRepository = new RoleService(connection);
   await roleRepository.seed();
  }
}