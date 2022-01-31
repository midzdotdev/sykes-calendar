import pino from "pino";
import pinoHttp from "pino-http";
import pinoPretty from "pino-pretty";
import { env } from "./env";

const _logger = (() => {
  if (env.NODE_ENV === "development") {
    const stream = pinoPretty({
      colorize: true,
    });

    return pino(
      {
        level: "trace",
      },
      stream
    );
  }

  // TODO: add support for sentry when level is "warn" or "fatal"
  // Sentry.init({
  //   dsn: env.SENTRY_DSN,
  // });

  return pino({
    level: "debug",
  });
})();

export const logHttp = pinoHttp({
  logger: _logger as any,
});

type LogFunction = (msg: string, obj?: {}) => void;

type LogLevel = "trace" | "debug" | "info" | "warn" | "fatal";

export const logger: Record<LogLevel, LogFunction> = {
  trace: (msg, obj) => _logger.trace(obj ?? {}, msg),
  debug: (msg, obj) => _logger.debug(obj ?? {}, msg),
  info: (msg, obj) => _logger.info(obj ?? {}, msg),
  warn: (msg, obj) => _logger.warn(obj ?? {}, msg),
  fatal: (msg, obj) => _logger.fatal(obj ?? {}, msg),
};
