import { Factory, Seeder } from 'typeorm-seeding'
import { Connection } from 'typeorm'
import UserService from '../../services/daos/UserService'
 
export default class CreateAdminUser implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<any> {
    const userService = new UserService(connection);
    await userService.findOrCreateAdmin();
  }
}