export async function getCoordinates(city) {
  const url = `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
    city
  )}&format=json&limit=1`;

  const response = await fetch(url);

  const data = await response.json();

  const { lat, lon } = data[0];

  fetchWeather(lat, lon, city);
}

async function fetchWeather(lat, lon, city) {
  let latitude = lat;
  let longitude = lon;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`;

  const response = await fetch(url);

  const weatherData = await response.json();

  const weather = weatherData.current_weather;

  console.log(`City: ${city}`);
  console.log(`Temperature: ${weather.temperature}°C`);
  console.log(`Wind Speed: ${weather.windspeed} km/h`);
  console.log(`Wind Direction: ${weather.winddirection}°`);
  console.log(`Weather Code: ${weather.weathercode}`);
}
