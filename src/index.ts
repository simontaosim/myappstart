import "reflect-metadata";
import {createConnection, Connection} from "typeorm";
import App from "./App";

async function start(){
    try {
        const connection:Connection = await createConnection(process.env.NODE_ENV || 'development');
        const app = new App();
        app.start(connection);
    } catch (error) {
        error => console.log(error)
    }
}
start();
