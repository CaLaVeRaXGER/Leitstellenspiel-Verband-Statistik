// ==UserScript==
// @name         LSS Verband Statistik Pro
// @namespace    https://leitstellenspiel-verband-statistik.pages.dev/
// @charset      UTF-8
// @version      9.6.2
// @description  Loader fuer LSS Verband Statistik Pro: laedt den Hauptcode von Cloudflare Pages.
// @author       Fabian (Capt.BobbyNash)
// @license      Proprietary - Personal Use Only
// @icon         https://i.ibb.co/KxvZNBTP/VS-Logo-PNG-Rund.png
// @match        https://www.leitstellenspiel.de/*
// @match        https://polizei.leitstellenspiel.de/*
// @run-at       document-idle
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_info
// @connect      leitstellenspiel-verband-statistik.pages.dev
// @connect      raw.githubusercontent.com
// @connect      github.com
// @connect      www.leitstellenspiel.de
// @connect      polizei.leitstellenspiel.de
// @connect      api.open-meteo.com
// @connect      geocoding-api.open-meteo.com
// @connect      api.zippopotam.us
// @connect      www.dwd.de
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://leitstellenspiel-verband-statistik.pages.dev/leitstellenspiel-verband-statistik-pro.user.js
// @downloadURL  https://leitstellenspiel-verband-statistik.pages.dev/leitstellenspiel-verband-statistik-pro.user.js
// ==/UserScript==

(function(){
  "use strict";

  const CORE_URL = "https://leitstellenspiel-verband-statistik.pages.dev/leitstellenspiel-verband-statistik-pro.core.js";
  const cacheKey = Math.floor(Date.now() / 600000);

  if (window.__lssVerbandStatistikProLoaderActive) return;
  window.__lssVerbandStatistikProLoaderActive = true;

  GM_xmlhttpRequest({
    method: "GET",
    url: `${CORE_URL}?_=${cacheKey}`,
    timeout: 30000,
    onload(response) {
      if (response.status < 200 || response.status >= 300) {
        console.error("[LSS Verband Statistik Pro] Core konnte nicht geladen werden:", response.status, CORE_URL);
        return;
      }

      try {
        new Function(`${response.responseText}\n//# sourceURL=${CORE_URL}`)();
      } catch (error) {
        console.error("[LSS Verband Statistik Pro] Core konnte nicht ausgefuehrt werden:", error);
      }
    },
    onerror(error) {
      console.error("[LSS Verband Statistik Pro] Core-Ladevorgang fehlgeschlagen:", error);
    },
    ontimeout() {
      console.error("[LSS Verband Statistik Pro] Core-Ladevorgang hat zu lange gedauert:", CORE_URL);
    }
  });
})();
