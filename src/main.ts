import * as http from "http";
import { verifyBrowserConnection } from "./browser";
import { safeRequestListener } from "./http";
import { logger } from "./logger";

(async () => {
  await verifyBrowserConnection();

  const server = http.createServer(safeRequestListener);

  process.on("SIGTERM", () => {
    logger.info("received sigterm, closing http server");

    server.close();
  });

  server.on("listening", () => {
    logger.info("🚀 sykes calendar server running on 3000");
  });

  server.on("close", () => {
    logger.info("http server closed");
  });

  server.listen(3000, "0.0.0.0");
})();
