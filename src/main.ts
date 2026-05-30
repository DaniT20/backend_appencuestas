/* import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
 */

/* import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as functions from 'firebase-functions';
import { AppModule } from './app.module';
const server: express.Express = express();
export const createNestServer = async (expressInstance: express.Express) => {
  const adapter = new ExpressAdapter(expressInstance);
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule, adapter, {},
  );
  app.enableCors();
  return app.init();
};
createNestServer(server)
  .then(v => console.log('Nest Ready'))
  .catch(err => console.error('Nest broken', err));
export const api: functions.HttpsFunction = functions.https.onRequest(server); */

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import * as functions from 'firebase-functions';
import { AppModule } from './app.module';

const server = express();

// -------------------------------
// 1) MIDDLEWARE CORS A NIVEL EXPRESS
//    Para asegurar CORS incluso antes de que Nest esté listo
// -------------------------------
server.use((req, res, next) => {
  // Permitir cualquier origen
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.status(204).send("");
  }

  next();
});

let nestApp: NestExpressApplication | null = null;

// -------------------------------
// 2) Crear Nest solo una vez
// -------------------------------
async function createNestServer() {
  if (!nestApp) {
    const adapter = new ExpressAdapter(server);

    nestApp = await NestFactory.create<NestExpressApplication>(
      AppModule,
      adapter,
      { cors: false } // CORS de Nest lo manejamos manualmente abajo
    );

    // Habilita CORS de Nest sin limitar origen
    nestApp.enableCors({
      origin: true,         // reflect origin dinámicamente
      credentials: true,
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    });

    await nestApp.init();
    console.log("✅ Nest Ready");
  }

  return nestApp;
}

// -------------------------------
// 3) HANDLER DE FIREBASE
//    Siempre espera a que Nest esté listo
// -------------------------------
export const api: functions.HttpsFunction = functions.runWith({ memory: '4GB' }).https.onRequest(
  async (req, res) => {
    try {
      await createNestServer();
      return server(req, res);
    } catch (err) {
      console.error("❌ Error inicializando Nest:", err);

      // Even on error, return CORS to avoid fake CORS errors
      const origin = req.headers.origin || "*";
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
      );

      return res.status(500).json({ message: "Internal server error" });
    }
  }
);
