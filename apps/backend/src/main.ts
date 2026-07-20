import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

async function bootstrap() {
  // 1. Initialize Sentry (Monitoring) before anything else
  Sentry.init({
    dsn: process.env.SENTRY_DSN || '',
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0, 
    profilesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // 2. Structured Logging
  app.useLogger(app.get(Logger));
  
  // 3. Security Checklists (Helmet & CORS)
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
      }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
  }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'https://admin.garmenterp.com',
    credentials: true,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
