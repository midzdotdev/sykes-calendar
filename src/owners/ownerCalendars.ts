import * as datefns from "date-fns";
import ical, {
  ICalAttendeeType,
  ICalCalendar,
  ICalCalendarProdIdData,
  ICalEventData,
} from "ical-generator";
import { Booking, isOwnerBooking } from "./booking";

const prodId: ICalCalendarProdIdData = {
  company: "midz.dev",
  product: "Sykes Calendar",
  language: "EN",
};

export interface OwnerCalendars {
  combined: () => ICalCalendar;
  entries: () => {
    propertyName: string;
    calendar: ICalCalendar;
  }[];
}

export const ownerCalendars = (bookings: Booking[]): OwnerCalendars => {
  return {
    combined: () =>
      ical({
        prodId,
        name: "Sykes Bookings",
        events: bookings.map((x) => bookingEventData(x, true)),
      }),

    entries: () => {
      const partitionedBookings: Record<string, Booking[]> = bookings.reduce(
        (acc, b) =>
          b.Property in acc
            ? { ...acc, [b.Property]: [...acc[b.Property], b] }
            : { ...acc, [b.Property]: [b] },
        {} as Record<string, Booking[]>
      );

      return Object.entries(partitionedBookings).map(
        ([propertyName, bookings]) => ({
          propertyName,
          calendar: ical({
            prodId,
            name: `Bookings: ${propertyName}`,
            events: bookings.map((x) => bookingEventData(x, false)),
          }),
        })
      );
    },
  };
};

const bookingEventData = (
  booking: Booking,
  includePropertyName: boolean
): ICalEventData => ({
  id: isOwnerBooking(booking)
    ? booking["Booking Ref"]
    : booking["Booking Ref / PBN"],
  allDay: true,
  start: booking["Arrival Date"],
  end: booking["Departure Date"],

  summary:
    (includePropertyName ? `${booking.Property}: ` : "") +
    (isOwnerBooking(booking)
      ? "Owner Booking"
      : `${booking.Name} (${concatValues({
          adult: booking["Adults"] ?? 0,
          kid: booking["Teenagers and Children"] ?? 0,
          infant: booking["Infants"] ?? 0,
        })})`),

  ...(!isOwnerBooking(booking) && !!booking.Email
    ? {
        attendees: [
          {
            name: booking.Name,
            email: booking.Email,
            type: ICalAttendeeType.GROUP,
            x: {
              "X-NUM-GUESTS": String(
                [
                  booking.Adults,
                  booking["Teenagers and Children"],
                  booking["Infants"],
                ]
                  .map((x) => x ?? 0)
                  .reduce((a, b) => a + b, 0)
              ),
            },
          },
        ],
      }
    : {}),

  description: prettyPrintObject({
    ...booking,
    "Arrival Date": dateString(booking["Arrival Date"]),
    "Departure Date": dateString(booking["Departure Date"]),
  }),
});

const concatValues = (values: Record<string, number>) =>
  Object.entries(values)
    .filter(([_, qty]) => qty !== 0)
    .map(([unit, qty]) => `${qty} ${unit}${qty === 1 ? "" : "s"}`)
    .join(", ");

const dateString = (date: Date): string => datefns.format(date, "do MMM yyyy");

const prettyPrintObject = (o: Record<string, any>): string =>
  Object.entries(o).reduce(
    (acc, [key, value]) => `${acc}${key}: ${value}\n`,
    ""
  );
