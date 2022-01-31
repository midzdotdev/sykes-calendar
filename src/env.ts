import * as z from "zod";

const Env = z.object({
  NODE_ENV: z
    .literal("development")
    .or(z.literal("production"))
    .default("development"),
  BROWSERLESS_URL: z.string().url(),
  SENTRY_DSN: z.string().url(),
});

export const env = Env.parse(process.env);

console.info("parsed environment variables", env);
