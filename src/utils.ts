import { Duration } from "ts-duration";
import { Credentials } from "./types";

export const parseCredentials = ({ searchParams }: URL): Credentials | null => {
  const email = searchParams.get("email");
  const password = searchParams.get("password");

  if (!email || !password) {
    return null;
  }

  const credentials = { email, password };

  return credentials;
};

export const promiseState = <T>(
  p: Promise<T>
): Promise<"pending" | "fulfilled" | "rejected"> => {
  const t = {};
  return Promise.race([p, t]).then(
    (v) => (v === t ? "pending" : "fulfilled"),
    () => "rejected"
  );
};

/**
 * Prevents an async function from having multiple executions which likely resolve to the same value.
 * Equivalence of arguments is determined by mapping to a unique key.
 */
export const singletonPromiseFactory = <P extends unknown[], R>(
  fn: (...args: P) => Promise<R>,
  getKey: (...args: P) => string
): ((...args: P) => Promise<R>) => {
  const promises = new Map<string, Promise<R>>();

  return async (...args) => {
    const key = getKey(...args);

    // use the pending promise if available
    const existingPromise = promises.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    // otherwise execute callback and set promise in cache
    const newPromise = fn(...args);
    promises.set(key, newPromise);

    newPromise
      .catch(() => {})
      .finally(() => {
        if (promises.get(key) === newPromise) {
          promises.delete(key);
        }
      });

    return newPromise;
  };
};

/**
 * Caches results of the given async function.
 * Re-runs the function to get a fresh value once the TTL has expired.
 */
export const promiseCache = <P extends unknown[], R>(
  fn: (...args: P) => Promise<R>,
  {
    getKey,
    ttl,
  }: {
    getKey: (...t: P) => string;
    ttl: Duration;
  }
): ((...args: P) => Promise<R>) => {
  const store = new Map<
    string,
    {
      timestamp: Date;
      value: R;
    }
  >();

  return singletonPromiseFactory(async (...args) => {
    const key = getKey(...args);

    const cacheEntry = store.get(key);

    if (
      cacheEntry &&
      Date.now() - cacheEntry.timestamp.getTime() < ttl.milliseconds
    ) {
      return cacheEntry.value;
    }

    const value = await fn(...args);

    store.set(key, {
      timestamp: new Date(),
      value,
    });

    return value;
  }, getKey);
};
