import puppeteer from "puppeteer-core";
import { env } from "./env";
import { logger } from "./logger";

/** Verifies a working connection to puppeteer. */
export const verifyBrowserConnection = async () => {
  logger.debug("verifying puppeteer connection");
  const browser = await puppeteer.connect({
    browserWSEndpoint: env.BROWSERLESS_URL,
  });

  await browser.close();

  logger.trace("puppeteer connection is sound");
};

/** Safely performs work in the browser, ensuring a proper teardown on completion or throwing. */
export const executeBrowserWork = async <T>(
  withPage: (page: puppeteer.Page) => Promise<T>
): Promise<T> => {
  const browser = await puppeteer.connect({
    browserWSEndpoint: env.BROWSERLESS_URL,
  });

  const page = await browser.newPage();

  try {
    return await withPage(page);
  } finally {
    await browser.close();
  }
};
