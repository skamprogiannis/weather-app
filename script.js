function constructWeatherAPIUrl(
  location,
  startDate = null,
  endDate = null,
  units
) {
  const BASE_URL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/`;
  const API_KEY = "REMOVED";
  startDate = startDate || "today";
  endDate = endDate || "today";

  let unitGroup = "?unitGroup=";
  switch (units) {
    case "Celsius":
      unitGroup += "metric";
      break;
    case "Fahrenheit":
      unitGroup += "us";
      break;
    case "Kelvin":
      unitGroup += "base";
  }

  return (
    BASE_URL + `${location}/${startDate}/${endDate}${unitGroup}&key=${API_KEY}`
  );
}

async function getWeatherData(location, startDate, endDate, units) {
  try {
    const url = constructWeatherAPIUrl(location, startDate, endDate, units);
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

(function handleFormSubmit() {
  const form = document.querySelector(".request-data-form");
  const submitButton = document.querySelector(".submit-btn");

  submitButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const location = form.querySelector("#location").value.trim();
    const startDate = form.querySelector("#start-date").value;
    const endDate = form.querySelector("#end-date").value;
    const units = form.querySelector("#units").value;

    const weatherData = await getWeatherData(location, startDate, endDate, units);
    console.log(weatherData);
  });
})();
