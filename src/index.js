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
    const data = await response.json();
    return data;
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

// /**
//  * Displays weather alerts if available.
//  * @param {WeatherData} weatherData - The weather data retrieved from the API.
//  */
// function displayAlerts(weatherData) {
//   const alertsElement = document.querySelector("#weather-alerts");
//   alertsElement.innerHTML = "";

//   if (weatherData.alerts && weatherData.alerts.length > 0) {
//     weatherData.alerts.forEach((alert) => {
//       const alertContainer = document.createElement("div");
//       alertContainer.className = "alert-item";

//       const alertTitleButton = document.createElement("button");
//       alertTitleButton.className = "alert-title-button";
//       const alertTitle = document.createElement("h4");
//       alertTitle.className = "alert-title";
//       alertTitle.textContent = alert.event || "Weather Alert";
//       const alertExpandIcon = document.createElement("img");
//       alertExpandIcon.className = "alert-expand-icon";

//       import(
//         /* webpackMode: "lazy-once" */ "../images/misc/expand-circle-right-brown.svg"
//       )
//         .then((module) => {
//           alertExpandIcon.src = module.default;
//         })
//         .catch((error) => {
//           console.error("Failed to load show description icon:", error);
//         });

//       alertTitleButton.appendChild(alertTitle);
//       alertTitleButton.appendChild(alertExpandIcon);

//       const alertDescription = document.createElement("p");
//       alertDescription.className = "alert-description";
//       alertDescription.classList.add("hidden");
//       alertDescription.textContent = alert.description || "";

//       alertTitleButton.addEventListener("click", () => {
//         toggleAlertDescription(alertDescription);
//       });

//       alertContainer.appendChild(alertTitleButton);
//       alertContainer.appendChild(alertDescription);

//       alertsElement.appendChild(alertContainer);
//     });
//   }
// }

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
      
      // Set default icon (closed state)
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
        iconElement.alt = hour.conditions || "Weather";
        getWeatherIcon(hour.icon).then(
          (iconPath) => (iconElement.src = iconPath)
        );

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
