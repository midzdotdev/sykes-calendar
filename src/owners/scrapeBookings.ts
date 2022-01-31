import * as puppeteer from "puppeteer-core";
import { httpError } from "../errors";
import { logger } from "../logger";
import { Credentials } from "../types";
import { Booking, CustomerBooking, OwnerBooking } from "./booking";

const BOOKINGS_URL = "https://www.sykescottages.co.uk/owner/bookings";
const LOGIN_URL = "https://www.sykescottages.co.uk/account/login";

export const scrapeBookings = async (
  page: puppeteer.Page,
  { email, password }: Credentials
): Promise<Booking[]> => {
  logger.debug("scraping bookings", { email });

  await page.goto(BOOKINGS_URL, {
    waitUntil: "networkidle0",
  });

  if (page.url() === LOGIN_URL) {
    logger.debug("logging in", { email });

    await page.type("input#email", email);
    await page.type("input#password", password);

    await Promise.all([
      page.$eval("input#submit", (el) => (el as HTMLInputElement).click()),

      page.waitForNavigation({
        waitUntil: "networkidle0",
      }),
    ]);
  }

  if (page.url() !== BOOKINGS_URL) {
    logger.debug("failed to login", { email });
    throw httpError(401, "failed to log in with the given credentials");
  }

  logger.trace("loaded bookings page", { email });

  const rawBookings = await page.$$eval(
    ".booking-information > .message-content",
    (els) => els.map((x) => x.textContent ?? "")
  );

  const bookings = rawBookings.map((text) => parseBooking(text));

  logger.debug(`parsed ${bookings.length} bookings`, { email });

  return bookings;
};

const parseBooking = (textContent: string): Booking => {
  const data = textContent
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((x) => x !== "")
    .reduce(
      ({ key, acc }, s) =>
        key ? { key: null, acc: { ...acc, [key]: s } } : { key: s, acc },
      { key: null as null | string, acc: {} as Record<string, string> }
    ).acc;

  const ownerBooking = OwnerBooking.safeParse(data);
  if (ownerBooking.success) {
    return ownerBooking.data;
  }

  const customerBooking = CustomerBooking.safeParse(data);
  if (customerBooking.success) {
    return customerBooking.data;
  }

  logger.warn("failed to parse booking data", { textContent, data });

  throw httpError(500, "signed in but failed to parse booking data");
};
