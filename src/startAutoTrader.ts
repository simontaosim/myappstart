import { createConnection, Connection } from "typeorm";
import BinanceService from "./services/partners/BinanceService";
import { CoinPrice } from "./entity/CoinPrice";


async function start(){
    const connection: Connection = await createConnection(process.env.NODE_ENV || 'development');
    const repository = connection.getRepository(CoinPrice);
    const service = new BinanceService(repository);
    service.startAutoTrade("BTCUSDT");
}

start();