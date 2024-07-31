const API_KEY = "7102c30e75ca43b1afa120749241805";
const API_BASE_URL = "https://api.weatherapi.com/v1";
const FAVORITE_CITIES_KEY = "favorite-cities";

export async function getCurrentWeather(location) {
  const response = await fetch(
    `${API_BASE_URL}/current.json?key=${API_KEY}&q=${location}&lang=de`
  );

  const weatherData = await response.json();

  return weatherData;
}

export async function getForecastWeather(locationId, days = 3) {
  // We always just fetch 3 days of forecast, because that's the free plan maximum.
  const response = await fetch(
    `${API_BASE_URL}/forecast.json?key=${API_KEY}&q=id:${locationId}&days=${days}&lang=de`
  );

  const weatherData = await response.json();

  return weatherData;
}

export async function searchLocation(q) {
  const response = await fetch(
    `${API_BASE_URL}/search.json?key=${API_KEY}&q=${q}&lang=de`
  );

  const searchResults = await response.json();

  return searchResults;
}

export function getFavoriteCities() {
  return JSON.parse(localStorage.getItem(FAVORITE_CITIES_KEY)) || [];
}

export function saveCityAsFavorite(cityId) {
  const favorites = getFavoriteCities();

  if (favorites.find((city) => city === cityId)) {
    alert(cityId + " wurde bereits den Favoriten hinzugefügt.");
    return;
  }

  favorites.push(cityId);

  localStorage.setItem(FAVORITE_CITIES_KEY, JSON.stringify(favorites));
}

export function removeCityFromFavorites(cityId) {
  const favorites = getFavoriteCities();

  const filteredFavorites = favorites.filter((city) => city !== cityId);

  localStorage.setItem(FAVORITE_CITIES_KEY, JSON.stringify(filteredFavorites));
}
