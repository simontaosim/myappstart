import * as chai from 'chai';

import { createConnection, getConnection, Connection, LessThanOrEqual, MoreThanOrEqual, LessThan } from "typeorm";
import { CoinOrder } from '../entity/CoinOrder';

const  expect = chai.expect;

let connection:Connection = null;

describe("對CoinOrder單元測試", () => {
  before(async ()=>{
    try {
      connection =   await getConnection("test");
    } catch (e) {
      if(!connection){
        connection = await   createConnection(process.env.NODE_ENV || 'test');
       }
    }
    
  })
  it("創建連個訂單，並且計算在一定價格中的獲益", async  () => {
    const repository = connection.getRepository(CoinOrder);
    const order = repository.create({
        price: 9377.46,
        ticker: 'BTCUSDT',
        cost: 15,
        quantity: 15/9287.45,
        limitLoss: 9234.11,
        limitWin: 9465.11,
    })
    await repository.save(order);
    const currentPrice = 9522.11;
    const orderFind = await repository.findOne({
        limitWin: LessThanOrEqual(currentPrice),
        isBack: false,
    });
    const profit = orderFind.quantity*currentPrice -  15;
    console.log(profit);


    
  });

  after(async () => {
 
  });
});