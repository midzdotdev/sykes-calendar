import * as datefns from "date-fns";
import * as z from "zod";

export type Booking = OwnerBooking | CustomerBooking;

export type OwnerBooking = z.TypeOf<typeof OwnerBooking>;
export type CustomerBooking = z.TypeOf<typeof CustomerBooking>;

const sykesDate = (s: string): Date =>
  datefns.parse(s, "do MMM yyyy", new Date());
const numericString = (s: string): number => Number.parseInt(s);

export const isOwnerBooking = (booking: Booking): booking is OwnerBooking =>
  booking.Status === "Owner Booking";

export const OwnerBooking = z.object({
  Property: z.string(),
  "Booking Ref": z.string(),
  "Arrival Date": z.string().transform(sykesDate),
  "Departure Date": z.string().transform(sykesDate),
  Status: z.literal("Owner Booking"),
  "Booking Type": z.string(),
});

export const CustomerBooking = z.object({
  Property: z.string(),
  "Booking Ref / PBN": z.string(),
  "Arrival Date": z.string().transform(sykesDate),
  "Departure Date": z.string().transform(sykesDate),
  Status: z.union([z.literal("Confirmed"), z.literal("Cancelled")]),
  Name: z.string(),
  Email: z.ostring(),
  "Customer Home": z.ostring(),
  "Customer Mobile": z.ostring(),
  "Customer Postcode": z.ostring(),
  Adults: z.optional(z.string().transform(numericString)),
  "Teenagers and Children": z.optional(z.string().transform(numericString)),
  Infants: z.optional(z.string().transform(numericString)),
});
