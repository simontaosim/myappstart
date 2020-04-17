import {  Repository, Like, Connection, In } from "typeorm";
import { User  } from "../../entity/User";
import { Role } from "../../entity/Role";
import { Post } from "../../entity/Post";
import { Permission } from "../../entity/Permission";
import  * as bcrypt from 'bcrypt';

interface IListQuerySort {
    [x: string]: 1 | "ASC" | "DESC" | -1;
}

interface IListFilter {
    [x: string]: string | Array<number>;
}

interface IListQuery  {
    skip: number;
    take: number;
    sort:  IListQuerySort
    filter: IListFilter
}


export default class RestService{
    private resource:string;
    private repository: Repository<any>;
    private listSelect: Array<string>;
    private detailSelect: Array<string>;
    private searchSelect: Array<string>;
    private relations: Array<string>;

    constructor(resource:string, connection: Connection){
        this.resource = resource;
        switch (this.resource) {
            case 'users':
                this.repository = connection.getRepository(User);
                this.listSelect = ['id', 'username', 'createdDate', 'updatedDate'];
                this.detailSelect = ['id', 'username', 'createdDate', 'updatedDate'];
                this.relations = ['roles']
                this.searchSelect = ['username'];
                break;
            case 'roles':
                this.repository = connection.getRepository(Role);
                this.listSelect = ['id', 'name', 'isDefault', 'createdDate', 'updatedDate'];
                this.detailSelect = ['id', 'name', 'createdDate', 'updatedDate'];
                this.searchSelect = ['name'];
                
                break;
            case "posts":
                this.repository = connection.getRepository(Post);
                this.listSelect = ['id', 'title', "authorId", 'createdDate', 'updatedDate'];
                this.detailSelect = ['id', 'title', "body",  "authorId", 'createdDate', 'updatedDate'];
                this.searchSelect = ['title', 'body'];
                break;
            case "permissions":
                this.repository = connection.getRepository(Permission);
                this.listSelect = ['id', 'resource', 'roleId', 'get', 'post', 'put', 'remove']
                this.detailSelect = ['id', 'resource', 'roleId', 'get', 'post', 'put', 'remove'];
                break;
            default:
                throw("NO_RESOURCE_FOUND");
        }
    }
    async listIds(ids:Array<number>){
        const instances = await  this.repository.find({
            where: {
                id: In(ids)
            },
        });
        return instances;
    }

    async list({skip, take, sort, filter}: IListQuery){
        const conditions = [];
        if(filter.q){
            for (let index = 0; index < this.searchSelect.length; index++) {
                const condition:object = {};
                const field = this.searchSelect[index];
                condition[field] = Like(`%${filter.q}%`);
                conditions.push(condition);
            }
        }
        else{
            conditions.push({...filter})
        }
        try {
            console.log(sort);
            const instances = await  this.repository.find({
                where: conditions,
                select: this.listSelect,
                skip,
                take,
                order:  {
                    ...sort
                },
                ...this.relations && {
                    relations: this.relations
                }
            });
            return instances;
        } catch (e) {
            throw e;
        }
        

    }

    async count(filter:IListFilter): Promise<number>{
        try {
            const count = await  this.repository.count({
                ...filter
              });
              return count;
        } catch (e) {
            throw e;
        }   
        
    }

    async one(id:number){
        try {
            const instance = await  this.repository.findOne({
                where: {id},
                select: this.detailSelect,
                ...this.relations && {
                    relations: this.relations
                }
            });
            console.log(instance);
            
            return instance;
        } catch (e) {
            throw e;
        }
    }

    async create(params: any){
        try {
            if(this.resource === 'users'){
                const salt = bcrypt.genSaltSync(Math.random());
                const hash = bcrypt.hashSync(params.password, salt);
                params = {
                    ...params,
                    password: hash
                }
            }
            const instance =  this.repository.create({
                ...params
            })
            const createRlt: any = await this.repository.save(instance);
            return createRlt;
        } catch (e) {
            throw e;
        }
    }

    async update(id:number, params: object){
        try {
            const updateRlt = await this.repository.update(id, { ...params });
            return updateRlt;
        } catch (e) {
            throw e;
        }
    }
    async remove(id:number){
        try {
            const removeRlt = await this.repository.softDelete(id);
            return removeRlt;
        } catch (e) {
        
        }
    }

}