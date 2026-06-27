import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Security
  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', 'http://localhost:3000'),
    credentials: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger
  const swaggerConfig = new DocumentBuilder()
    .setTitle('KU Demo Student Portal API')
    .setDescription('Mock university ERP API for UniElection integration demo')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Integration', 'UniElection bridge endpoints')
    .addTag('Students', 'Student profile management')
    .addTag('Academics', 'Academic records & registration')
    .addTag('Finance', 'Fee statements & payments')
    .addTag('Library', 'Library resources & borrowing')
    .addTag('Hostel', 'Hostel allocation & maintenance')
    .addTag('Services', 'Student services')
    .addTag('Notifications', 'Announcements & notifications')
    .addTag('Messaging', 'In-app messaging')
    .addTag('Elections', 'Student elections & voting')
    .addTag('Admin', 'Administrative management')
    .addTag('Branding', 'Portal branding configuration')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = config.get('PORT', 3001);
  await app.listen(port);
  logger.log(`🚀 KU Demo Portal API running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
