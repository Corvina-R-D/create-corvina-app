// the following line esures that bigint values are parsed as numbers and not strings
// eslint-disable-next-line import/newline-after-import
require('pg').defaults.parseInt8 = true;
// eslint-disable-next-line import/first
import { SequelizeModule, SequelizeModuleOptions } from '@nestjs/sequelize';
// eslint-disable-next-line import/first
import { Installation } from '../entities/installation.entity';

const models = [Installation];

const getSequelizeConfig = () =>
  ({
    dialect: 'postgres',
    host: process.env.PG_HOST,
    port: parseInt(process.env.PG_PORT, 10),
    username: process.env.PG_USER,
    password: process.env.PG_PASS,
    database: process.env.PG_DATABASE,
    // eslint-disable-next-line no-console
    logging: process.env.PG_QUERY_LOGGING === 'true' ? console.log : undefined,
    pool: {
      max: process.env.PG_POOL_MAX ? parseInt(process.env.PG_POOL_MAX, 10) : 10,
    },
    dialectOptions: {
      statement_timeout: process.env.PG_MAX_QUERY_EXEC_TIME ? parseInt(process.env.PG_MAX_QUERY_EXEC_TIME, 10) : 5 * 1000,
    },
    models,
    // autoLoadModels: true,
    // synchronize: true,
    // sync: { force: true },
  } as SequelizeModuleOptions);

export const getSequelizeModule = () => [SequelizeModule.forRoot(getSequelizeConfig()), SequelizeModule.forFeature(models)];
