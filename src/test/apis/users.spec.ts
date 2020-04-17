import * as chai from 'chai';

import { createConnection, getConnection } from "typeorm";
import App from '../../App';
import dataProvider from '../dataProvider';

const  expect = chai.expect;

let connection = null;
let app:App = null;

describe("對users api restful的單元測試", () => {
  before(async ()=>{
    try {
      connection =   await getConnection("test");
    } catch (e) {
      if(!connection){
        connection = await   createConnection(process.env.NODE_ENV || 'test');
       }
    }
    app = new App();
    app.start(connection);
    
  })
  it("創建一個角色, 用戶名爲john, 密碼爲123456", async  () => {
    let user = null;
    try{
    user = await dataProvider.create('users', {
      username: 'john',
      password: '123456'
    });
    console.log(user);
    
      
    } catch (e) {
      console.error(e);
    }
    expect(user).to.have.property('data'); 
    expect(user.data.username).to.equal('john');
    expect(user).to.not.equal(undefined); 
  });

  after(async () => {
    try {
      await app.stop();
    } catch (e) {
      console.error(e);
    }
  });
});