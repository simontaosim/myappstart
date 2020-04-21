import * as level from 'level-rocksdb';
import * as cryptoRandomString from 'crypto-random-string';

import { JWT_SECRET } from './CacheKeyContants';
const  db = level('./cache');
function getCache(){
  if(db){
    return db;
  }
  return level('./cache');
}

export  function putKey(key:string, value:string):Promise<string>{
  return new  Promise((res, rej) => {
    const db = getCache();
    db.put(key, value, (err:any) => {
     if(err){
      rej(err);
      throw err;
     }
     res(value);
    })
  })
}

export function getKey(key:string): Promise<string| null>{
  return new Promise((res, rej) => {
    const db = getCache();
    db.get(key, function (err:any, value:string | null) {
      if (err) {
        if (err.notFound) {
          res(null);
          return
        }
        return rej(err)
      }
      res(value);
    })
  })
}

export async function getJWTSecret(): Promise<string | null>{
  let value = await getKey(JWT_SECRET);
  if(!value){
    const secret = cryptoRandomString({length: 23, type: 'url-safe'});
    value = await putKey(JWT_SECRET, secret);
    return secret;
  }
  return value;
}


