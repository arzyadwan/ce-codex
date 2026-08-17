import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { AppModule } from "./app.module.js";
import { getSecurityConfig } from "./security/security-config.js";

async function bootstrap() {
  const security = getSecurityConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.use(helmet());
  app.useBodyParser("json", { limit: security.bodyLimit });
  app.useBodyParser("urlencoded", { limit: security.bodyLimit, extended: false });
  if (security.trustProxy !== false) app.set("trust proxy", security.trustProxy);
  app.setGlobalPrefix("v1");
  app.enableCors({ origin: security.allowedOrigins, credentials: true, methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], allowedHeaders: ["Authorization", "Content-Type"], maxAge: 600 });
  if (security.swaggerEnabled) {
    const config = new DocumentBuilder().setTitle("Crypto Exist API").setVersion("1.0").addBearerAuth().build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
  }
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 4000), "0.0.0.0");
}
void bootstrap();
