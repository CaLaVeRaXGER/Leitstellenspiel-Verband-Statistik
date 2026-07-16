# 🚒 LSS Verband Statistik Pro

**Version:** 9.6.2.1  
**Autor:** Fabian (Capt.BobbyNash)  
**Status:** Aktive Entwicklung  
**Website:** Leitstellenspiel  
**Lizenz:** Proprietary - Personal Use Only

## 📌 Beschreibung

LSS Verband Statistik Pro ist ein umfangreiches Premium-Dashboard für das Spiel Leitstellenspiel. Das Userscript erweitert die Verbands- und Spielerübersicht um moderne Statistiken, Prognosen, Auswertungen, Live-Daten, Wetterinformationen, Fuhrpark-Analysen, Mitgliederübersichten, News und komfortable Verwaltungsfunktionen.

Ziel des Skripts ist es, wichtige Informationen rund um Verband, Spielerfortschritt, Fuhrpark, Einsätze, Wetterlage und Entwicklung zentral, übersichtlich und professionell darzustellen, direkt im Spiel und ohne dauerhaft externe Tools offen halten zu müssen.

## ✨ Highlights

- 📊 professionelles Verbands-Dashboard
- 🔮 Verbandsprognose mit Zielwert, Tagestrend und Datenbasis
- 👤 Spielerprognose mit Platzierungsumfeld
- 🚗 Fuhrpark- und Standortanalyse
- 👥 Mitgliederübersicht mit Rollen, Aktivität und Profillinks
- 💰 moderne Credit-Popups mit Einsatzname, Patienten- und Gefangeneninfos
- 🌦️ Wetterzentrale mit DWD-Warnkarte und Windy-Radar
- 📰 News-Laufschrift mit Tagesschau, WELT, Sportschau und Fußball-News
- 📅 Leitstellenspiel-Eventerkennung direkt aus der Spielnavigation
- 💾 Backup, Wiederherstellung und Diagnoseexport
- 🎨 mehrere Designs inklusive Summer 2026, Summer Dark 2026 und LCARS 2364

## 🧩 Funktionen

### 📊 Verbands-Dashboard

Das Dashboard zeigt wichtige Verbandsdaten auf einen Blick:

- Gesamtcredits
- Verbandskasse
- Platzierung
- Mitgliederanzahl
- Tagesverdienst
- 7-Tage-Entwicklung
- mögliche Einnahmen aus offenen Einsätzen
- Aktivitäts- und Potenzialwerte

### 🔮 Verbandsprognose

Die Verbandsprognose berechnet anhand lokaler Verlaufsdaten:

- voraussichtliches Erreichungsdatum eines Zielwerts
- Resttage bis zum Ziel
- durchschnittlichen Tagesverdienst
- 7-Tage-Tempo
- Fortschritt zum gesetzten Meilenstein
- Datenqualität der Prognose

### 👤 Spielerprognose

Die Spielerprognose zeigt die persönliche Entwicklung des Spielers:

- aktueller Dienstgrad
- Fortschritt bis zur nächsten Beförderung
- voraussichtliches Beförderungsdatum
- persönlicher Tagesdurchschnitt
- Platzierungsumfeld mit eigener Position
- Meilensteine und Rekorde

### 🚗 Fuhrpark & Standorte

Die Fuhrpark- und Standortanalyse wertet API-Daten übersichtlich aus:

- Fahrzeugstatus
- Fahrzeugtypen
- Gebäudetypen
- Standorte
- Personal- und Ausbauinformationen
- Qualitätschecks
- API-Datenbasis

### 👥 Mitgliederübersicht

Die Mitgliederübersicht stellt Verbandsmitglieder professionell dar:

- Rollen und Sonderrollen
- Online- und Inaktivitätsstatus
- Dienstgrad
- Credits
- Spielerrang
- Profil- und Nachrichtenlinks
- performantere Darstellung großer Verbände

### 💰 Credit-Popups

