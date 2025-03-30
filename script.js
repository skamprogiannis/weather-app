function constructWeatherAPIUrl(location, units) {
  const BASE_URL = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/`;
  const API_KEY = "REMOVED";

  let unitGroup = "?unitGroup=";
  if (units === "Celsius") {
    unitGroup += "metric";
  } else {
    unitGroup += "us"
  }

  return (
    BASE_URL + `${location}${unitGroup}&key=${API_KEY}`
  );
}

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

(function handleFormSubmit() {
  const form = document.querySelector(".request-data-form");
  const submitButton = document.querySelector(".submit-btn");

  submitButton.addEventListener("click", async (event) => {
    event.preventDefault();
    const location = form.querySelector("#location").value.trim();
    const units = form.querySelector("#units").value;

    const weatherData = await getWeatherData(location, units);
    console.log(weatherData);
  });
})();
