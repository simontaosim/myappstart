import "reflect-metadata";
import { createConnection, Connection } from "typeorm";
import App from "./App";
import ipfsnode from "./utils/ipfsnode";

async function start() {
    try {
        const connection: Connection = await createConnection(process.env.NODE_ENV || 'development');
        const app = new App();
       
        app.start(connection);
        
    } catch (error) {
        console.log(error);
        throw error;
    }
}
start();
