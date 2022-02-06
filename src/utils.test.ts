import { Duration } from "ts-duration";
import {
  parseCredentials,
  promiseCache,
  promiseState,
  singletonPromiseFactory,
} from "./utils";

describe("parseCredentials", () => {
  it("parses a URL containing credentials", () => {
    const url = new URL("http://example.com/?email=email&password=password");
    const actual = parseCredentials(url);

    expect(actual).toMatchObject({
      email: "email",
      password: "password",
    });
  });

  it.each([
    new URL("http://example.com/"),
    new URL("http://example.com/?email=email"),
    new URL("http://example.com/?email=email&password="),
    new URL("http://example.com/?email=&password=password"),
  ])("returns null for a URL with missing credentials", (url) => {
    const actual = parseCredentials(url);

    expect(actual).toBe(null);
  });
});

describe("promiseState", () => {
  it.each([
    [Promise.resolve(), "fulfilled"],
    [Promise.reject(), "rejected"],
    [new Promise(() => {}), "pending"],
  ])("should work", async (promise, state) => {
    const actual = await promiseState(promise);

    expect(actual).toBe(state);
  });
});

const wait = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

describe("singletonPromiseFactory", () => {
  let mockCallback: <T>(key: string, promise: Promise<T>) => Promise<T>;
  let singletonFn: typeof mockCallback;

  beforeEach(() => {
    mockCallback = jest.fn((_, promise) => promise);
    singletonFn = singletonPromiseFactory(mockCallback, (key) => key);
  });

  it("resolves and rejects with the expected value", async () => {
    const foo = singletonFn(
      "foo",
      wait(5).then(() => {
        return "foo";
      })
    );

    const bar = singletonFn(
      "bar",
      wait(5).then(() => {
        throw "bar";
      })
    );

    await expect(foo).resolves.toBe("foo");
    await expect(bar).rejects.toBe("bar");
  });

  it("does not affect calls to different keys", async () => {
    const foo = singletonFn("foo", wait(5));
    const bar = singletonFn("bar", wait(10));

    await foo;

    await expect(promiseState(bar)).resolves.toBe("pending");
  });

  it("proxies to the pending promise determined by key", async () => {
    const promise = wait(5);

    const initial = singletonFn("foo", promise);
    const proxied = singletonFn("foo", wait(10));

    await initial;

    await expect(promiseState(proxied)).resolves.toBe("fulfilled");

    expect(mockCallback).toHaveBeenNthCalledWith(1, "foo", promise);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("executes again once the last promise is fulfilled", async () => {
    await singletonFn("foo", wait(5));
    await singletonFn("foo", wait(5));

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });
});

describe("promiseCache", () => {
  let mockCallback: <T>(key: string, promise: Promise<T>) => Promise<T>;
  let cachedFn: typeof mockCallback;

  const ttl = Duration.millisecond(5);

  beforeEach(() => {
    mockCallback = jest.fn((_, promise) => promise);
    cachedFn = promiseCache(mockCallback, {
      getKey: (key) => key,
      ttl,
    });
  });

  it("should cache subsequent calls", async () => {
    await Promise.all([
      cachedFn("foo", Promise.resolve()),
      cachedFn("foo", Promise.resolve()),
      cachedFn("foo", Promise.resolve()),
    ]);

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it("should not cache rejections", async () => {
    const rejected = cachedFn("foo", Promise.reject("foo"));
    await expect(rejected).rejects.toBe("foo");

    const resolved = cachedFn("foo", Promise.resolve("foo"));
    await expect(resolved).resolves.toBe("foo");

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  it("should get latest value on being called when cache is stale", async () => {
    cachedFn("foo", Promise.resolve("foo"));

    await wait(ttl.milliseconds);

    const bar = cachedFn("bar", Promise.resolve("bar"));
    await expect(bar).resolves.toBe("bar");

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });
});
