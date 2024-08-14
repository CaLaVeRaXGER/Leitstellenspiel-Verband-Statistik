// ==UserScript==
// @name         Leitstellenspiel Verband Statistik Close BETA
// @namespace    http://tampermonkey.net/
// @version      2.2.9 Close BETA
// @description  Zeigt Statistiken des Verbandes im Leitstellenspiel als ausklappbares Menü an, mit hervorgehobenen Zahlen und strukturierter, einklappbarer Skript-Info, ohne das Menü zu schließen.
// @author       Fabian (Capt.BobbyNash)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// @downloadURL  https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// ==/UserScript==

(function () {
    "use strict";

    const currentVersion = "2.2.9"; // Aktuelle Version des Skripts

    // Stil für das neue Design hinzufügen
    GM_addStyle(`
        #alliance-statistics-menu {
            padding: 8px;
            min-width: 450px; /* Kleineres Layout */
            background-color: #2c3e50;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
            color: white;
            word-wrap: break-word;
            border-radius: 8px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; /* Professionelle Schriftart */
        }
        #alliance-statistics-menu a {
            color: #ecf0f1;
            text-decoration: none;
            font-size: 14px; /* Kleinere Schrift */
        }
        #alliance-statistics-menu a:hover {
            color: #3498db;
        }
        #alliance-statistics-menu .divider {
            border-bottom: 1px solid #7f8c8d;
            margin: 4px 0; /* Weniger Abstand zwischen den Elementen */
        }
        #alliance-statistics-menu li {
            margin-bottom: 2px;
            list-style-type: none;
        }
        #script-info-container {
            background: rgba(0, 0, 0, 0.5);
            padding: 8px;
            border-radius: 5px;
            position: relative;
        }
        #script-info-container::after {
            content: '© 2024 Fabian (Capt.BobbyNash)';
            font-size: 10px;
            color: #7f8c8d;
            position: absolute;
            bottom: 5px;
            right: 10px;
        }
        #alliance-statistics-logo {
            position: absolute;
            bottom: 25px;
            right: 10px;
            opacity: 0.2;
            height: 80px;
        }
        #header-container {
            text-align: center;
            position: relative;
        }
        #header-logo-left, #header-logo-right {
            height: 45px; /* Kleinere Logos */
            vertical-align: middle;
        }
        #header-logo-left {
            margin-right: 8px;
        }
        #header-logo-right {
            margin-left: 8px;
        }
        #header-title {
            display: inline-block;
            font-size: 20px;
            font-weight: bold;
            color: white;
            text-decoration: underline;
            pointer-events: none; /* Keine Interaktion möglich */
            vertical-align: middle;
        }
        #script-info-toggle::after, #team-info-toggle::after {
            content: '\\25BC'; /* Caret Symbol */
            margin-left: 5px;
            font-size: 11px; /* Größe des Caret-Symbols */
        }
        #script-info-toggle.caret-up::after, #team-info-toggle.caret-up::after {
            content: '\\25B2'; /* Caret nach oben */
        }
        #alliance-team-box strong {
            font-size: 12px;
            color: #ecf0f1;
        }

        /* Verkleinerte Schrift und Zahlen für die Statistiken */
        .alliance-statistics-item {
            font-size: 17px; /* Verkleinerte Schriftgröße */
            font-weight: bold;
        }
        .alliance-statistics-value {
            font-size: 17px; /* Verkleinerte Schriftgröße */
            color: #2ecc71; /* Helles Grün */
            font-weight: bold;
        }
        #dropdown-arrow {
            font-size: 11px; /* Pfeilgröße */
            color: white;
            vertical-align: middle;
            margin-left: 5px;
        }
        #update-notification {
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #3498db;
            color: white;
            padding: 10px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
            z-index: 10000;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
    `);

    let currentAllianceId = null;

    // Funktion zur Benachrichtigung über ein Update
    function notifyUpdate(newVersion) {
        const notificationHtml = `
            <div id="update-notification">
                Das Skript wurde auf Version ${newVersion} aktualisiert.
            </div>
        `;
        $("body").append(notificationHtml);
    }

    // Funktion zum Überprüfen auf Updates und automatisches Ausführen des Updates
    function checkForUpdate() {
        GM_xmlhttpRequest({
            method: "GET",
            url: GM_info.scriptUpdateURL,
            onload: function (response) {
                const remoteScript = response.responseText;
                const remoteVersionMatch = remoteScript.match(/@version\s+([\d.]+)/);
                if (remoteVersionMatch) {
                    const remoteVersion = remoteVersionMatch[1];
                    if (remoteVersion !== currentVersion) {
                        GM_xmlhttpRequest({
                            method: "GET",
                            url: GM_info.downloadURL,
                            onload: function () {
                                notifyUpdate(remoteVersion);
                                eval(response.responseText); // Führt den aktualisierten Code aus
                            },
                        });
                    }
                }
            },
        });
    }

    // Funktion zum Abrufen der Verbandsinformationen
    function fetchAllianceInfo() {
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://www.leitstellenspiel.de/api/allianceinfo",
            onload: function (response) {
                if (response.status === 200) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data && data.id !== currentAllianceId) {
                            currentAllianceId = data.id;
                            updateAllianceStatistics(data);
                            updateAllianceTeam(data.users);
                        } else if (!data || !data.id) {
                            currentAllianceId = null;
                            displayNoDataAvailable();
                            clearAllianceTeam();
                        } else {
                            updateAllianceStatistics(data);
                            updateAllianceTeam(data.users);
                        }
                    } catch (e) {
                        console.error("Fehler beim Parsen der API-Daten:", e);
                        displayNoDataAvailable();
                        clearAllianceTeam();
                    }
                } else {
                    console.error("Fehler beim Abrufen der API-Daten: ", response.status);
                    displayNoDataAvailable();
                    clearAllianceTeam();
                }
            },
            onerror: function () {
                console.error("Fehler beim Abrufen der API-Daten.");
                displayNoDataAvailable();
                clearAllianceTeam();
            },
        });
    }

    // Funktion zum Anzeigen von "Keine Daten Verfügbar"
    function displayNoDataAvailable() {
        let dropdownMenu = $("#alliance-statistics-menu");
        if (dropdownMenu.length > 0) {
            dropdownMenu.find(".alliance-name").text("Keine Daten Verfügbar");
            dropdownMenu.find(".total-credits").text("Keine Daten");
            dropdownMenu.find(".current-credits").text("Keine Daten");
            dropdownMenu.find(".total-members").text("Keine Daten");
            dropdownMenu.find(".rank").text("Keine Daten");
        } else {
            console.error("Statistikmenü nicht gefunden.");
        }
    }

    // Funktion zum Leeren der Team-Box bei Austritt aus dem Verband
    function clearAllianceTeam() {
        let teamBox = $("#alliance-team-box");
        if (teamBox.length > 0) {
            teamBox.empty();
        }
    }

    // Funktion zum Aktualisieren der Verbandsstatistiken im Menü
    function updateAllianceStatistics(data) {
        if (!data) {
            console.error("Datenobjekt ist nicht definiert.");
            displayNoDataAvailable();
            return;
        }

        const allianceName = data.name || "Unbekannt";
        const allianceId = data.id || "#";
        const totalCredits = data.credits_total || 0;
        const currentCredits = data.credits_current || 0;
        const totalMembers = data.user_count || 0;
        const rank = data.rank || "Unbekannt";

        let dropdownMenu = $("#alliance-statistics-menu");
        if (dropdownMenu.length === 0) {
            const menuEntry = $('<li class="dropdown"></li>');
            const dropdownLink = $(
                `<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-expanded="false">
                    <img id="header-logo" src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="Logo" style="height: 20px; width: 35px; vertical-align: middle;">
                    <span id="dropdown-arrow">&#9660;</span>
                </a>`
            );

            dropdownMenu = $('<ul id="alliance-statistics-menu" class="dropdown-menu" role="menu"></ul>');

            // Überschrift mit Logos links und rechts
            dropdownMenu.append(
                `<li id="header-container">
                    <img id="header-logo-left" src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="Logo">
                    <span id="header-title">Verband Statistik</span>
                    <img id="header-logo-right" src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="Logo">
                </li>`
            );
            dropdownMenu.append(`<li class="divider"></li>`);

            // Verbandsname und Link
            dropdownMenu.append(
                `<li><a href="https://www.leitstellenspiel.de/alliances/${allianceId}" class="alliance-statistics-item">
                    <strong>Verband:</strong> <span class="alliance-statistics-value alliance-name">${allianceName}</span></a></li>`
            );
            dropdownMenu.append(`<li class="divider"></li>`);

            // Statistiken hinzufügen
            dropdownMenu.append(
                `<li><a href="#" class="alliance-statistics-item"><strong>Gesamtverdiente Credits:</strong>
                    <span class="alliance-statistics-value total-credits">
                    ${totalCredits.toLocaleString()}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" class="alliance-statistics-item"><strong>Verbandskasse:</strong>
                    <span class="alliance-statistics-value current-credits">
                    ${currentCredits.toLocaleString()}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" class="alliance-statistics-item"><strong>Mitglieder:</strong>
                    <span class="alliance-statistics-value total-members">
                    ${totalMembers}</span></a></li>`
            );
            dropdownMenu.append(
                `<li><a href="#" class="alliance-statistics-item"><strong>Rang:</strong>
                    <span class="alliance-statistics-value rank">
                    ${rank}</span></a></li>`
            );

            dropdownMenu.append(`<li class="divider"></li>`);

            // Verbands-Team, das sich ausklappen lässt
            dropdownMenu.append(
                `<li><a href="#" id="team-info-toggle" style="color: white; text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline;">
                    Verbands-Team <span id="team-caret" class="caret"></span></a></li>`
            );

            // Container für das Verbands-Team (anfangs versteckt)
            const teamInfoContainer = $('<div id="team-info-container"></div>').css({
                display: "none",
                marginTop: "8px",
            });

            teamInfoContainer.append(`<ul id="alliance-team-box" style="list-style-type:none; padding-left: 0;"></ul>`);

            dropdownMenu.append(teamInfoContainer);

            // Trennlinie vor der Skript-Info
            dropdownMenu.append(`<li class="divider"></li>`);

            // Überschrift für die einklappbare Skript-Info
            dropdownMenu.append(
                `<li><a href="#" id="script-info-toggle" style="color: white; text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline;">
                    Skript Info <span id="script-caret" class="caret"></span></a></li>`
            );

            // Container für die Skript-Info (anfangs versteckt)
            const scriptInfoContainer = $('<div id="script-info-container"></div>').css({
                display: "none",
                marginTop: "8px",
                position: "relative",
            });

            scriptInfoContainer.append(`<li class="divider"></li>`);

            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">Ersteller: Fabian (Capt.BobbyNash)</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">Supporter: m75e, twoyears</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">Version: 2.2.9 (Close BETA)</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">Funktionen des Skripts:</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">- Anzeige der Gesamtverdienten Credits des Verbandes</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">- Anzeige der aktuellen Verbandskasse</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">- Anzeige der Gesamtanzahl der Mitglieder</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">- Anzeige des aktuellen Rangs des Verbandes</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">- Ausklappbare Übersicht der Verbands-Teaminformationen</a></li>`
            );
            scriptInfoContainer.append(
                `<li><a href="#" style="color: white; font-size: 10px;">- Automatische Echtzeit-Aktualisierung der Statistiken alle 1 Sekunde</a></li>`
            );

            // Wasserzeichen Logo in der Skript-Info
            scriptInfoContainer.append(
                `<img id="alliance-statistics-logo" src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="Wasserzeichen">`
            );

            dropdownMenu.append(scriptInfoContainer);

            // Klick-Event zum Ein- und Ausklappen der Skript-Info
            dropdownMenu.on("click", "#script-info-toggle", function (e) {
                e.preventDefault();
                const caret = $("#script-caret");
                scriptInfoContainer.slideToggle(function () {
                    caret.toggleClass("caret caret-up");
                });
                return false;
            });

            // Klick-Event zum Ein- und Ausklappen der Team-Info
            dropdownMenu.on("click", "#team-info-toggle", function (e) {
                e.preventDefault();
                const caret = $("#team-caret");
                teamInfoContainer.slideToggle(function () {
                    caret.toggleClass("caret caret-up");
                });
                return false;
            });

            menuEntry.append(dropdownLink);
            menuEntry.append(dropdownMenu);

            const navbar = $("#navbar-main-collapse .navbar-nav");
            if (navbar.length) {
                navbar.append(menuEntry);
            } else {
                console.error("Navigationsleiste nicht gefunden");
            }
        } else {
            $("#alliance-statistics-menu .alliance-name")
                .text(allianceName)
                .attr("href", `https://www.leitstellenspiel.de/alliances/${allianceId}`);
            $("#alliance-statistics-menu .total-credits").text(totalCredits.toLocaleString());
            $("#alliance-statistics-menu .current-credits").text(currentCredits.toLocaleString());
            $("#alliance-statistics-menu .total-members").text(totalMembers);
            $("#alliance-statistics-menu .rank").text(rank);
        }
    }

    // Funktion zum Aktualisieren der Verbands-Teaminformationen im Menü
    function updateAllianceTeam(users) {
        const teamBox = $("#alliance-team-box");

        if (teamBox.length === 0) {
            console.error("Team-Box nicht gefunden.");
            return;
        }

        teamBox.empty();

        // Funktion, um einen Link zum Profil zu erstellen
        function createProfileLink(user) {
            return `<a href="https://www.leitstellenspiel.de/profile/${user.id}" style="color: white;" target="_blank">${user.name}</a>`;
        }

        const owner = users.filter(user => user.role_flags.owner).map(createProfileLink);
        const admins = users.filter(user => user.role_flags.admin).map(createProfileLink);
        const coAdmins = users.filter(user => user.role_flags.coadmin).map(createProfileLink);

        if (owner.length > 0) {
            teamBox.append(`<li style="margin-bottom: 5px;"><strong>Eigentümer:</strong><ul style="list-style-type:none; padding-left: 15px;">${owner.map(user => `<li>${user}</li>`).join("")}</ul></li>`);
        }
        if (admins.length > 0) {
            teamBox.append(`<li style="margin-bottom: 5px;"><strong>Admins:</strong><ul style="list-style-type:none; padding-left: 15px;">${admins.map(user => `<li>${user}</li>`).join("")}</ul></li>`);
        }
        if (coAdmins.length > 0) {
            teamBox.append(`<li style="margin-bottom: 5px;"><strong>Co-Admins:</strong><ul style="list-style-type:none; padding-left: 15px;">${coAdmins.map(user => `<li>${user}</li>`).join("")}</ul></li>`);
        }
    }

    $(document).ready(function () {
        fetchAllianceInfo();
        setInterval(fetchAllianceInfo, 1000); // Echtzeit-Aktualisierung alle 1 Sekunde
        setInterval(updateAllianceTeam, 600000); // Team-Update alle 10 Minuten
        checkForUpdate(); // Überprüfen auf Updates beim Start
    });
})();
