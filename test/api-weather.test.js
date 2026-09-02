const assert = require("node:assert/strict");
const { afterEach, beforeEach, describe, it } = require("node:test");

const {
  constructWeatherAPIUrl,
  handler,
  resetRateLimits,
} = require("../api/weather.js");

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function request(query = {}, overrides = {}) {
  return {
    method: "GET",
    query,
    headers: { "x-forwarded-for": "203.0.113.10" },
    ...overrides,
  };
}

describe("weather API", () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.WEATHER_API_KEY;

  beforeEach(() => {
    process.env.WEATHER_API_KEY = "test-api-key";
    resetRateLimits();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.WEATHER_API_KEY;
    else process.env.WEATHER_API_KEY = originalKey;
  });

  it("constructs an encoded URL without putting user input in the query string", () => {
    const url = new URL(
      constructWeatherAPIUrl("Athens/Αθήνα #1", "celsius", "secret")
    );

    assert.equal(
      url.pathname,
      "/VisualCrossingWebServices/rest/services/timeline/Athens%2F%CE%91%CE%B8%CE%AE%CE%BD%CE%B1%20%231"
    );
    assert.equal(url.searchParams.get("unitGroup"), "metric");
    assert.equal(url.searchParams.get("key"), "secret");
  });

  it("rejects methods other than GET", async () => {
    const res = createResponse();

    await handler(request({}, { method: "POST" }), res);

    assert.equal(res.statusCode, 405);
    assert.equal(res.headers.Allow, "GET");
    assert.match(res.body.error, /GET/);
  });

  it("validates location and units before contacting the provider", async () => {
    global.fetch = async () => {
      throw new Error("fetch should not be called");
    };

    for (const [query, message] of [
      [{}, /location/i],
      [{ location: ["Athens", "Rome"] }, /location/i],
      [{ location: "A".repeat(101) }, /100/],
      [{ location: "Athens\u0000" }, /control/i],
      [{ location: "Athens", units: "kelvin" }, /units/i],
    ]) {
      const res = createResponse();
      await handler(request(query), res);
      assert.equal(res.statusCode, 400);
      assert.match(res.body.error, message);
    }
  });

  it("proxies valid requests and marks successful responses as cacheable", async () => {
    let requestedUrl;
    global.fetch = async (url) => {
      requestedUrl = new URL(url);
      return {
        ok: true,
        json: async () => ({ resolvedAddress: "Athens, Greece", days: [] }),
      };
    };
    const res = createResponse();

    await handler(request({ location: "  Athens, Greece  ", units: "fahrenheit" }), res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.resolvedAddress, "Athens, Greece");
    assert.match(res.headers["Cache-Control"], /s-maxage=300/);
    assert.equal(requestedUrl.searchParams.get("unitGroup"), "us");
    assert.equal(requestedUrl.searchParams.get("key"), "test-api-key");
    assert.match(requestedUrl.pathname, /Athens%2C%20Greece$/);
  });

  it("maps provider failures to safe, actionable errors", async () => {
    global.fetch = async () => ({ ok: false, status: 429 });
    const rateLimited = createResponse();
    await handler(request({ location: "Athens" }), rateLimited);
    assert.equal(rateLimited.statusCode, 429);
    assert.match(rateLimited.body.error, /try again/i);

    global.fetch = async () => ({ ok: false, status: 500 });
    const providerFailure = createResponse();
    await handler(request({ location: "Athens" }), providerFailure);
    assert.equal(providerFailure.statusCode, 502);
    assert.doesNotMatch(providerFailure.body.error, /test-api-key/);
  });

  it("limits repeated uncached requests from one client", async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ days: [] }) });

    for (let index = 0; index < 30; index += 1) {
      const res = createResponse();
      await handler(request({ location: `Athens ${index}` }), res);
      assert.equal(res.statusCode, 200);
    }

    const blocked = createResponse();
    await handler(request({ location: "Athens blocked" }), blocked);
    assert.equal(blocked.statusCode, 429);
    assert.ok(Number(blocked.headers["Retry-After"]) > 0);
  });
});
