const ALLOWED_UNITS = new Set(["celsius", "fahrenheit"]);

function isWeatherData(data) {
  return (
    data !== null &&
    typeof data === "object" &&
    data.currentConditions !== null &&
    typeof data.currentConditions === "object" &&
    Array.isArray(data.days) &&
    data.days.length > 0
  );
}

async function fetchWeather(
  location,
  units = "celsius",
  { fetchImpl = globalThis.fetch, signal } = {}
) {
  if (typeof location !== "string" || !location.trim()) {
    throw new Error("Enter a location to search for.");
  }
  if (!ALLOWED_UNITS.has(units)) {
    throw new Error("Choose Celsius or Fahrenheit.");
  }

  const queryParams = new URLSearchParams({ location: location.trim(), units });
  const response = await fetchImpl(`/api/weather?${queryParams.toString()}`, {
    headers: { Accept: "application/json" },
    signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || "Weather data is temporarily unavailable. Please try again."
    );
  }

  const data = await response.json();
  if (!isWeatherData(data)) {
    throw new Error("The weather service returned incomplete data. Please try again.");
  }
  return data;
}

function getUpcomingHours(days, currentTime) {
  if (!Array.isArray(days) || days.length === 0) return [];

  const parsedHour = Number.parseInt(String(currentTime).split(":", 1)[0], 10);
  const currentHour = Number.isInteger(parsedHour)
    ? Math.min(23, Math.max(0, parsedHour))
    : new Date().getHours();
  const today = Array.isArray(days[0]?.hours)
    ? days[0].hours.slice(currentHour)
    : [];
  const followingDays = days
    .slice(1)
    .flatMap((day) => (Array.isArray(day?.hours) ? day.hours : []));

  return [...today, ...followingDays].slice(0, 24);
}

module.exports = { fetchWeather, getUpcomingHours, isWeatherData };
