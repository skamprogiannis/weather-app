import "./styles.css";

/**
 * @typedef {Object} WeatherData
 * @property {string} resolvedAddress - The resolved location name.
 * @property {string} address - The address used in the API request.
 * @property {Object} currentConditions - The current weather conditions.
 * @property {number} currentConditions.temp - The current temperature.
 * @property {string} currentConditions.conditions - The weather description.
 * @property {string} currentConditions.icon - The weather icon identifier.
 * @property {number} currentConditions.windspeed - The wind speed.
 * @property {number} currentConditions.humidity - The humidity percentage.
 * @property {number} currentConditions.precip - The precipitation amount.
 * @property {Object[]} alerts - A list of weather alerts.
 * @property {Object[]} days - Forecast data for multiple days.
 */

/**
 * Constructs a URL for fetching weather data from the Visual Crossing API.
 * @param {string} location - The location for which to fetch weather data (e.g., "New York, NY").
 * @param {"celsius"|"fahrenheit"} units - The units for temperature ("celsius" for metric, "fahrenheit" for US).
 * @returns {string} The complete API URL for fetching weather data.
 */
function constructWeatherAPIUrl(location, units) {
  const BASE_URL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/`;
  const API_KEY = "REMOVED";

  let unitGroup = "?unitGroup=";
  if (units === "celsius") {
    unitGroup += "metric";
  } else {
    unitGroup += "us";
  }

  return BASE_URL + `${location}${unitGroup}&key=${API_KEY}`;
}

/**
 * Fetches weather data from the Visual Crossing API.
 * @param {string} location - The location for which to fetch weather data (e.g., "New York, NY").
 * @param {"celsius"|"fahrenheit"} units - The units for temperature ("celsius" for metric, "fahrenheit" for US).
 * @returns {Promise<WeatherData|undefined>} A promise resolving to the weather data object, or undefined if an error occurs.
 *
 */
async function getWeatherData(location, units) {
  try {
    const url = constructWeatherAPIUrl(location, units);
    console.log("Constructed URL:", url);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.log("Error fetching weather data:", error);
  }
}

/**
 * Displays the weather data on the webpage.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 * @param {"celsius"|"fahrenheit"} units - The units for temperature.
 */
function displayWeatherData(weatherData, units) {
  displayWeatherCard(weatherData, units);
  //todo: displayFortnightlyForecast(weatherData, units);
}

/**
 * Displays the main weather card with current conditions.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 * @param {"celsius"|"fahrenheit"} units - The units for temperature.
 */
function displayWeatherCard(weatherData, units) {
  const weatherCard = document.querySelector(".weather-card");
  weatherCard.classList.remove("hidden");
  displayWeatherCardHeader(weatherData);
  displayAlerts(weatherData);
  displayCurrentConditions(weatherData, units);
  displayHourlyForecast(weatherData, units);
}

/**
 * Displays the weather card header with location and current date.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 */
function displayWeatherCardHeader(weatherData) {
  const cityNameElement = document.querySelector("#city-name");
  cityNameElement.textContent =
    weatherData.resolvedAddress || weatherData.address;

  const dateElement = document.querySelector("#weather-date");
  if (dateElement) {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    dateElement.textContent = currentDate;
  }
}

/**
 * Displays weather alerts if available.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 */
function displayAlerts(weatherData) {
  const alertsElement = document.querySelector("#weather-alerts");
  alertsElement.innerHTML = "";

  if (weatherData.alerts && weatherData.alerts.length > 0) {
    weatherData.alerts.forEach((alert) => {
      const alertContainer = document.createElement("div");
      alertContainer.className = "alert-item";

      const alertTitle = document.createElement("h4");
      alertTitle.className = "alert-title";
      alertTitle.textContent = alert.event || "Weather Alert";
      alertContainer.appendChild(alertTitle);

      const alertDescription = document.createElement("p");
      alertDescription.className = "alert-description";
      alertDescription.textContent = alert.description || "";
      alertContainer.appendChild(alertDescription);

      alertsElement.appendChild(alertContainer);
    });
  }
}

/**
 * Displays the current weather conditions.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 * @param {"celsius"|"fahrenheit"} units - The units for temperature.
 */
function displayCurrentConditions(weatherData, units) {
  const currentConditions = weatherData.currentConditions;

  const conditionsElement = document.querySelector("#weather-conditions");
  conditionsElement.textContent = currentConditions.conditions || "";

  const iconElement = document.querySelector("#weather-icon");
  iconElement.src = getWeatherIconUrl(currentConditions.icon);
  iconElement.alt = currentConditions.conditions;

  const tempElement = document.querySelector("#temp");
  const tempUnit = units === "celsius" ? "°C" : "°F";
  tempElement.textContent = `${Math.round(currentConditions.temp)}${tempUnit}`;

  const windSpeedElement = document.querySelector("#wind-speed");
  const windSpeedUnit = units === "celsius" ? "km/h" : "mph";
  windSpeedElement.textContent = `${currentConditions.windspeed} ${windSpeedUnit}`;

  const humidityElement = document.querySelector("#humidity");
  humidityElement.textContent = `${currentConditions.humidity}%`;

  const precipElement = document.querySelector("#precip");
  const precipUnit = units === "celsius" ? "mm" : "in";
  precipElement.textContent = `${currentConditions.precip} ${precipUnit}`;
}

/**
 * Displays the hourly weather forecast for the next 24 hours.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 * @param {"celsius"|"fahrenheit"} units - The units for temperature.
 */
function displayHourlyForecast(weatherData, units) {
  const carouselElement = document.querySelector(".hour-carousel");
  carouselElement.innerHTML = "";

  const today = weatherData.days[0];
  const currentHour = new Date().getHours();
  const tempUnit = units === "celsius" ? "°C" : "°F";

  if (today && today.hours) {
    for (let i = currentHour; i < currentHour + 24; i++) {
      const hourIndex = i % 24;
      const hour = today.hours[hourIndex];

      if (hour) {
        const hourElement = document.createElement("div");
        hourElement.className = "hour-item";

        const timeElement = document.createElement("div");
        timeElement.className = "hour-time";
        timeElement.textContent = `${hourIndex}:00`;

        const iconElement = document.createElement("img");
        iconElement.className = "hour-icon";
        iconElement.src = getWeatherIconUrl(hour.icon);
        iconElement.alt = hour.conditions;

        const tempElement = document.createElement("div");
        tempElement.className = "hour-temp";
        tempElement.textContent = `${Math.round(hour.temp)}${tempUnit}`;

        hourElement.appendChild(timeElement);
        hourElement.appendChild(iconElement);
        hourElement.appendChild(tempElement);
        carouselElement.appendChild(hourElement);
      }
    }
  }
}

/**
 * Returns the URL of the weather icon based on the given icon code.
 * @param {string} iconCode - The weather condition icon code.
 * @returns {string} The URL of the corresponding weather icon.
 */
function getWeatherIconUrl(iconCode) {
  const iconMap = {
    "clear-day": "https://cdn-icons-png.flaticon.com/512/6974/6974833.png",
    "clear-night": "https://cdn-icons-png.flaticon.com/512/3222/3222800.png",
    "partly-cloudy-day":
      "https://cdn-icons-png.flaticon.com/512/1146/1146869.png",
    "partly-cloudy-night":
      "https://cdn-icons-png.flaticon.com/512/7774/7774408.png",
    cloudy: "https://cdn-icons-png.flaticon.com/512/414/414927.png",
    rain: "https://cdn-icons-png.flaticon.com/512/3351/3351979.png",
    "showers-day": "https://cdn-icons-png.flaticon.com/512/3076/3076129.png",
    "showers-night": "https://cdn-icons-png.flaticon.com/512/3076/3076129.png",
    fog: "https://cdn-icons-png.flaticon.com/512/4005/4005901.png",
    snow: "https://cdn-icons-png.flaticon.com/512/642/642102.png",
    wind: "https://cdn-icons-png.flaticon.com/512/2011/2011448.png",
    thunderstorm: "https://cdn-icons-png.flaticon.com/512/3104/3104611.png",
  };

  return (
    iconMap[iconCode] ||
    "https://cdn-icons-png.flaticon.com/512/1146/1146869.png"
  );
}

/**
 * Handles weather search form submission and updates the UI with weather data.
 * @returns {void}
 */
function setupWeatherSearchHandler() {
  const form = document.querySelector(".request-data-form");
  const submitButton = form.querySelector(".submit-btn");

  submitButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const location = form.querySelector("#location").value.trim();
    const units = form.querySelector("#celsius").checked
      ? "celsius"
      : "fahrenheit";

    const weatherData = await getWeatherData(location, units);
    console.log(weatherData);

    if (weatherData) {
      displayWeatherData(weatherData, units);
      moveSearchFormToHeader();
    }
  });
}

/**
 * Moves the weather search form to the header after the first search.
 * @returns {void}
 */
function moveSearchFormToHeader() {
  const header = document.querySelector("header");
  header.classList.add("header-with-form");
  const form = document.querySelector(".request-data-form");
  form.classList.add("form-in-header");
  const submitButton = form.querySelector(".submit-btn");
  submitButton.classList.add("header-submit");
  const firstRow = form.querySelector(".first-row");
  const locationInput = form.querySelector("#location");
  locationInput.value = "";

  firstRow.appendChild(submitButton);
  header.appendChild(form);
}

/**
 * Adds keyboard accessibility to radio button segments, allowing selection
 * using the Enter or Space keys.
 * @returns {void}
 */
function makeSegmentRespondToKeyboard() {
  document.querySelectorAll(".segment-label").forEach((label) => {
    label.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const radioButton = document.querySelector(`#${label.htmlFor}`);
        radioButton.click();
      }
    });
  });
}

/**
 * Sets up event listeners for the weather search form and the keyboard accessibility for radio buttons.
 * @returns {void}
 */
function setupEventListeners() {
  setupWeatherSearchHandler();
  makeSegmentRespondToKeyboard();
}

setupEventListeners();
