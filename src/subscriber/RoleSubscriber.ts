import {EventSubscriber, EntitySubscriberInterface, UpdateEvent, RemoveEvent} from "typeorm";
import { Permission } from "../entity/Permission";
import { Role } from "../entity/Role";
import { LoadEvent } from "typeorm/subscriber/event/LoadEvent";

@EventSubscriber()
export class RoleSubscriber implements EntitySubscriberInterface<Role> {
    listenTo(){
        return Role;
    }
    afterUpdate(event: UpdateEvent<Role>){
        console.log("更新了role", event.entity, event.updatedColumns, event.databaseEntity, event.updatedRelations);
        
    }

    beforeUpdate(event: UpdateEvent<Role>){
        console.log("開始更新role", event.entity, event.updatedColumns);
    }

    afterRemove(event: RemoveEvent<Role>){
        console.log("刪除了role", event.entity, event.databaseEntity, event.entityId);
    }

    afterLoad(Role, event: LoadEvent<Role>){
        console.log("d當前操作的entity", event.entity);
        
    }
}