Bei neuen Einnahmen kann ein animiertes Popup erscheinen. Die Popups zeigen:

- Betrag
- Einsatzname als Titel
- Tagesstand
- Uhrzeit
- getrennte Details für Credits, Patienten und Gefangene
- mehrere Designs, Größen und Positionen
- mehrere Animationen und Sounds
- Lautstärkeregler

### 🌦️ Wetterzentrale

Die Wetterzentrale befindet sich unter **Sonstiges** und bündelt Wetter- und Warninformationen:

- Ort- und PLZ-Suche mit Länderauswahl
- aktueller Wetterbericht
- Warnbericht
- Stundenprognose
- 7-Tage-Ausblick
- Temperatur und gefühlte Temperatur
- Niederschlag, Feuchte und Luftdruck
- Wind, Böen und Windrichtung
- UV-Index und Sonnenzeiten
- DWD-Warnungen für Deutschland
- DWD-Warnkarte mit offizieller WMS-Einbindung
- klickbare Warngebiete mit Warnfenster
- mehrere aktive Warnungen untereinander
- Warnlegende für Stufen 1 bis 4, Vorabinformation, Hitze, UV und keine Warnung
- Windy Live-Radar
- Windy Regen-Prognose
- Windy Gewitter-Prognose
- Wind + Regen Ansicht
- frei skalierbare Radarbox

### 📰 News-Laufschrift

Die News-Laufschrift ist standardmäßig aktiv und zeigt alle Kategorien direkt an.

Verfügbare Quellen:

- Tagesschau
- WELT
- Sportschau
- Sportschau Fußball

Jede News zeigt Quelle, Datum, Uhrzeit und Titel. Die Geschwindigkeit kann in den Einstellungen angepasst werden.

### 📅 Leitstellenspiel-Events

Das Skript erkennt aktive Leitstellenspiel-Events direkt aus der Spielnavigation:

- Credit-Boosts
- Coin-Sales
- Einsatz-Events

Externe Spielplan- und Sportmodule wurden entfernt. Der Eventbereich konzentriert sich ausschließlich auf echte Leitstellenspiel-Events.

### 💾 Backup & Wiederherstellung

In den Einstellungen kann ein komplettes JSON-Backup erstellt und wiederhergestellt werden.

Gesichert werden unter anderem:

- Einstellungen
- Verlauf
- Spielzeit
- Prognosedaten
- Tageswerte
- Diagnoseinformationen
- Aktivitätsdaten
- Wetter- und News-Einstellungen

Der Import ist abgesichert durch:

- Dateigrößenlimit
- JSON-Prüfung
- Backup-Typprüfung
- Domainprüfung
- Feld-Allowlist
- Daten-Normalisierung

### 🔐 Sicherheit & Stabilität

Das Skript enthält mehrere Schutz- und Stabilitätsfunktionen:

- sichere URL-Allowlist
- Blockierung unsicherer URLs
- Request-Deduplizierung
- leichtes Rate-Limiting
- Retry-Logik mit Backoff
- Timeout-Behandlung
- anonymisierte Supportdateien
- Schutz dynamischer Profil- und Nachrichtenlinks
- Diagnosebereich für Fehleranalyse

### 🎨 Designs & Bedienung

Enthaltene Themes:

- Dark
- Light
- Summer 2026
- Summer Dark 2026
- LCARS 2364

Das Dashboard kann als eingebettete Layout-Box oder als Floating-Menü genutzt werden. Tastenkürzel, Sprache, Anzeigen, Module, News, Wetter und Popups sind in den Einstellungen anpassbar.

## 🛠️ Installation

Dieses Skript kann mit einem UserScript-Manager installiert werden, z. B.:

- Tampermonkey
- Violentmonkey
- Greasemonkey

### Schritte

