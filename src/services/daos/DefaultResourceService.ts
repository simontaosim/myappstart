import { Repository, Connection, In } from "typeorm";
import { DefaultResource } from "../../entity/DefaultResource";
import { getKey, putKey } from "../utils/cache";

const defaultResources: string[] = [
    'permissions',
    'roles',
    'users',
    'posts',
]

export default class DefaultResourceService {
    private repository: Repository<DefaultResource>;
    private connection: Connection;

    constructor(connection: Connection) {
        this.connection = connection;
        this.repository = connection.getRepository(DefaultResource);
    }

    getDefaultResource = async  (resource:string): Promise<number[]>=> {
        let ids = [];
        const idsString = await getKey(`default_${resource}_ids`);
        if(idsString){
            ids = JSON.parse(idsString);
        }
        const resources = await this.repository.find({resource});
        for (let index = 0; index < resources.length; index++) {
            const resource = resources[index];
            ids.push(resource.resourceId)
        }
        await putKey(`default_${resource}_ids`, JSON.stringify(ids));
        return ids;
    }

    create = async (resource: string, resourceId: number) => {
        const instance = this.repository.create({
            resource,
            resourceId
        });
       return await  this.repository.save(instance);
    }

    
}