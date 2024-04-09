/* eslint-disable no-await-in-loop */
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/GlobalExceptionFilter';

async function bootstrap() {
  const app = (await NestFactory.create(AppModule)) as NestExpressApplication;

  app.enableCors({
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    exposedHeaders: ['*'],
  });

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: false,
      frameguard: false,
    })
  );

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // register json body parser in order to handle
  // - OCI requests that have content-type application/vnd.oci.image.manifest.v1+json
  // - docker requests that have content-type application/vnd.docker.distribution.manifest.v2+json (https://docs.docker.com/registry/spec/manifest-v2-2/#media-types)
  app.useBodyParser('json', { type: 'application/*+json' });
  app.useBodyParser('json', { type: 'application/json' });

  const config = new DocumentBuilder()
    .setTitle('corvina app [| .Name |]')
    .setDescription('You can find here the API description')
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('swagger-ui', app, document);

  // run different features based on env variable
  const startFeatures = (process.env.START_FEATURES || 'app.listen').split(',');

  // eslint-disable-next-line no-restricted-syntax
  for (const feature of startFeatures) {
    // eslint-disable-next-line no-console
    console.log(`Starting feature ${feature}...`);

    switch (feature) {
      case 'migrator.up':
        await (await import('./migrations/migrator')).up(app);
        break;
      case 'migrator.down':
        await (await import('./migrations/migrator')).down(app);
        break;
      case 'app.listen':
        await app.listen(process.env.PORT || 3000);
        break;
      case 'quit':
        process.exit(0);
        break;
      default:
        throw new Error(`Unknown feature ${feature}`);
    }
  }
}

bootstrap();
