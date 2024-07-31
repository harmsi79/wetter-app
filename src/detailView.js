import { rootElement } from "../main";
import {
  formatHourlyTime,
  formatTemperature,
  formatToMilitaryTime,
  get24HoursForecastFromNow,
  getDayOfWeek,
} from "./utils";
import {
  getCurrentWeather,
  getFavoriteCities,
  getForecastWeather,
  saveCityAsFavorite,
} from "./api";
import { renderLoadingScreen } from "./loading";
import { loadMainMenu } from "./mainMenu";
import { getConditionImagePath } from "./conditions";

export async function loadDetailView(cityName, cityId) {
  renderLoadingScreen("Lade Wetter für " + cityName + "...");
  const weatherData = await getForecastWeather(cityId);
  renderDetailView(weatherData, cityId);
  registerEventListeners(cityId);
}

export function renderDetailView(weatherData, cityId) {
  const { location, current, forecast } = weatherData;
  const currentDay = forecast.forecastday[0];

  const isFavorite = getFavoriteCities().find((city) => city === cityId);

  const conditionImage = getConditionImagePath(
    current.condition.code,
    current.is_day !== 1
  );

  if (conditionImage) {
    rootElement.style = `--detail-condition-image: url(${conditionImage})`;
    rootElement.classList.add("show-background");
  }

  rootElement.innerHTML =
    getActionBarHtml(!isFavorite) +
    getHeaderHtml(
      location.name,
      formatTemperature(current.temp_c),
      current.condition.text,
      formatTemperature(currentDay.day.maxtemp_c),
      formatTemperature(currentDay.day.mintemp_c)
    ) +
    getTodayForecastHtml(
      currentDay.day.condition.text,
      currentDay.day.maxwind_kph,
      forecast.forecastday,
      current.last_updated_epoch
    ) +
    getForecastHtml(forecast.forecastday) +
    getMiniStatsHtml(
      current.humidity,
      current.feelslike_c,
      currentDay.astro.sunrise,
      currentDay.astro.sunset,
      current.precip_mm,
      current.uv
    );
}

function getActionBarHtml(showFavoritesButton = true) {
  const backIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
    </svg>
  `;

  const favoriteIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  `;

  return `
  <div class="action-bar">
    <div class="action-bar__back">${backIcon}</div>
    ${
      showFavoritesButton
        ? `<div class="action-bar__favorite">${favoriteIcon}</div>`
        : ""
    }
  </div>
  `;
}

function getHeaderHtml(location, currentTemp, condition, maxTemp, minTemp) {
  return `
    <div class="current-weather">
        <h2 class="current-weather__location">${location}</h2>
        <h1 class="current-weather__current-temperature">${currentTemp}°</h1>
        <p class="current-weather__condition">${condition}</p>
        <div class="current-weather__day-temperatures">
            <span class="current-weather__max-temperature">H:${maxTemp}°</span>
            <span class="current-weather__min-temperature">T:${minTemp}°</span>
        </div>
    </div> 
    `;
}

function getTodayForecastHtml(
  condition,
  maxWind,
  forecastdays,
  lastUpdatedEpoch
) {
  const hourlyForecastElements = get24HoursForecastFromNow(
    forecastdays,
    lastUpdatedEpoch
  )
    .filter((el) => el !== undefined)
    .map(
      (hour, i) => `
        <div class="hourly-forecast">    
            <div class="hourly-forecast__time">${
              i === 0 ? "Jetzt" : formatHourlyTime(hour.time) + " Uhr"
            }</div>
            <img src="https:${
              hour.condition.icon
            }" class="hourly-forecast__icon"/>
            <div class="hourly-forecast__temperature">${formatTemperature(
              hour.temp_c
            )}°</div>
        </div>
    `
    );

  const hourlyForecastHtml = hourlyForecastElements.join("");

  return `
    <div class="today-forecast">
      <div class="today-forecast__conditions">
        Heute ${condition}. Wind bis zu ${maxWind} km/h.
      </div>
      <div class="today-forecast__hours">
          ${hourlyForecastHtml}
      </div>
    </div>
    `;
}

function getForecastHtml(forecast) {
  const forecastElements = forecast.map(
    (forecastDay, i) => `
      <div class="forecast-day">
        <div class="forecast-day__day">${
          i === 0 ? "Heute" : getDayOfWeek(forecastDay.date)
        }</div>
        <img src="https:${
          forecastDay.day.condition.icon
        }" class="forecast-day__icon"/>
        <div class="forecast-day__max-temp">H:${formatTemperature(
          forecastDay.day.maxtemp_c
        )}°</div>
        <div class="forecast-day__min-temp">T:${formatTemperature(
          forecastDay.day.mintemp_c
        )}°</div>
        <div class="forecast-day__wind">Wind: ${
          forecastDay.day.maxwind_kph
        } km/h</div>
      </div>
  `
  );

  const forecastHtml = forecastElements.join("");
  return `
    <div class="forecast">
      <div class="forecast__title">Vorhersage für die nächsten 3 Tage:</div>
      <div class="forecast__days">
        ${forecastHtml}
      </div>
    </div>
  `;
}

function getMiniStatsHtml(
  humidity,
  feelsLike,
  sunrise,
  sunset,
  precip,
  uvIndex
) {
  return `
    <div class="mini-stats">
      <div class="mini-stat">
        <div class="mini-stat__heading">Feuchtigkeit</div>
        <div class="mini-stat__value">${humidity}%</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__heading">Gefühlt</div>
        <div class="mini-stat__value">${feelsLike}°</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__heading">Sonnenaufgang</div>
        <div class="mini-stat__value">${formatToMilitaryTime(sunrise)} Uhr</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__heading">Sonnenuntergang</div>
        <div class="mini-stat__value">${formatToMilitaryTime(sunset)} Uhr</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__heading">Niederschlag</div>
        <div class="mini-stat__value">${precip}mm</div>
      </div>
      <div class="mini-stat">
        <div class="mini-stat__heading">UV-Index</div>
        <div class="mini-stat__value">${uvIndex}</div>
      </div>
    </div>
  `;
}

function registerEventListeners(cityId) {
  const backButton = document.querySelector(".action-bar__back");

  backButton.addEventListener("click", (e) => {
    loadMainMenu();
  });

  const favoriteButton = document.querySelector(".action-bar__favorite");

  favoriteButton?.addEventListener("click", (e) => {
    saveCityAsFavorite(cityId);
    favoriteButton.remove();
  });
}
