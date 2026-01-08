import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

// Initialize Sentry before anything else
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    release: process.env.npm_package_version || 'development',
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
    ],
  });
  console.log('[Sentry] Initialized for API');
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3001;
  const frontendUrl =
    configService.get<string>('frontend.url') || 'http://localhost:3000';

  // CORS yapılandırması
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://192.168.1.107',
      'https://haydihepberaber.com',
    ],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API prefix
  app.setGlobalPrefix('api');

  // Global error handling
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(reason);
    }
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (process.env.SENTRY_DSN) {
      Sentry.captureException(error);
    }
  });

  await app.listen(port);
  console.log(`API sunucusu http://localhost:${port} adresinde calisiyor`);
}

bootstrap();
