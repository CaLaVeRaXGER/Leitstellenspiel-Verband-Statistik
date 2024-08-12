// ==UserScript==
// @name         Leitstellenspiel Verband Statistik Close BETA
// @namespace    http://tampermonkey.net/
// @version      2.0 Close BETA
// @description  Zeigt Statistiken des Verbandes im Leitstellenspiel als ausklappbares Menü an, mit hervorgehobenen Zahlen und strukturierter, einklappbarer Skript-Info, ohne das Menü zu schließen.
// @author       Fabian (Capt.BobbyNash)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://github.com/CaLaVeRaXGER/LSS-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20CLOSE%20BETA-1.00CloseBETA.user.js
// @downloadURL  https://github.com/CaLaVeRaXGER/LSS-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20CLOSE%20BETA-1.00CloseBETA.user.js
// ==/UserScript==

(function () {
    "use strict";

    // Funktion zum Abrufen der Verbandsinformationen
    function fetchAllianceInfo() {
        console.log("Abrufen der API-Daten...");
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/allianceinfo",
            onload: function (response) {
                console.log("API Antwort erhalten", response);
                if (response.status === 200) {
                    try {
                        const data = JSON.parse(response.responseText);
                        console.log("Geparste API-Daten:", data);
                        updateAllianceStatistics(data); // Statistiken aktualisieren
                    } catch (e) {
                        console.error("Fehler beim Parsen der API-Daten:", e);
                    }
                } else {
                    console.error("Fehler beim Abrufen der API-Daten: ", response.status);
                }
            },
            onerror: function () {
                console.error("Fehler beim Abrufen der API-Daten.");
            },
        });
    }

    // Funktion zum Aktualisieren der Verbandsstatistiken im Menü
    function updateAllianceStatistics(data) {
        if (!data) {
            console.error("Datenobjekt ist nicht definiert.");
            return;
        }

        const allianceName = data.name || "Unbekannt"; // Name des Verbands
        const allianceId = data.id || "#"; // ID des Verbands
        const totalCredits = data.credits_total || 0; // Gesamtverdiente Credits
        const currentCredits = data.credits_current || 0; // Aktuelle Credits (Verbandskasse)
        const totalMembers = data.user_count || 0; // Mitgliederanzahl
        const rank = data.rank || "Unbekannt";
        const totalMissions = data.missions_total || "Daten nicht verfügbar"; // Annahme: API liefert missions_total
        const creditsLast24h = data.credits_last_24h || "Daten nicht verfügbar"; // Annahme: API liefert credits_last_24h

        console.log("Aktualisierte Statistiken: ", {
            allianceName,
            totalCredits,
            currentCredits,
            totalMembers,
            rank,
            totalMissions,
            creditsLast24h,
        });

        // Überprüfen, ob das Dropdown-Menü bereits existiert
        let dropdownMenu = $("#alliance-statistics-menu");
        if (dropdownMenu.length === 0) {
            // Menüeintrag für die Statistiken erstellen
            const menuEntry = $('<li class="dropdown"></li>');

            // Link für das Dropdown-Menü
            const dropdownLink = $(
                '<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">Verband Statistiken <span class="caret"></span></a>'
            );

            // Dropdown-Menü-Container erstellen
            dropdownMenu = $('<ul id="alliance-statistics-menu" class="dropdown-menu" role="menu"></ul>').css({
                padding: "10px",
                minWidth: "400px", // Vergrößerte Breite auf 400px
                backgroundColor: "#000000", // Schwarzer Hintergrund
                boxShadow: "0 0 10px rgba(0, 0, 0, 0.5)",
                color: "white", // Weiße Schrift
                wordWrap: "break-word", // Textumbruch
            });

            // Überschrift für die Statistik
            dropdownMenu.append(
                `<li><a href="#" style="color: white; text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline;">Verband Statistik</a></li>`
            );
            dropdownMenu.append(`<li class="divider"></li>`); // Trennlinie

            // Name des Verbands hinzufügen, mit Link zur Verbandsseite
            dropdownMenu.append(
                `<li><a href="https://www.leitstellenspiel.de/alliances/${allianceId}" style="color: white; font-size: 14px;"><strong>Verband:</strong> <span style="color: green;" class="alliance-name">${allianceName}</span></a></li>`
            );
            dropdownMenu.append(`<li class="divider"></li>`); // Trennlinie

            // Statistiken hinzufügen
            dropdownMenu.append(
                `<li><a href="#" style="color: white;"><strong>Gesamtverdiente Credits:</strong> <span style="color: green; font-weight: bold;" class="total-credits">${totalCredits.toLocaleString()}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" style="color: white;"><strong>Verbandskasse:</strong> <span style="color: green; font-weight: bold;" class="current-credits">${currentCredits.toLocaleString()}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" style="color: white;"><strong>Mitglieder:</strong> <span style="color: green; font-weight: bold;" class="total-members">${totalMembers}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" style="color: white;"><strong>Rang:</strong> <span style="color: green; font-weight: bold;" class="rank">${rank}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" style="color: white;"><strong>Gesamteinsätze:</strong> <span style="color: green; font-weight: bold;" class="total-missions">${totalMissions}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" style="color: white;"><strong>Credits in den letzten 24 Stunden:</strong> <span style="color: green; font-weight: bold;" class="credits-last-24h">${creditsLast24h}</span></a></li>`
            );

            // Trennlinie vor der Skript-Info
            dropdownMenu.append(`<li class="divider"></li>`);

            // Überschrift für die einklappbare Skript-Info
            dropdownMenu.append(
                `<li><a href="#" id="script-info-toggle" style="color: white; text-align: center; font-size: 16px; font-weight: bold; text-decoration: underline;">Skript Info</a></li>`
            );

            // Container für die Skript-Info (anfangs versteckt)
            const scriptInfoContainer = $('<div id="script-info-container"></div>').css({
                display: "none",
                marginTop: "10px",
            });

            scriptInfoContainer.append(`<li class="divider"></li>`); // Trennlinie innerhalb des Containers

            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">Ersteller: Fabian (Capt.BobbyNash)</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">Supporter: m75e</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">Version: 1.03 (Close BETA Version)</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">Funktionen des Skripts:</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">- Anzeige der Verband-Statistiken</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">- Übersicht über Credits, Mitglieder, Rang und Einsätze</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">- Anzeige der Credits der letzten 24 Stunden</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 12px;">- Automatische Aktualisierung der Statistiken alle 5 Sekunden</a></li>`
            );

            // Trennlinie nach der Skript-Info
            scriptInfoContainer.append(`<li class="divider"></li>`);

            // Neuer Menüpunkt für das Admin Panel innerhalb des Skript-Info-Containers
            scriptInfoContainer.append(
                `<li><a href="https://www.leitstellenspiel.de/admin" style="color: white;">Verbands Admin Panel</a></li>`
            );

            // Skript-Info-Container zum Dropdown-Menü hinzufügen
            dropdownMenu.append(scriptInfoContainer);

            // Klick-Event zum Ein- und Ausklappen der Skript-Info
            dropdownMenu.on("click", "#script-info-toggle", function (e) {
                e.preventDefault();
                scriptInfoContainer.slideToggle();
                // Verhindern, dass das Dropdown-Menü geschlossen wird
                return false;
            });

            // Menüeintrag zusammenfügen
            menuEntry.append(dropdownLink);
            menuEntry.append(dropdownMenu);

            // Menüeintrag zum Hauptmenü hinzufügen
            const navbar = $("#navbar-main-collapse .navbar-nav");
            if (navbar.length) {
                navbar.append(menuEntry);
                console.log("Menüeintrag hinzugefügt");
            } else {
                console.error("Navigationsleiste nicht gefunden");
            }
        } else {
            // Menü existiert bereits, nur die Statistiken aktualisieren
            console.log("Aktualisieren des vorhandenen Menüs...");
            $("#alliance-statistics-menu .alliance-name")
                .text(allianceName)
                .attr("href", `https://www.leitstellenspiel.de/alliances/${allianceId}`);
            $("#alliance-statistics-menu .total-credits").text(totalCredits.toLocaleString());
            $("#alliance-statistics-menu .current-credits").text(currentCredits.toLocaleString());
            $("#alliance-statistics-menu .total-members").text(totalMembers);
            $("#alliance-statistics-menu .rank").text(rank);
            $("#alliance-statistics-menu .total-missions").text(totalMissions);
            $("#alliance-statistics-menu .credits-last-24h").text(creditsLast24h);
        }
    }

    // Skript ausführen, wenn die Seite vollständig geladen ist
    $(document).ready(function () {
        console.log("Skript geladen und bereit");
        fetchAllianceInfo();

        // Automatische Echtzeit-Aktualisierung alle 5 Sekunden (5000 Millisekunden)
        setInterval(fetchAllianceInfo, 5000);
    });
})();
