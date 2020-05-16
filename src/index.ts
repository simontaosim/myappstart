import "reflect-metadata";
import { createConnection, Connection } from "typeorm";
import App from "./App";
import BinanceService from "./services/partners/BinanceService";

async function start() {
    try {
        const connection: Connection = await createConnection(process.env.NODE_ENV || 'development');
        const app = new App();

        const binanceService = new BinanceService(connection);
        await binanceService.startGetPrices("BTCUSDT");
        app.start(connection);
        
    } catch (error) {
        console.log(error);
        throw error;
    }
}
start();
