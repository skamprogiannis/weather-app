const assert = require("node:assert/strict");
const { describe, it } = require("node:test");

const {
  fetchWeather,
  getUpcomingHours,
} = require("../src/weather-client.js");

describe("weather client", () => {
  it("encodes browser requests and forwards cancellation", async () => {
    const controller = new AbortController();
    let request;
    const fetchImpl = async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({
          resolvedAddress: "Athens, Greece",
          currentConditions: { temp: 25 },
          days: [{ hours: [] }],
        }),
      };
    };

    const data = await fetchWeather("Athens & Piraeus", "celsius", {
      fetchImpl,
      signal: controller.signal,
    });

    const url = new URL(request.url, "https://example.test");
    assert.equal(url.pathname, "/api/weather");
    assert.equal(url.searchParams.get("location"), "Athens & Piraeus");
    assert.equal(url.searchParams.get("units"), "celsius");
    assert.equal(request.options.signal, controller.signal);
    assert.equal(data.resolvedAddress, "Athens, Greece");
  });

  it("surfaces API errors and rejects incomplete provider data", async () => {
    await assert.rejects(
      fetchWeather("Nowhere", "celsius", {
        fetchImpl: async () => ({
          ok: false,
          status: 404,
          json: async () => ({ error: "Location not found." }),
        }),
      }),
      /Location not found/
    );

    await assert.rejects(
      fetchWeather("Athens", "celsius", {
        fetchImpl: async () => ({ ok: true, json: async () => ({ days: [] }) }),
      }),
      /incomplete/i
    );
  });

  it("continues the hourly forecast into the following day", () => {
    const today = Array.from({ length: 24 }, (_, hour) => ({
      datetime: `${String(hour).padStart(2, "0")}:00:00`,
      temp: hour,
    }));
    const tomorrow = Array.from({ length: 24 }, (_, hour) => ({
      datetime: `${String(hour).padStart(2, "0")}:00:00`,
      temp: 100 + hour,
    }));

    const hours = getUpcomingHours(
      [{ hours: today }, { hours: tomorrow }],
      "22:34:00"
    );

    assert.equal(hours.length, 24);
    assert.deepEqual(
      hours.slice(0, 4).map(({ temp }) => temp),
      [22, 23, 100, 101]
    );
  });
});
