import "./styles.css";

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

function displayWeatherData(weatherData, units) {
  displayWeatherCard(weatherData, units);
  //todo: displayFortnightlyForecast(weatherData, units);
}

function displayWeatherCard(weatherData, units) {
  const weatherCard = document.querySelector(".weather-card");
  weatherCard.classList.remove("hidden");
  displayWeatherCardHeader(weatherData);
  displayAlerts(weatherData);
  displayCurrentConditions(weatherData, units);
  displayHourlyForecast(weatherData, units);
}

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
      await import(/* webpackMode: "eager" */ `../images/loading-circle.svg`)
    ).default;
  }
}

function displayCurrentConditions(weatherData, units) {
  const currentConditions = weatherData.currentConditions;

  const conditionsElement = document.querySelector("#weather-conditions");
  conditionsElement.textContent = currentConditions.conditions || "";

  const iconElement = document.querySelector("#weather-icon");
  getWeatherIcon(currentConditions.icon).then(
    (iconPath) => (iconElement.src = iconPath)
  );

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

(function attachSearchSubmissionEventListener() {
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
    }
  });
})();

(function makeSegmentRespondToKeyboard() {
  document.querySelectorAll(".segment-label").forEach((label) => {
    label.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        const radioButton = document.querySelector(`#${label.htmlFor}`);
        radioButton.click();
      }
    });
  });
})();
