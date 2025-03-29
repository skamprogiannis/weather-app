const API_KEY = "REMOVED";

async function getTemperature (location) {
  const data = await fetch(`https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${location}?key=${API_KEY}`);
  console.log(data);
}

getTemperature("Athens");