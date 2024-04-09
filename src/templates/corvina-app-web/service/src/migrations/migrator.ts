import { Umzug, SequelizeStorage } from 'umzug';
import { Sequelize } from 'sequelize-typescript';
import { INestApplication } from '@nestjs/common';
import { getDatabaseConnectionInfo } from '../modules/sequelize.module';

const sequelize = new Sequelize({
  dialect: 'postgres',
  ...getDatabaseConnectionInfo(),
});

const createUmzug = async (nestApp: INestApplication): Promise<Umzug<any>> => {
  return new Umzug({
    migrations: [
      {
        name: '2023.03.20T12.36.51._initial.mig',
        ...(await import('./2023.03.20T12.36.51._initial.mig')),
      },
      {
        name: '2023.03.23T12.00.00.addInstanceId',
        ...(await import('./2023.03.23T12.00.00.addInstanceId.mig')),
      },
    ],
    context: nestApp,
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
};

export const up = async (nestApp: INestApplication) => {
  const umzug = await createUmzug(nestApp);

  await umzug.up();
};

export const down = async (nestApp: INestApplication) => {
  const umzug = await createUmzug(nestApp);

  await umzug.down();
};
