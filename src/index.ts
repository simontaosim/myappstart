import "reflect-metadata";
import { createConnection, Connection } from "typeorm";
import App from "./App";

async function start() {
    try {
        const connection: Connection = await createConnection(process.env.NODE_ENV || 'development');
        const app = new App();

        await app.start(connection);
        
    } catch (error) {
        console.log(error);
        throw error;
    }
}
start();
