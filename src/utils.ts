import { logger } from "./logger";
import { Credentials } from "./types";

export const prettyPrintObject = (o: Record<string, any>): string =>
  Object.entries(o).reduce(
    (acc, [key, value]) => `${acc}${key}: ${value}\n`,
    ""
  );

export const parseCredentials = ({ searchParams }: URL): Credentials | null => {
  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (!email || !password) {
    logger.trace("failed to parse credentials from search params", {
      search: "?" + searchParams.toString(),
    });
    return null;
  }

  const credentials = { email, password };

  logger.trace("parsed the following credentials", credentials);

  return credentials;
};
