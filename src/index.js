import "./styles.css";
import { inject as initAnalytics } from "@vercel/analytics"

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
 * Fetches weather data from the Vercel serverless endpoint.
 * Keeps the API key hidden from the client.
 * @param {string} location - The location to fetch weather data for (e.g., "New York, NY").
 * @param {"celsius"|"fahrenheit"} [units="celsius"] - The units for temperature.
 * @returns {Promise<WeatherData>} The weather data object returned by the serverless function.
 * @throws {Error} If the request fails or the server returns an error.
 */
async function fetchWeather(location, units = "celsius") {
  if (!location) throw new Error("Location is required to fetch weather data.");

  const queryParams = new URLSearchParams({ location, units });
  const url = `/api/weather?${queryParams.toString()}`;

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch weather data: ${response.status}`);
  }

  const data = await response.json();
  return data;
}



/**
 * Displays the weather data on the webpage.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 * @param {"celsius"|"fahrenheit"} units - The units for temperature.
 */
function displayWeatherData(weatherData, units) {
  displayWeatherCard(weatherData, units);
  displayFortnightlyForecast(weatherData, units);
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
 * Initializes toggle behavior for an alert <details> element and updates the expand/collapse icon
 * @param {HTMLDetailsElement} alertDetails - The <details> element wrapping the alert
 */
async function initAlertDetails(alertDetails) {
  const alertExpandIcon = alertDetails.querySelector(".alert-expand-icon");

  alertDetails.addEventListener("toggle", async () => {
    try {
      const iconModule = alertDetails.open
        ? await import(
            /* webpackMode: "lazy-once" */ "../images/misc/expand-circle-down-brown.svg"
          )
        : await import(
            /* webpackMode: "lazy-once" */ "../images/misc/expand-circle-right-brown.svg"
          );

      alertExpandIcon.src = iconModule.default;
    } catch (error) {
      console.error("Failed to load expand/collapse icon:", error);
    }
  });
}

/**
 * Displays weather alerts using <details> elements.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 */
function displayAlerts(weatherData) {
  const alertsElement = document.querySelector("#weather-alerts");
  alertsElement.innerHTML = "";

  if (weatherData.alerts && weatherData.alerts.length > 0) {
    weatherData.alerts.forEach((alert) => {
      const alertDetails = document.createElement("details");
      alertDetails.className = "alert-item";

      const alertSummary = document.createElement("summary");
      alertSummary.className = "alert-summary";

      const alertTitle = document.createElement("h4");
      alertTitle.className = "alert-title";
      alertTitle.textContent = alert.event || "Weather Alert";

      const alertExpandIcon = document.createElement("img");
      alertExpandIcon.className = "alert-expand-icon";
      

      import(/* webpackMode: "lazy-once" */ "../images/misc/expand-circle-right-brown.svg")
        .then((module) => {
          alertExpandIcon.src = module.default;
        })
        .catch((error) => {
          console.error("Failed to load default expand icon:", error);
        });

      alertSummary.appendChild(alertTitle);
      alertSummary.appendChild(alertExpandIcon);

      const alertDescription = document.createElement("div");
      alertDescription.className = "alert-description";
      alertDescription.textContent = alert.description || "";

      alertDetails.appendChild(alertSummary);
      alertDetails.appendChild(alertDescription);
      alertsElement.appendChild(alertDetails);
      initAlertDetails(alertDetails);
    });
  }
}

/**
 * Gets the appropriate weather icon for the given condition
 * @param {string} iconCode - Weather condition icon code from the API
 * @returns {Promise<string>} - Path to the icon
 */
async function getWeatherIcon(iconCode) {
  try {
    return (
      await import(
        /* webpackMode: "lazy-once" */ `../images/main/${iconCode}.svg`
      )
    ).default;
  } catch (error) {
    console.error(`Failed to load icon: ${iconCode}`, error);
    return (
      await import(
        /* webpackMode: "eager" */ `../images/misc/loading-circle.svg`
      )
    ).default;
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
  getWeatherIcon(currentConditions.icon).then(
    (iconPath) => (iconElement.src = iconPath)
  );
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
  const precipValue = currentConditions.precip || 0;
  precipElement.textContent = `${precipValue} ${precipUnit}`;
  const precipIcon = document.querySelector("#precip-icon");
  if (
    currentConditions.preciptype === "snow" ||
    currentConditions.preciptype === "ice"
  ) {
    import(
      /* webpackMode: "lazy-once" */ `../images/detail/precipitation-snow.svg`
    )
      .default.then((iconPath) => {
        precipIcon.src = iconPath;
      })
      .catch((error) => {
        console.error(
          "Failed to load precipitation icon: precipitation-snow",
          error
        );
      });
  }
  const feelsLikeElement = document.querySelector("#feels-like");
  feelsLikeElement.textContent = `${Math.round(
    currentConditions.feelslike
  )}${tempUnit}`;
}

/**
 * Displays the hourly weather forecast for the next 24 hours.
 * Optimized with DocumentFragment to minimize DOM reflows.
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
    const fragment = document.createDocumentFragment();

    for (let i = currentHour; i < currentHour + 24; i++) {
      const hourIndex = i % 24;
      const hour = today.hours[hourIndex];

      if (!hour) continue;

      const hourElement = document.createElement("div");
      hourElement.className = "hour-item";

      const timeElement = document.createElement("div");
      timeElement.className = "hour-time";
      timeElement.textContent = `${hourIndex}:00`;

      const iconElement = document.createElement("img");
      iconElement.className = "hour-icon";
      iconElement.alt = hour.conditions || "Weather";
      getWeatherIcon(hour.icon).then((iconPath) => {
        iconElement.src = iconPath;
      });

      const tempElement = document.createElement("div");
      tempElement.className = "hour-temp";
      tempElement.textContent = `${Math.round(hour.temp)}${tempUnit}`;

      hourElement.append(timeElement, iconElement, tempElement);
      fragment.appendChild(hourElement);
    }

    carouselElement.appendChild(fragment);
  }
}

/**
 * Displays the 14-day weather forecast.
 * Optimized with DocumentFragment to minimize DOM reflows.
 * @param {WeatherData} weatherData - The weather data retrieved from the API.
 * @param {"celsius"|"fahrenheit"} units - The units for temperature.
 */
function displayFortnightlyForecast(weatherData, units) {
  const forecastCard = document.querySelector(".forecast-card");
  forecastCard.classList.remove("hidden");

  const dailyForecastElement = document.querySelector("#daily-forecast");
  dailyForecastElement.innerHTML = "";

  const tempUnit = units === "celsius" ? "°C" : "°F";

  if (weatherData.days && weatherData.days.length > 1) {
    const daysToShow = weatherData.days.slice(1, 15);
    const fragment = document.createDocumentFragment();

    daysToShow.forEach(day => {
      const dayElement = document.createElement("div");
      dayElement.classList.add("forecast-day");

      const date = new Date(day.datetime).toLocaleDateString("en-us", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });

      const dateElement = document.createElement("div");
      dateElement.className = "forecast-day-date";
      dateElement.textContent = date;

      const iconElement = document.createElement("img");
      iconElement.className = "forecast-day-icon";
      iconElement.alt = day.conditions || "Weather";
      getWeatherIcon(day.icon).then(iconPath => {
        iconElement.src = iconPath;
      });

      const tempElement = document.createElement("div");
      tempElement.className = "forecast-day-temp";

      const maxTempElement = document.createElement("div");
      maxTempElement.className = "forecast-day-max";
      maxTempElement.textContent = `${Math.round(day.tempmax)}${tempUnit}`;

      const minTempElement = document.createElement("div");
      minTempElement.className = "forecast-day-min";
      minTempElement.textContent = `${Math.round(day.tempmin)}${tempUnit}`;

      tempElement.append(maxTempElement, minTempElement);

      dayElement.append(dateElement, iconElement, tempElement);
      fragment.appendChild(dayElement);
    });

    dailyForecastElement.appendChild(fragment);
  }
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

    const weatherData = await fetchWeather(location, units);
    
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
initAnalytics();