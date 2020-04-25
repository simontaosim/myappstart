import { Factory, Seeder } from 'typeorm-seeding'
import { Connection } from 'typeorm'
import PermissionService from '../../services/daos/PermissionService'
 
export default class CreateInitPermissions implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const permissionService = new PermissionService(connection);
    await permissionService.createInitPermissions();
  }
}