import {EventSubscriber, EntitySubscriberInterface, UpdateEvent} from "typeorm";
import { Permission } from "../entity/Permission";

@EventSubscriber()
export class PermissionSubscriber implements EntitySubscriberInterface<Permission> {
    listenTo(){
        return Permission;
    }
    afterUpdate(event: UpdateEvent<Permission>){
        console.log("更新了permissoin");
        
    }
}
