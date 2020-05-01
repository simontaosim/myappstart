import {EventSubscriber, EntitySubscriberInterface, UpdateEvent, RemoveEvent, getConnection} from "typeorm";
import { Permission } from "../entity/Permission";
import { Role } from "../entity/Role";
import { LoadEvent } from "typeorm/subscriber/event/LoadEvent";
import Jobs from "../utils/Jobs";

@EventSubscriber()
export class RoleSubscriber implements EntitySubscriberInterface<Role> {
    listenTo(){
        return Role;
    }
    async afterUpdate(event: UpdateEvent<Role>){
        console.log("更新了role");
        await Jobs.pop(`roles/softDelete`, async  (id:any, currentIndex:number)=>{
            const repository =  getConnection(process.env.NODE_ENV).getRepository(Permission);
            await repository
            .createQueryBuilder().softDelete()
            .where("roleId = :id", { id})
            .execute();
            
        })
        await Jobs.pop(`roles/softDeleteMany`, async  (ids:any, currentIndex:number)=>{
            const repository =  getConnection(process.env.NODE_ENV).getRepository(Permission);
            await repository
            .createQueryBuilder().softDelete()
            .where("roleId IN (:...ids)", { ids})
            .execute();
            
        })
        await Jobs.pop(`roles/update`, (id:number, currentIndex:number)=>{
            console.log({
                id, 
                currentIndex,
            });
            
        })
        
    }

    beforeUpdate(event: UpdateEvent<Role>){
        console.log("開始更新role", event.entity, event.databaseEntity);
    }

    afterRemove(event: RemoveEvent<Role>){
      
        console.log("刪除了role", event.entity, event.databaseEntity, event.manager);
    }

    afterLoad(Role, event: LoadEvent<Role>){
        console.log(event.entity);
        
    }
}