1. UserScript-Manager im Browser installieren.
2. Skript hinzufügen oder über die GitHub-Raw-Datei installieren.
3. Sicherstellen, dass das Skript auf folgenden Seiten aktiv ist:
   - `leitstellenspiel.de`
   - `polizei.leitstellenspiel.de`
4. Leitstellenspiel neu laden.
5. Dashboard öffnen und Einstellungen anpassen.

## 🔄 Automatische Updates

Das Skript unterstützt automatische Updates über Tampermonkey mithilfe von:

- `@updateURL`
- `@downloadURL`

Zusätzlich kann in den Einstellungen manuell geprüft werden, ob eine neue Version verfügbar ist.

## ℹ️ Aktueller Entwicklungsstand

### v9.6.2.1

- Versionsnummer auf 9.6.2.1 gesetzt
- News standardmäßig aktiviert
- alle News-Kategorien standardmäßig vorausgewählt
- Tagesschau, WELT, Sportschau und Sportschau Fußball als Newsquellen aktiv

### v9.6.2

- Wetterzentrale unter Sonstiges ergänzt
- DWD-Warnkarte mit WMS-Webmodul eingebaut
- Warnfenster bei Kartenklick ergänzt
- mehrere Warnungen werden untereinander angezeigt
- Vorabinformationen werden rot hervorgehoben
- Windy Radar wiederhergestellt
- Windy Umschalter für Live-Radar, Regen-Prognose, Gewitter-Prognose und Wind + Regen ergänzt
- News-Laufschrift ergänzt
- News zeigen Datum und Uhrzeit
- Sportschau und Sportschau Fußball als News-Kategorien ergänzt
- BILD als News-Quelle entfernt
- Credit-Popups professioneller gestaltet
- Einsatzname wird bei Credit-Popups als Titel angezeigt
- Patienten- und Gefangeneninformationen in Popups verbessert
- Einstellungen deutlich übersichtlicher strukturiert
- Kopfzeilen-Button in Darstellung & Bedienung integriert
- AAO und Verlauf aus Menü und Hintergrundabrufen entfernt
- Werkzeuge wurde zu Sonstiges umbenannt
- Event wurde beim Verband mit Trenner integriert
- Platzierungsumfeld für Verband und Spieler wieder kompakt gesetzt
- möglicher Verdienst aus offenen Einsätzen stabilisiert
- Lehrgangsdaten und Anzeige stabilisiert
- UTF-8-Artefakte, kaputte Symbole und falsche Umlaute korrigiert
- Credits-Symbol wieder korrekt gesetzt

### v9.6.0

- externes Spielplan-/Sportmodul vollständig entfernt
- Eventbereich auf reine Leitstellenspiel-Events reduziert
- API-Aufrufe abgesichert
- Backup-System gehärtet
- Diagnoseexport anonymisiert
- große Mitgliederlisten performanter gemacht
- Patchnotes bereinigt
- Lizenz auf private Nutzung beschränkt

## ⚠️ Hinweise

Dieses Skript arbeitet direkt im Browser und speichert Daten lokal über den UserScript-Manager. Bei Browser-, Tampermonkey- oder Cache-Bereinigungen können lokale Daten verloren gehen.

Es wird empfohlen, regelmäßig ein Backup über die Einstellungen zu erstellen.

## 🔒 Lizenz

Dieses Projekt steht unter:

**Proprietary License - Personal Use Only**

Private Nutzung ist erlaubt. Kopieren, Verändern, Weiterveröffentlichen, Verkaufen, Hosten, Spiegeln oder Einbinden in andere Projekte ist ohne vorherige schriftliche Erlaubnis nicht gestattet.

## 📬 Feedback & Fehlerberichte

Fehler, Verbesserungsvorschläge oder Ideen können direkt an Fabian (Capt.BobbyNash) gemeldet werden.

Bitte bei Fehlern möglichst angeben:

- welche Ansicht geöffnet war
- was genau passiert ist
- ob Fehlermeldungen angezeigt wurden
- optional eine anonymisierte Supportdatei aus den Einstellungen
