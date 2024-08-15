// ==UserScript==
// @name         Leitstellenspiel Verband Statistik Close BETA
// @namespace    http://tampermonkey.net/
// @version      3.0.7
// @description  Zeigt Statistiken des Verbandes im Leitstellenspiel als ausklappbares Menü an, inklusive eines Spielzeit-Timers und der Berechnung des Gesamttagesverdiensts, der täglich um 0:00 Uhr zurückgesetzt wird.
// @author       Fabian (Capt.BobbyNash)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_notification
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://github.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// @downloadURL  https://github.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// ==/UserScript==

(function () {
    "use strict";

    const currentVersion = "3.0.7"; // Aktuelle Version des Skripts
    const updateUrl = "https://github.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js";

    // Stil für das neue Design hinzufügen
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap');

        #alliance-statistics-menu {
            padding: 8px;
            min-width: 450px;
            background-color: #2c3e50;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
            color: white;
            word-wrap: break-word;
            border-radius: 8px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #alliance-statistics-menu a {
            color: #ecf0f1;
            text-decoration: none;
            font-size: 14px;
        }
        #alliance-statistics-menu a:hover {
            color: #3498db;
        }
        #alliance-statistics-menu .divider {
            border-bottom: 1px solid #7f8c8d;
            margin: 4px 0;
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
            height: 45px;
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
            pointer-events: none;
            vertical-align: middle;
        }
        #alliance-team-box strong {
            font-size: 12px;
            color: #ecf0f1;
        }

        /* Verkleinerte Schrift und Zahlen für die Statistiken */
        .alliance-statistics-item {
            font-size: 17px;
            font-weight: bold;
        }
        .alliance-statistics-value {
            font-size: 17px;
            color: #2ecc71;
            font-weight: bold;
        }
        #dropdown-arrow {
            font-size: 11px;
            color: white;
            vertical-align: middle;
            margin-left: 5px;
        }
        #playtime-container {
            padding: 2px 5px;
            font-size: 12px;
            text-align: left;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #playtime {
            font-size: 14px;
            font-weight: bold;
            font-family: 'Orbitron', monospace;
            color: #2ecc71;
            letter-spacing: 2px;
        }
        #separator {
            margin: 0 10px;
            border-left: 2px solid #ecf0f1;
            height: 100%;
        }
        #current-datetime {
            font-size: 12px;
            font-weight: bold;
            color: #ecf0f1;
        }
        #patch-notes-container {
            display: none;
            margin-top: 8px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            color: white;
        }
        #patch-notes-container h3 {
            text-align: center;
            text-decoration: underline;
            font-weight: bold;
            margin-top: 0;
        }
        #patch-notes-container ul {
            list-style-type: none;
            padding-left: 0;
        }
        #patch-notes-container li {
            margin-bottom: 5px;
        }
        #settings-container {
            display: none;
            margin-top: 8px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 5px;
            color: white;
        }
        #settings-container h3 {
            text-align: center;
            text-decoration: underline;
            font-weight: bold;
            margin-top: 0;
        }
        #settings-container ul {
            list-style-type: none;
            padding-left: 0;
        }
        #settings-container li {
            margin-bottom: 5px;
        }
        .settings-button {
            display: inline-block;
            padding: 5px 10px;
            font-size: 12px;
            font-weight: bold;
            color: white;
            background-color: #3498db;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            text-align: center;
            text-decoration: none;
        }
        .settings-button:hover {
            background-color: #2980b9;
        }
    `);

    // Spielzeit-Timer Variablen
    let playtime = 0;
    let lastTimestamp = Date.now();

    // Variablen für den Tagesverdienst
    let initialTotalCredits = parseInt(localStorage.getItem("initialTotalCredits"), 10) || 0;
    let dailyEarnings = parseInt(localStorage.getItem("dailyEarnings"), 10) || 0;
    let lastCheckedDate = localStorage.getItem("lastCheckedDate") || new Date().toISOString().split('T')[0];

    // Funktion zum Formatieren der Zeit in HH:MM:SS
    function formatTime(seconds) {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // Funktion zum Formatieren des Datums und der Uhrzeit
    function formatDateTime() {
        const now = new Date();
        const options = {
            weekday: 'short',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };
        const formattedDateTime = now.toLocaleDateString('de-DE', options);
        return formattedDateTime.replace(',', '');
    }

    // Funktion zum Speichern der Spielzeit und Credits in localStorage
    function savePlaytimeAndCredits() {
        localStorage.setItem("dailyPlaytime", playtime);
        localStorage.setItem("lastTimestamp", lastTimestamp);
        localStorage.setItem("initialTotalCredits", initialTotalCredits);
        localStorage.setItem("dailyEarnings", dailyEarnings);
        localStorage.setItem("lastCheckedDate", lastCheckedDate);
    }

    // Funktion zum Laden der Spielzeit und Credits aus localStorage
    function loadPlaytimeAndCredits() {
        playtime = parseInt(localStorage.getItem("dailyPlaytime"), 10) || 0;
        lastTimestamp = parseInt(localStorage.getItem("lastTimestamp"), 10) || Date.now();
        initialTotalCredits = parseInt(localStorage.getItem("initialTotalCredits"), 10) || 0;
        dailyEarnings = parseInt(localStorage.getItem("dailyEarnings"), 10) || 0;
        lastCheckedDate = localStorage.getItem("lastCheckedDate") || new Date().toISOString().split('T')[0];
    }

    // Funktion zum Aktualisieren der Spielzeit
    function updatePlaytime() {
        const now = Date.now();
        const elapsed = Math.floor((now - lastTimestamp) / 1000);

        if (elapsed > 0) {  // Nur aktualisieren, wenn Zeit vergangen ist
            playtime += elapsed;
            lastTimestamp = now;

            $("#playtime").text(formatTime(playtime));
            savePlaytimeAndCredits();
        }
    }

    // Funktion zum Aktualisieren des Datums und der Uhrzeit
    function updateDateTime() {
        $("#current-datetime").text(formatDateTime());
    }

    // Funktion zum Starten des Spielzeit-Timers
    function startPlaytimeTimer() {
        lastTimestamp = Date.now(); // Zeitstempel aktualisieren
        setInterval(updatePlaytime, 1000); // Timer aktualisieren
    }

    // Funktion zum Starten des Datums- und Uhrzeit-Timers
    function startDateTimeTimer() {
        setInterval(updateDateTime, 1000); // Datum und Uhrzeit jede Sekunde aktualisieren
    }

    // Funktion zum Zurücksetzen der Spielzeit und Tagesverdienst um 0:00 Uhr
    function checkForMidnight() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        if (today !== lastCheckedDate) {
            playtime = 0;
            initialTotalCredits = 0;
            dailyEarnings = 0;
            lastCheckedDate = today;
            savePlaytimeAndCredits();
            $("#playtime").text(formatTime(playtime));
            $("#alliance-statistics-menu .daily-earnings").text(dailyEarnings.toLocaleString());
        }
    }

    // Funktion zum Berechnen des Tagesverdienstes
    function calculateDailyEarnings(currentTotalCredits) {
        if (initialTotalCredits === 0) {
            initialTotalCredits = currentTotalCredits;
        } else {
            dailyEarnings = currentTotalCredits - initialTotalCredits;
        }
        savePlaytimeAndCredits();
    }

    // Funktion zum Zurücksetzen der Spielzeit (manuell)
    function resetPlaytime() {
        playtime = 0;
        savePlaytimeAndCredits();
        $("#playtime").text(formatTime(playtime));
    }

    // Funktion zum Zurücksetzen des Tagesverdienstes (manuell)
    function resetDailyEarnings() {
        initialTotalCredits = 0;
        dailyEarnings = 0;
        savePlaytimeAndCredits();
        $("#alliance-statistics-menu .daily-earnings").text(dailyEarnings.toLocaleString());
    }

    // Funktion zum Überprüfen auf ein Update
    async function checkForUpdate() {
        console.log("Prüfe auf Updates...");
        try {
            const response = await new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: updateUrl,
                    onload: resolve,
                    onerror: reject
                });
            });

            if (response.status === 200) {
                const remoteScript = response.responseText;
                const remoteVersion = remoteScript.match(/@version\s+(\d+\.\d+\.\d+)/)[1];
                console.log("Gefundene Remote-Version: ", remoteVersion);
                if (remoteVersion && remoteVersion !== currentVersion) {
                    GM_notification({
                        title: "Verband Statistik Update",
                        text: `Eine neue Version (${remoteVersion}) ist verfügbar.`,
                        timeout: 10000,
                        onclick: () => {
                            window.open(updateUrl, "_blank");
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Fehler beim Überprüfen auf Updates:", error);
        }
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
                        updateAllianceStatistics(data);
                        updateAllianceTeam(data.users);
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

        const allianceName = data.name || "Unbekannt";
        const allianceId = data.id || "#";
        const totalCredits = data.credits_total || 0;
        const currentCredits = data.credits_current || 0;
        const totalMembers = data.user_count || 0;
        const rank = data.rank || "Unbekannt";

        calculateDailyEarnings(totalCredits);

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

            // Spielzeit-Timer und aktuelles Datum/Uhrzeit
            dropdownMenu.append(
                `<li id="playtime-container">
                    <div><strong>Heutige Spielzeit:</strong> <span id="playtime">00:00:00</span></div>
                    <div id="separator"></div>
                    <div id="current-datetime">${formatDateTime()}</div>
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

            // Gesamttagesverdienst
            dropdownMenu.append(
                `<li><a href="#" class="alliance-statistics-item"><strong>Gesamttagesverdienst:</strong>
                    <span class="alliance-statistics-value daily-earnings">
                    ${dailyEarnings.toLocaleString()}</span></a></li>`
            );

            dropdownMenu.append(`<li class="divider"></li>`);

            // Verbands-Team, das sich ausklappen lässt
            dropdownMenu.append(
                `<li><a href="#" id="team-info-toggle" style="color: white; text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline;">
                    Verbands-Team</a></li>`
            );

            // Container für das Verbands-Team (anfangs versteckt)
            const teamInfoContainer = $('<div id="team-info-container"></div>').css({
                display: "none",
                marginTop: "8px",
            });

            teamInfoContainer.append(`<ul id="alliance-team-box" style="list-style-type:none; padding-left: 0;"></ul>`);

            dropdownMenu.append(teamInfoContainer);

            dropdownMenu.append(`<li class="divider"></li>`);

            // Patch-Notes
            dropdownMenu.append(
                `<li><a href="#" id="patch-notes-toggle" style="color: white; text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline;">
                    Patch-Notes</a></li>`
            );

            const patchNotesContainer = $('<div id="patch-notes-container"></div>').css({
                display: "none",
                marginTop: "8px",
            });

            patchNotesContainer.append(`
                <h3>Patch-Notes 3.0.1</h3>
                <ul>
                    <li>- Einige Fehler mit dem heutigen Spielzeit-Timer und dem Gesamttagesverdienst wurden behoben.</li>
                    <li>- Ein neuer Menüpunkt "Einstellungen" wurde hinzugefügt, mit dem der Timer und der Gesamttagesverdienst manuell zurückgesetzt werden können.</li>
                    <li>- Aktualisiert am ${new Date().toLocaleDateString('de-DE', { year: 'numeric', month: '2-digit', day: '2-digit' })} um ${new Date().toLocaleTimeString('de-DE')}</li>
                </ul>
            `);

            dropdownMenu.append(patchNotesContainer);

            dropdownMenu.append(`<li class="divider"></li>`);

            // Einstellungen
            dropdownMenu.append(
                `<li><a href="#" id="settings-toggle" style="color: white; text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline;">
                    Einstellungen</a></li>`
            );

            const settingsContainer = $('<div id="settings-container"></div>').css({
                display: "none",
                marginTop: "8px",
            });

            settingsContainer.append(`
                <h3>Einstellungen</h3>
                <ul>
                    <li><button id="reset-playtime-button" class="settings-button">Spielzeit zurücksetzen</button></li>
                    <li><button id="reset-daily-earnings-button" class="settings-button">Tagesverdienst zurücksetzen</button></li>
                </ul>
            `);

            dropdownMenu.append(settingsContainer);

            dropdownMenu.append(`<li class="divider"></li>`);

            // Informationen
            dropdownMenu.append(
                `<li><a href="#" id="script-info-toggle" style="color: white; text-align: center; font-size: 14px; font-weight: bold; text-decoration: underline;">
                    Informationen</a></li>`
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
                `<li><a href="#" style="color: white; font-size: 10px;">Version: 3.0.7 </a></li>`
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
                `<li><a href="#" style="color: white; font-size: 10px;">- Anzeige des Gesamttagesverdiensts</a></li>`
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
                scriptInfoContainer.slideToggle();
                return false;
            });

            // Klick-Event zum Ein- und Ausklappen der Patch-Notes
            dropdownMenu.on("click", "#patch-notes-toggle", function (e) {
                e.preventDefault();
                patchNotesContainer.slideToggle();
                return false;
            });

            // Klick-Event zum Ein- und Ausklappen der Einstellungen
            dropdownMenu.on("click", "#settings-toggle", function (e) {
                e.preventDefault();
                settingsContainer.slideToggle();
                return false;
            });

            // Klick-Event zum Zurücksetzen der Spielzeit
            dropdownMenu.on("click", "#reset-playtime-button", function (e) {
                e.preventDefault();
                resetPlaytime();
            });

            // Klick-Event zum Zurücksetzen des Tagesverdienstes
            dropdownMenu.on("click", "#reset-daily-earnings-button", function (e) {
                e.preventDefault();
                resetDailyEarnings();
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
            $("#alliance-statistics-menu .daily-earnings").text(dailyEarnings.toLocaleString());
            $("#current-datetime").text(formatDateTime());
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
        loadPlaytimeAndCredits();
        fetchAllianceInfo();
        setInterval(fetchAllianceInfo, 1000); // Echtzeit-Aktualisierung alle 1 Sekunde
        setInterval(updateAllianceTeam, 600000); // Team-Update alle 10 Minuten
        startPlaytimeTimer();
        startDateTimeTimer();
        setInterval(checkForMidnight, 60000); // Überprüfung auf Mitternacht alle 60 Sekunden

        // Überprüfe beim Laden der Seite auf Updates
        checkForUpdate();
    });

    window.addEventListener("beforeunload", savePlaytimeAndCredits); // Spielzeit beim Schließen der Seite speichern
})();
