import { Connection, Repository } from "typeorm";

import { CoinPrice } from "../../entity/CoinPrice";

export default class CoinPriceService {
    private repository: Repository<CoinPrice>;
    private connection: Connection;
    constructor(connection:Connection){
        this.connection = connection;
        this.repository = connection.getRepository(CoinPrice);
    }


}