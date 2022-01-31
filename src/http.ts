import * as http from "http";
import * as serialize from "pino-std-serializers";
import slugify from "slugify";
import { httpError, isHttpError } from "./errors";
import { logger, logHttp } from "./logger";
import { getOwnerCalendars } from "./owners";
import { parseCredentials } from "./utils";

export const safeRequestListener: http.RequestListener = async (req, res) => {
  logHttp(req, res);

  try {
    await requestListener(req, res);
  } catch (e) {
    if (isHttpError(e)) {
      logger.debug("handled error from request handler", serialize.err(e));

      res
        .writeHead(e.statusCode, { "Content-Type": "text/plain" })
        .end(e.message);

      return;
    }

    logger.warn(
      "unexpected error from http request handler",
      serialize.err(e as Error)
    );

    res.writeHead(500).end();
  }
};

const requestListener: http.RequestListener = async (req, res) => {
  if (req.method !== "GET") {
    throw httpError(400);
  }

  const url = new URL(req.url ?? "", `http://${req.headers.host}`);

  const credentials = parseCredentials(url);

  if (!credentials) {
    throw httpError(401);
  }

  const calendars = await getOwnerCalendars({
    credentials,
  });

  if (url.pathname === "/all") {
    logger.trace("serving combined bookings calendar");
    return calendars.combined().serve(res);
  }

  const calendarEntries = calendars.entries();

  for (const { propertyName, calendar } of calendarEntries) {
    if (!propertyName) {
      logger.warn(
        "none of the properties belonging to the owner should have an empty name",
        {
          email: credentials.email,
          propertyName,
        }
      );

      continue;
    }

    const slug = slugify(propertyName, { lower: true });

    if (url.pathname === `/${slug}`) {
      logger.trace(`serving bookings calendar for "${propertyName}"`);
      return calendar.serve(res);
    }
  }

  logger.debug("failed to match url to any of owner's properties", {
    url,
    propertyNames: Object.keys(calendarEntries),
  });

  throw httpError(404);
};
