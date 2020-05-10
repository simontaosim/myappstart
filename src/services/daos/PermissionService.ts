import { Repository, Connection, In, Like, QueryBuilder, SelectQueryBuilder } from "typeorm";
import { Permission } from "../../entity/Permission";
import RoleService from "./RoleService";
import { IACLParams } from "../../middles/interfaces";
import { IListQuery } from './RestService';

const defaultResources: string[] = [
    'permissions',
    'roles',
    'users',
    'posts',
]

export default class PermissionService {
    private repository: Repository<Permission>;
    private connection: Connection;
    private selectQueryBuilder: SelectQueryBuilder<Permission>

    constructor(connection: Connection) {
        this.connection = connection;
        this.repository = connection.getRepository(Permission);
        this.selectQueryBuilder = this.repository.createQueryBuilder("permission")
    }

    getOneByRoleAndResource = (roleId:number, resource: string) => {

    }

    isAccess = async (acl: IACLParams) => {
        const roleService = new RoleService(this.connection);
        const adminId = await roleService.getAdminId();
        const {roleIds, resourceId, userId,resource, method} = acl;
        if (roleIds.includes(adminId)) {
            return true;
        }
        const permission = await this.repository.findOne({
            where: {
                roleId: In(roleIds),
                resource,
                method,
            }
         });
        //  console.log({
        //      permission
        //  });
         

         if(permission){
             return true;
         }
         return false;
    }

    createInitPermissions = async  () => {
        //nobody用户除了可以读取posts其他权限都没有，
        //register用户可以发表post, 读取posts, 其他权限都没有，
        const roleService = new RoleService(this.connection);
        try {
            const nobodyId = await roleService.getNobodyId();
            const registerId = await roleService.getRegisterId();

            let nobodyPermission =await  this.repository.findOne({
                roleId: nobodyId,
                resource: 'posts',
            }) 
            if(nobodyPermission){
                return false;
            }
             nobodyPermission = this.repository.create({
                roleId:  nobodyId,
                resource: 'posts',
                get: true,
                post: false,
                put: false,
                remove: false,
            });
            let registerPermission = await this.repository.findOne({
                roleId: registerId,
                resource: 'posts',
            })
            registerPermission = this.repository.create({
                roleId: registerId,
                resource: 'posts',
                get: true,
                post: true,
                put: false,
                remove: false,
            });
            await this.repository.save(nobodyPermission);
            await this.repository.save(registerPermission);
            return true;

        } catch (e) {
            throw e;
        }
        
    }

}