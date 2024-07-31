import { rootElement } from "../main";
import {
  getForecastWeather,
  getFavoriteCities,
  searchLocation,
  removeCityFromFavorites,
} from "./api";
import { getConditionImagePath } from "./conditions";
import { loadDetailView, renderDetailView } from "./detailView";
import { getLoadingHtml, renderLoadingScreen } from "./loading";
import { debounce, formatLocalTime, formatTemperature } from "./utils";

export async function loadMainMenu() {
  rootElement.classList.remove("show-background");
  renderLoadingScreen("Lade Übersicht...");

  renderMainMenu();
}

export async function renderMainMenu() {
  rootElement.innerHTML = `
        <div class="main-menu">
            ${getMenuHeaderHtml()}
            ${await getCityListHtml()}
        </div>
    `;

  registerEventListeners();
}

function getMenuHeaderHtml() {
  return `
    <div class="main-menu__heading">Wetter <button class="main-menu__edit">Bearbeiten</button></div>
    <div class="main-menu__search-bar">
        <input
            type="text"
            class="main-menu__search-input"
            placeholder="Nach Stadt suchen..."
        />
        <div class="main-menu__search-results"></div>
    </div>
    `;
}

const deleteIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>

`;

async function getCityListHtml() {
  const favoriteCities = getFavoriteCities();

  if (!favoriteCities || favoriteCities.length < 1) {
    return "Noch keine Favoriten gespeichert.";
  }

  const favoriteCitiesElements = [];

  for (let city of favoriteCities) {
    const weatherData = await getForecastWeather(city, 1);

    const { location, current, forecast } = weatherData;
    const forecastDay = forecast.forecastday[0].day;

    const conditionImage = getConditionImagePath(
      current.condition.code,
      current.is_day !== 1
    );

    const cityHtml = `
        <div class="city-wrapper">
            <div class="city-wrapper__delete" data-city-id="${city}">${deleteIcon}</div>
            <div class="city" data-city-name="${
              location.name
            }" data-city-id="${city}"${
      conditionImage ? `style="--condition-image: url(${conditionImage})"` : ""
    }>
                <div class="city__left-column">
                    <h2 class="city__name">${location.name}</h2>
                    <div class="city__country">${location.country}</div>
                    <div class="city__condition">${current.condition.text}</div>
                </div>
                <div class="city__right-column">
                    <div class="city__temperature">${formatTemperature(
                      current.temp_c
                    )}°</div>
                    <div class="city__min-max-temperature">H:${formatTemperature(
                      forecastDay.maxtemp_c
                    )}° T:${formatTemperature(forecastDay.mintemp_c)}°</div>
                </div>
            </div>
        </div>
    `;

    favoriteCitiesElements.push(cityHtml);
  }

  const favoriteCitiesHtml = favoriteCitiesElements.join("");

  return `
    <div class="main-menu__cities-list">
       ${favoriteCitiesHtml}
    </div>
    `;
}

function renderSearchResults(searchResults) {
  const searchResultsElements = searchResults.map(
    (result) =>
      `
        <div class="search-result" data-city-id="${result.id}" data-city-name="${result.name}" tabindex="0">
            <h3 class="search-result__name">${result.name}</h3>
            <p class="search-result__country">${result.country}</p>
        </div>
    `
  );

  const searchResultsHtml = searchResultsElements.join("");

  const searchResultsDiv = document.querySelector(".main-menu__search-results");
  searchResultsDiv.innerHTML = searchResultsHtml;
}

function renderSearchResultsLoading() {
  const searchResultsDiv = document.querySelector(".main-menu__search-results");
  searchResultsDiv.innerHTML = `<div class="search-result">Lade Vorschläge...</div>`;
}

function registerSearchResultsEventListeners() {
  const searchResults = document.querySelectorAll(".search-result");

  searchResults.forEach((searchResult) => {
    searchResult.addEventListener("click", (e) => {
      const cityName = searchResult.getAttribute("data-city-name");
      const cityId = searchResult.getAttribute("data-city-id");

      loadDetailView(cityName, cityId);
    });
  });
}

function bodyClickHandler(e) {
  const searchWrapper = document.querySelector(".main-menu__search-bar");
  if (!searchWrapper) {
    document.removeEventListener("click", bodyClickHandler);
    return;
  }

  if (!searchWrapper.contains(e.target)) {
    const searchResults = document.querySelector(".main-menu__search-results");
    searchResults.classList.add("main-menu__search-results--hidden");
  }
}

function registerEventListeners() {
  document.removeEventListener("click", bodyClickHandler);

  const editButton = document.querySelector(".main-menu__edit");
  const deleteButtons = document.querySelectorAll(".city-wrapper__delete");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      removeCityFromFavorites(btn.getAttribute("data-city-id"));
      btn.parentElement.remove();
    });
  });

  editButton.addEventListener("click", (e) => {
    const EDIT_ATTRIBUTE = "data-edit-mode";

    if (!editButton.getAttribute(EDIT_ATTRIBUTE)) {
      editButton.setAttribute(EDIT_ATTRIBUTE, "true");
      editButton.textContent = "Fertig";

      deleteButtons.forEach((btn) => {
        btn.classList.add("city-wrapper__delete--show");
      });
    } else {
      editButton.removeAttribute(EDIT_ATTRIBUTE);
      editButton.textContent = "Bearbeiten";

      deleteButtons.forEach((btn) => {
        btn.classList.remove("city-wrapper__delete--show");
      });
    }
  });

  const searchBar = document.querySelector(".main-menu__search-input");

  searchBar.addEventListener(
    "input",
    debounce(async (e) => {
      const q = e.target.value;

      let searchResults = [];

      if (q.length > 1) {
        renderSearchResultsLoading();
        searchResults = await searchLocation(q);
      }

      renderSearchResults(searchResults);
      registerSearchResultsEventListeners();
    }, 500)
  );

  document.addEventListener("click", bodyClickHandler);

  searchBar.addEventListener("focusin", (e) => {
    const searchResults = document.querySelector(".main-menu__search-results");
    searchResults.classList.remove("main-menu__search-results--hidden");
  });

  const cities = document.querySelectorAll(".city");

  cities.forEach((city) => {
    city.addEventListener("click", (e) => {
      const cityId = city.getAttribute("data-city-id");
      const cityName = city.getAttribute("data-city-name");

      loadDetailView(cityName, cityId);
    });
  });
}
