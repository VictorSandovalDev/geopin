import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe, Logger } from "@nestjs/common";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { RedisIoAdapter } from "./common/redis-io.adapter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger("Bootstrap");

  const port = Number(process.env.API_PORT ?? 4000);
  const corsOrigin = process.env.API_CORS_ORIGIN ?? "http://localhost:3000";

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.enableCors({
    origin: corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Use the Redis-backed Socket.IO adapter when REDIS_URL is set.
  if (process.env.REDIS_URL) {
    const adapter = new RedisIoAdapter(app);
    await adapter.connectToRedis(process.env.REDIS_URL);
    app.useWebSocketAdapter(adapter);
    logger.log(`Socket.IO Redis adapter connected (${process.env.REDIS_URL})`);
  } else {
    logger.warn("REDIS_URL not set — running Socket.IO without Redis adapter");
  }

  await app.listen(port, "0.0.0.0");
  logger.log(`GeoPin API listening on http://localhost:${port}/api`);
}

bootstrap().catch((err) => {
  console.error("Fatal bootstrap error:", err);
  process.exit(1);
});
