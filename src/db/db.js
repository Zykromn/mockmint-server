import config from '../config/env.config.js';
import { DataSource } from "typeorm";
import {Client, Task, Slug, Mock, Test, Chapter, Token} from './entities.js';


const DB = new DataSource({
    type: 'postgres',
    url: config.db.url,
    synchronize: config.env === 'dev',
    logging: false,
    entities: [Client, Task, Slug, Mock, Test, Chapter, Token],
});

export default DB;