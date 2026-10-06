import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

export async function up({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `
    ALTER TABLE public."Installations"
    ADD COLUMN "orgResourceId" character varying(256);
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}

export async function down({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `
    ALTER TABLE public."Installations"
    DROP COLUMN "orgResourceId";
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}
