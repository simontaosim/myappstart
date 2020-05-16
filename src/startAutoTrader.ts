import { createConnection, Connection } from "typeorm";
import BinanceService from "./services/partners/BinanceService";
import { CoinPrice } from "./entity/CoinPrice";
import { CoinPricePossible } from "./entity/CoinPricePossible";


async function start(){
    const connection: Connection = await createConnection(process.env.NODE_ENV || 'development');
   
    const service = new BinanceService(connection: Connection);
    service.startAutoTrade("BTCUSDT");
}

start();