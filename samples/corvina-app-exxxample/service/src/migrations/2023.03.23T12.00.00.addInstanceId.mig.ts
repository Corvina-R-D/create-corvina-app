import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

export async function up({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `   
    ALTER TABLE public."Installations"
    ADD COLUMN "instanceId" UUID NOT NULL;

    ALTER TABLE public."Installations"
    DROP CONSTRAINT "Installations_pkey";

    ALTER TABLE public."Installations"
    ADD CONSTRAINT "Installations_pkey" PRIMARY KEY ("organizationId", "instanceId");
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}

export async function down({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `   
    ALTER TABLE public."Installations"
    DROP CONSTRAINT "Installations_pkey";

    ALTER TABLE public."Installations"
    DROP COLUMN "instanceId";

    ALTER TABLE public."Installations"
    ADD CONSTRAINT "Installations_pkey" PRIMARY KEY ("baseUrl", "organizationId");
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}
