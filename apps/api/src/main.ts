import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3001;
  const frontendUrl = configService.get<string>('frontend.url') || 'http://localhost:3000';

  // CORS yapılandırması
  app.enableCors({
    origin: [frontendUrl, 'http://localhost:3000', 'http://192.168.1.107'],
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

  await app.listen(port);
  console.log(`🚀 API sunucusu http://localhost:${port} adresinde çalışıyor`);
}

bootstrap();
