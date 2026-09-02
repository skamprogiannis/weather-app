const BASE_URL =
  "https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/";
const ALLOWED_UNITS = new Set(["celsius", "fahrenheit"]);
const MAX_LOCATION_LENGTH = 100;
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 5 * 60 * 1000;
const UPSTREAM_TIMEOUT_MS = 10_000;
const rateLimits = new Map();

/**
 * Constructs a URL for fetching weather data from the Visual Crossing API.
 *
 * @param {string} location - Validated location search text.
 * @param {"celsius"|"fahrenheit"} units - Temperature unit selection.
 * @param {string} apiKey - Visual Crossing API key.
 * @returns {string} Encoded provider URL.
 */
function constructWeatherAPIUrl(location, units, apiKey) {
  const url = new URL(`${BASE_URL}${encodeURIComponent(location)}`);
  url.searchParams.set("unitGroup", units === "celsius" ? "metric" : "us");
  url.searchParams.set("include", "current,hours,days,alerts");
  url.searchParams.set("contentType", "json");
  url.searchParams.set("key", apiKey);
  return url.toString();
}

function getClientIdentifier(req) {
  const forwardedFor = req.headers?.["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
    return forwardedFor.split(",", 1)[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

function consumeRateLimit(identifier, now = Date.now()) {
  const existing = rateLimits.get(identifier);
  if (!existing || now >= existing.resetAt) {
    const entry = { count: 1, resetAt: now + RATE_WINDOW_MS };
    rateLimits.set(identifier, entry);
    return { allowed: true, remaining: RATE_LIMIT - 1, resetAt: entry.resetAt };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= RATE_LIMIT,
    remaining: Math.max(0, RATE_LIMIT - existing.count),
    resetAt: existing.resetAt,
  };
}

function setRateLimitHeaders(res, rateLimit) {
  res.setHeader("X-RateLimit-Limit", String(RATE_LIMIT));
  res.setHeader("X-RateLimit-Remaining", String(rateLimit.remaining));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateLimit.resetAt / 1000)));
}

function sendError(res, status, error) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(status).json({ error });
}

function validateQuery(query = {}) {
  if (typeof query.location !== "string") {
    return { error: "Provide one location to search for." };
  }

  const location = query.location.trim();
  if (!location) return { error: "Provide a location to search for." };
  if (Array.from(location).length > MAX_LOCATION_LENGTH) {
    return { error: `Location must be ${MAX_LOCATION_LENGTH} characters or fewer.` };
  }
  if (/[\u0000-\u001f\u007f]/u.test(location)) {
    return { error: "Location cannot contain control characters." };
  }

  const units = query.units === undefined ? "celsius" : query.units;
  if (typeof units !== "string" || !ALLOWED_UNITS.has(units)) {
    return { error: "Units must be either 'celsius' or 'fahrenheit'." };
  }

  return { location, units };
}

/**
 * Vercel Serverless Function that validates and proxies weather requests while
 * keeping the provider API key out of the browser.
 *
 * @param {import("http").IncomingMessage & {query?: Record<string, unknown>}} req
 * @param {import("http").ServerResponse & {status: Function, json: Function}} res
 */
async function handler(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendError(res, 405, "Only GET requests are supported.");
  }

  const validated = validateQuery(req.query);
  if (validated.error) return sendError(res, 400, validated.error);

  const apiKey = process.env.WEATHER_API_KEY;
  if (!apiKey) {
    return sendError(res, 500, "Weather service is not configured.");
  }

  const rateLimit = consumeRateLimit(getClientIdentifier(req));
  setRateLimitHeaders(res, rateLimit);
  if (!rateLimit.allowed) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    return sendError(res, 429, "Too many weather searches. Please try again shortly.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

  try {
    const apiUrl = constructWeatherAPIUrl(
      validated.location,
      validated.units,
      apiKey
    );
    const response = await fetch(apiUrl, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 404) {
        return sendError(res, 404, "Location not found. Check the spelling and try again.");
      }
      if (response.status === 429) {
        return sendError(res, 429, "Weather provider is busy. Please try again shortly.");
      }
      return sendError(res, 502, "Weather data is temporarily unavailable. Please try again.");
    }

    const data = await response.json();
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json(data);
  } catch (error) {
    if (error?.name === "AbortError") {
      return sendError(res, 504, "Weather service timed out. Please try again.");
    }
    return sendError(res, 502, "Weather data is temporarily unavailable. Please try again.");
  } finally {
    clearTimeout(timeout);
  }
}

function resetRateLimits() {
  rateLimits.clear();
}

module.exports = handler;
module.exports.handler = handler;
module.exports.constructWeatherAPIUrl = constructWeatherAPIUrl;
module.exports.resetRateLimits = resetRateLimits;
