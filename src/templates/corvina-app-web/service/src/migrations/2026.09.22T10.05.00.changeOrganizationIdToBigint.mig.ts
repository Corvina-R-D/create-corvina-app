import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

export async function up({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `
    ALTER TABLE public."Installations"
    ALTER COLUMN "organizationId" TYPE bigint USING "organizationId"::bigint;
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}

export async function down({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `
    ALTER TABLE public."Installations"
    ALTER COLUMN "organizationId" TYPE character varying(50) USING "organizationId"::character varying(50);
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}
