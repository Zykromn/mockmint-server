import config from '../config/env.config.js';

import { DataSource } from "typeorm";

import { Client } from "./entities/Client.js";
import { Task } from "./entities/Task.js";
import { Slug } from "./entities/Slug.js";
import { Mock } from "./entities/Mock.js";
import { Test } from "./entities/Test.js";
import { Chapter } from "./entities/Chapter.js";
import { Token } from "./entities/Token.js";


const DB = new DataSource({
    type: 'postgres',
    url: config.db.url,
    synchronize: config.env === 'dev',
    logging: false,
    entities: [Client, Task, Slug, Mock, Test, Chapter, Token],
});

export default DB;