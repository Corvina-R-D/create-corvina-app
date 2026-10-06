import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

export async function up({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `
    ALTER TABLE public."Installations"
    ADD COLUMN "endDate" timestamp with time zone,
    ADD COLUMN "planId" character varying(1024),
    ADD COLUMN "freeTrial" boolean NOT NULL DEFAULT false;
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}

export async function down({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `
    ALTER TABLE public."Installations"
    DROP COLUMN "endDate",
    DROP COLUMN "planId",
    DROP COLUMN "freeTrial";
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}
