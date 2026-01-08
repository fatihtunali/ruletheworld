import * as Sentry from '@sentry/node';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
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

  // Swagger API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('RuleTheWorld API')
    .setDescription(`
      RuleTheWorld (Haydi Hep Beraber) oyunu için API dokümantasyonu.

      ## Özellikler
      - Kullanıcı kimlik doğrulama ve yetkilendirme
      - Topluluk yönetimi ve oyun mekaniği
      - Gerçek zamanlı WebSocket desteği
      - Turnuva ve liderlik tabloları
      - Görev ve başarım sistemi
      - Sezon ve ödül sistemi
      - Sanal para (Altın) sistemi
      - Premium üyelik sistemi
    `)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'JWT token girin',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Kimlik doğrulama işlemleri')
    .addTag('Topluluk', 'Topluluk yönetimi')
    .addTag('Oyun', 'Oyun mekanikleri')
    .addTag('Turnuva', 'Turnuva yönetimi')
    .addTag('İstatistik', 'İstatistikler ve liderlik tabloları')
    .addTag('Bildirim', 'Bildirim sistemi')
    .addTag('Başarım', 'Başarım sistemi')
    .addTag('Görev', 'Görev sistemi')
    .addTag('Sezon', 'Sezon sistemi')
    .addTag('Altın', 'Sanal para sistemi')
    .addTag('Premium', 'Premium üyelik')
    .addTag('Admin', 'Admin panel')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'RuleTheWorld API Docs',
    customfavIcon: 'https://haydihepberaber.com/favicon.ico',
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin-bottom: 30px }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

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
