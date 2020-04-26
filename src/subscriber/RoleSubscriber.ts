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
        console.log("更新了role", event.entity, event.databaseEntity, event.manager);
        
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
