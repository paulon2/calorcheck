import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pinoHttp from "pino-http";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { pool } from "@workspace/db";

const PgSession = connectPgSimple(session);
const isProd = process.env.NODE_ENV === "production";

const app: Express = express();

// Trust the first reverse proxy (Render, Heroku, etc.)
// Without this, Express doesn't know the connection is HTTPS and
// the Secure cookie flag is never set, breaking sessions on HTTPS hosts.
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
  }),
);

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
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
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      // Secure must be true on HTTPS (Render, Railway, etc.)
      // trust proxy (above) allows Express to detect HTTPS correctly.
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    },
  }),
);

app.use("/api", router);

export default app;
