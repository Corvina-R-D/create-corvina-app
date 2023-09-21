import { INestApplication } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

export async function up({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);

  const sql = `   
    CREATE TABLE IF NOT EXISTS public."Installations"
    (
        "apiVersion" character varying(50) COLLATE pg_catalog."default" NOT NULL,
        "clientId" character varying(200) COLLATE pg_catalog."default" NOT NULL,
        "clientSecret" character varying(200) COLLATE pg_catalog."default" NOT NULL,
        "baseUrl" character varying(256) COLLATE pg_catalog."default" NOT NULL,
        "apiBaseUrl" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
        "authBaseUrl" character varying(256) COLLATE pg_catalog."default" NOT NULL,
        "openIdConfigurationUrl" character varying(1024) COLLATE pg_catalog."default" NOT NULL,
        "wsBaseUrl" character varying(256) COLLATE pg_catalog."default" NOT NULL,
        "organizationId" character varying(50) COLLATE pg_catalog."default" NOT NULL,
        "realmValidationRole" character varying(500) COLLATE pg_catalog."default" NOT NULL,
        "realm" character varying(50) COLLATE pg_catalog."default" NOT NULL,
        "createdAt" timestamp with time zone NOT NULL,
        "updatedAt" timestamp with time zone NOT NULL,
        CONSTRAINT "Installations_pkey" PRIMARY KEY ("baseUrl", "organizationId")
    )
    WITH (
        OIDS = FALSE
    )
    TABLESPACE pg_default;
  `;

  // eslint-disable-next-line no-console
  await sequelize.query(sql, { plain: true, logging: console.log });
}

export async function down({ context }) {
  const nestApp = context as INestApplication;
  const sequelize = nestApp.get(Sequelize);
  const queryInterface = sequelize.getQueryInterface();

  await queryInterface.dropTable('Installations');
}
