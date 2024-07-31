import { rootElement } from "../main";

export function renderLoadingScreen(message = "Lade...") {
  rootElement.innerHTML = getLoadingHtml(message);
}

export function getLoadingHtml(message) {
  return `
    <div class="loading">
        <div class="loading__message">${message}</div>
        <div class="lds-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    </div>`;
}
