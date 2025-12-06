import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule, { logger: ['log', 'error', 'warn', 'debug', 'verbose'] });
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Listening on ${port}`);
}
bootstrap();
