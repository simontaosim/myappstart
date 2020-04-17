import * as chai from 'chai';

import RestService from '../../services/daos/RestService';
import { createConnection, getConnection } from "typeorm";

const  expect = chai.expect;

let connection = null;

describe("對RestService的單元測試", () => {
  before(async ()=>{
    console.log("開始單元測試");
    try {
      connection =   getConnection("test");
    } catch (e) {
      console.error(e);
      if(!connection){
        try {
          connection = await   createConnection(process.env.NODE_ENV || 'test');
        } catch (e) {
          console.error(e);
        }
       
       }
    }
   
    
  })
  it("創建一個角色, 用戶名爲john, 密碼爲123456", async  () => {
    console.log("users");
    const restService = new RestService("users", connection);
    let user = null;
    try {
      user = await  restService.create({
        username: 'john',
        password: '123456'
      });
      
    } catch (e) {
      console.error(e);
    }
    expect(user).to.have.property('username'); 
    expect(user.username).to.equal('john');
    expect(user).to.not.equal(undefined); 
  });
});