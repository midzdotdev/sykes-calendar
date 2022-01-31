import { executeBrowserWork } from "../browser";
import { OWNER_CALENDARS_TTL } from "../constants";
import { Credentials } from "../types";
import { ownerCalendars } from "./ownerCalendars";
import { scrapeBookings } from "./scrapeBookings";
import { promiseCache } from "./utils";

interface GetOwnerCalendarsOpts {
  credentials: Credentials;
}

export const getOwnerCalendars = promiseCache(
  async ({ credentials }: GetOwnerCalendarsOpts) => {
    const bookings = await executeBrowserWork((page) =>
      scrapeBookings(page, credentials)
    );

    const calendars = ownerCalendars(bookings);

    return calendars;
  },
  { getKey: ({ credentials }) => credentials.email, ttl: OWNER_CALENDARS_TTL }
);
