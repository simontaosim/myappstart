import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcrypt';

import { User } from "../../entity/User";
import { getJWTSecret } from '../utils/cache';

export default class AuthService{
    private user: User;
    constructor(user? : User){
        this.user = user;
    }

    checkToken = async (token:string, id: number) => {
        const secret = await getJWTSecret();
        const decoded:any = jwt.verify(token, secret);
        const { userId } = decoded;
        if(userId === id ){
            return true;
        }
        return false;
    } 

     createToken = async (hours:number) =>  {
        const secret = await getJWTSecret();
        const  token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + (60 * 60* hours),
            data: {
                userId: this.user.id,
            }
        }, secret);
        return token;
    }

    checkPassword = (password:string): boolean => {
        console.log("user",this.user);
            const authed = bcrypt.compareSync(password, this.user.password);
            return authed;
    }

    authByGoogle = () => {

    }

    authByFacebook = () => {
        
    }
    
}