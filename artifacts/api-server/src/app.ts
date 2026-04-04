import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { pool } from "@workspace/db";
import path from "path";
import { fileURLToPath } from "url";

const PgSession = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";

const app: Express = express();

// Trust the first reverse proxy (Render, Heroku, etc.)
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    store: new PgSession({
      pool,
      tableName: "user_sessions",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET ?? "default-secret-change-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      httpOnly: true,
      secure: isProd, // true em produção
      sameSite: "lax",
    },
  })
);

// Rotas da API
app.use("/api", router);

// Servir frontend React
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../../calorie-tracker/dist/public");

app.use(express.static(frontendDist));

// Fallback para React Router
app.use((_req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

export default app;
