/**
 * Constructs a URL for fetching weather data from the Visual Crossing API.
 * @param {string} location - The location for which to fetch weather data (e.g., "New York, NY").
 * @param {"celsius"|"fahrenheit"} units - The units for temperature ("celsius" for metric, "fahrenheit" for US).
 * @returns {string} The complete API URL for fetching weather data.
 */
function constructWeatherAPIUrl(location, units) {
  const BASE_URL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/`;
  const API_KEY = process.env.WEATHER_API_KEY;

  const unitGroup = units === "celsius" ? "metric" : "us";

  return `${BASE_URL}${location}?unitGroup=${unitGroup}&key=${API_KEY}`;
}

/**
 * Vercel Serverless Function to fetch weather data securely.
 * API key is stored in environment variables.
 *
 * @param {import('http').IncomingMessage} req - The request object
 * @param {import('http').ServerResponse} res - The response object
 */
export default async function handler(req, res) {
  const { location, units = "celsius" } = req.query;

  if (!location) {
    res.status(400).json({ error: "Missing required 'location' query parameter." });
    return;
  }

  if (!process.env.WEATHER_API_KEY) {
    res.status(500).json({ error: "API key not configured on server." });
    return;
  }

  const apiUrl = constructWeatherAPIUrl(location, units);

  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
