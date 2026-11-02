import path from "node:path";
import express, { type Express } from "express";
import multer from "multer";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import { publishableKeyFromHost } from "@clerk/shared/keys";
import router from "./routes";
import { logger } from "./lib/logger";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
  getClerkProxyHost,
} from "./middlewares/clerkProxyMiddleware";

const app: Express = express();

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
app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api",
  clerkMiddleware((req) => ({
    publishableKey: publishableKeyFromHost(
      getClerkProxyHost(req) ?? "",
      process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    ),
  })),
);
app.use("/api", (_req, res, next) => { res.setHeader("Cache-Control", "no-store"); next(); }, router);
app.use("/api", (_req, res) => { res.status(404).json({ error: "API route not found" }); });
if (process.env.STATIC_DIR) {
  const staticDir = path.resolve(process.env.STATIC_DIR);
  app.use(express.static(staticDir));
  app.get("/{*path}", (_req, res) => { res.sendFile(path.join(staticDir, "index.html")); });
}
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ error: "File exceeds the 10 MB upload limit." });
    return;
  }
  req.log.error({ err }, "Unhandled API error");
  res.status(500).json({ error: "An unexpected server error occurred." });
});

export default app;
