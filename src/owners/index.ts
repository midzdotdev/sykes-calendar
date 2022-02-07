import { executeBrowserWork } from "../browser";
import { OWNER_CALENDARS_TTL } from "../constants";
import { Credentials } from "../types";
import { promiseCache } from "../utils";
import { ownerCalendars } from "./ownerCalendars";
import { scrapeBookings } from "./scrapeBookings";

interface GetOwnerCalendarsOpts {
  credentials: Credentials;
}

export const getOwnerCalendars = promiseCache(
  async ({ credentials }: GetOwnerCalendarsOpts) => {
    const bookings = await executeBrowserWork((page) =>
      scrapeBookings(page, credentials)
    );

    const activeBookings = bookings.filter((x) => x.Status !== "Cancelled");

    const calendars = ownerCalendars(activeBookings);

    return calendars;
  },
  { getKey: ({ credentials }) => credentials.email, ttl: OWNER_CALENDARS_TTL }
);
