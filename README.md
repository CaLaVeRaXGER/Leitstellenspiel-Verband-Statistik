# LSS Verband Statistik Pro

**Version:** 9.6.2.1  
**Autor:** Fabian (Capt.BobbyNash)  
**Status:** Aktive Entwicklung  
**Website:** Leitstellenspiel  
**Lizenz:** Proprietary - Personal Use Only

## Beschreibung

LSS Verband Statistik Pro ist ein umfangreiches Premium-Dashboard fuer das Spiel Leitstellenspiel. Das Userscript erweitert die Verbands- und Spieleruebersicht um moderne Statistiken, Prognosen, Auswertungen, Live-Daten, Wetterinformationen, Fuhrpark-Analysen, Mitgliederuebersichten, News und komfortable Verwaltungsfunktionen.

Ziel des Skripts ist es, wichtige Informationen rund um Verband, Spielerfortschritt, Fuhrpark, Einsaetze, Wetterlage und Entwicklung zentral, uebersichtlich und professionell darzustellen, direkt im Spiel und ohne dauerhaft externe Tools offen halten zu muessen.

## Highlights

- professionelles Verbands-Dashboard
- Verbandsprognose mit Zielwert, Tagestrend und Datenbasis
- Spielerprognose mit Platzierungsumfeld
- Fuhrpark- und Standortanalyse
- Mitgliederuebersicht mit Rollen, Aktivitaet und Profillinks
- moderne Credit-Popups mit Einsatzname, Patienten- und Gefangeneninfos
- Wetterzentrale mit DWD-Warnkarte und Windy-Radar
- News-Laufschrift mit Tagesschau, WELT, Sportschau und Fussball-News
- Leitstellenspiel-Eventerkennung direkt aus der Spielnavigation
- Backup, Wiederherstellung und Diagnoseexport
- mehrere Designs inklusive Summer 2026, Summer Dark 2026 und LCARS 2364

## Funktionen

### Verbands-Dashboard

Das Dashboard zeigt wichtige Verbandsdaten auf einen Blick:

- Gesamtcredits
- Verbandskasse
- Platzierung
- Mitgliederanzahl
- Tagesverdienst
- 7-Tage-Entwicklung
- moegliche Einnahmen aus offenen Einsaetzen
- Aktivitaets- und Potenzialwerte

### Verbandsprognose

Die Verbandsprognose berechnet anhand lokaler Verlaufsdaten:

- voraussichtliches Erreichungsdatum eines Zielwerts
- Resttage bis zum Ziel
- durchschnittlichen Tagesverdienst
- 7-Tage-Tempo
- Fortschritt zum gesetzten Meilenstein
- Datenqualitaet der Prognose

### Spielerprognose

Die Spielerprognose zeigt die persoenliche Entwicklung des Spielers:

- aktueller Dienstgrad
- Fortschritt bis zur naechsten Befoerderung
- voraussichtliches Befoerderungsdatum
- persoenlicher Tagesdurchschnitt
- Platzierungsumfeld mit eigener Position
- Meilensteine und Rekorde

### Fuhrpark & Standorte

Die Fuhrpark- und Standortanalyse wertet API-Daten uebersichtlich aus:

- Fahrzeugstatus
- Fahrzeugtypen
- Gebaeudetypen
- Standorte
- Personal- und Ausbauinformationen
- Qualitaetschecks
- API-Datenbasis

### Mitgliederuebersicht

Die Mitgliederuebersicht stellt Verbandsmitglieder professionell dar:

- Rollen und Sonderrollen
- Online- und Inaktivitaetsstatus
- Dienstgrad
- Credits
- Spielerrang
- Profil- und Nachrichtenlinks
- performantere Darstellung grosser Verbaende

### Credit-Popups

Bei neuen Einnahmen kann ein animiertes Popup erscheinen. Die Popups zeigen:

- Betrag
- Einsatzname als Titel
- Tagesstand
- Uhrzeit
- getrennte Details fuer Credits, Patienten und Gefangene
- mehrere Designs, Groessen und Positionen
- mehrere Animationen und Sounds
- Lautstaerkeregler

### Wetterzentrale

Die Wetterzentrale befindet sich unter **Sonstiges** und buendelt Wetter- und Warninformationen:

- Ort- und PLZ-Suche mit Laenderauswahl
- aktueller Wetterbericht
- Warnbericht
- Stundenprognose
- 7-Tage-Ausblick
- Temperatur und gefuehlte Temperatur
- Niederschlag, Feuchte und Luftdruck
- Wind, Boeen und Windrichtung
- UV-Index und Sonnenzeiten
- DWD-Warnungen fuer Deutschland
- DWD-Warnkarte mit offizieller WMS-Einbindung
- klickbare Warngebiete mit Warnfenster
- mehrere aktive Warnungen untereinander
- Warnlegende fuer Stufen 1 bis 4, Vorabinformation, Hitze, UV und keine Warnung
- Windy Live-Radar
- Windy Regen-Prognose
- Windy Gewitter-Prognose
- Wind + Regen Ansicht
- frei skalierbare Radarbox

### News-Laufschrift

Die News-Laufschrift ist standardmaessig aktiv und zeigt alle Kategorien direkt an.

Verfuegbare Quellen:

- Tagesschau
- WELT
- Sportschau
- Sportschau Fussball

Jede News zeigt Quelle, Datum, Uhrzeit und Titel. Die Geschwindigkeit kann in den Einstellungen angepasst werden.

### Leitstellenspiel-Events

Das Skript erkennt aktive Leitstellenspiel-Events direkt aus der Spielnavigation:

- Credit-Boosts
- Coin-Sales
- Einsatz-Events

Externe Spielplan- und Sportmodule wurden entfernt. Der Eventbereich konzentriert sich ausschliesslich auf echte Leitstellenspiel-Events.

### Backup & Wiederherstellung

In den Einstellungen kann ein komplettes JSON-Backup erstellt und wiederhergestellt werden.

Gesichert werden unter anderem:

- Einstellungen
- Verlauf
- Spielzeit
- Prognosedaten
- Tageswerte
- Diagnoseinformationen
- Aktivitaetsdaten
- Wetter- und News-Einstellungen

Der Import ist abgesichert durch:

- Dateigroessenlimit
- JSON-Pruefung
- Backup-Typpruefung
- Domainpruefung
- Feld-Allowlist
- Daten-Normalisierung

### Sicherheit & Stabilitaet

Das Skript enthaelt mehrere Schutz- und Stabilitaetsfunktionen:

- sichere URL-Allowlist
- Blockierung unsicherer URLs
- Request-Deduplizierung
- leichtes Rate-Limiting
- Retry-Logik mit Backoff
- Timeout-Behandlung
- anonymisierte Supportdateien
- Schutz dynamischer Profil- und Nachrichtenlinks
- Diagnosebereich fuer Fehleranalyse

### Designs & Bedienung

Enthaltene Themes:

- Dark
- Light
- Summer 2026
- Summer Dark 2026
- LCARS 2364

Das Dashboard kann als eingebettete Layout-Box oder als Floating-Menue genutzt werden. Tastenkürzel, Sprache, Anzeigen, Module, News, Wetter und Popups sind in den Einstellungen anpassbar.

## Installation

Dieses Skript kann mit einem UserScript-Manager installiert werden, z. B.:

- Tampermonkey
- Violentmonkey
- Greasemonkey

### Schritte

1. UserScript-Manager im Browser installieren.
2. Skript hinzufuegen oder ueber die GitHub-Raw-Datei installieren.
3. Sicherstellen, dass das Skript auf folgenden Seiten aktiv ist:
   - `leitstellenspiel.de`
   - `polizei.leitstellenspiel.de`
4. Leitstellenspiel neu laden.
5. Dashboard oeffnen und Einstellungen anpassen.

## Automatische Updates

Das Skript unterstuetzt automatische Updates ueber Tampermonkey mithilfe von:

- `@updateURL`
- `@downloadURL`

Zusaetzlich kann in den Einstellungen manuell geprueft werden, ob eine neue Version verfuegbar ist.

## Aktueller Entwicklungsstand

### v9.6.2.1

- Versionsnummer auf 9.6.2.1 gesetzt
- News standardmaessig aktiviert
- alle News-Kategorien standardmaessig vorausgewaehlt
- Tagesschau, WELT, Sportschau und Sportschau Fussball als Newsquellen aktiv

### v9.6.2

- Wetterzentrale unter Sonstiges ergaenzt
- DWD-Warnkarte mit WMS-Webmodul eingebaut
- Warnfenster bei Kartenklick ergaenzt
- mehrere Warnungen werden untereinander angezeigt
- Vorabinformationen werden rot hervorgehoben
- Windy Radar wiederhergestellt
- Windy Umschalter fuer Live-Radar, Regen-Prognose, Gewitter-Prognose und Wind + Regen ergaenzt
- News-Laufschrift ergaenzt
- News zeigen Datum und Uhrzeit
- Sportschau und Sportschau Fussball als News-Kategorien ergaenzt
- BILD als News-Quelle entfernt
- Credit-Popups professioneller gestaltet
- Einsatzname wird bei Credit-Popups als Titel angezeigt
- Patienten- und Gefangeneninformationen in Popups verbessert
- Einstellungen deutlich uebersichtlicher strukturiert
- Kopfzeilen-Button in Darstellung & Bedienung integriert
- AAO und Verlauf aus Menue und Hintergrundabrufen entfernt
- Werkzeuge wurde zu Sonstiges umbenannt
- Event wurde beim Verband mit Trenner integriert
- Platzierungsumfeld fuer Verband und Spieler wieder kompakt gesetzt
- moeglicher Verdienst aus offenen Einsaetzen stabilisiert
- Lehrgangsdaten und Anzeige stabilisiert
- UTF-8-Artefakte, kaputte Symbole und falsche Umlaute korrigiert
- Credits-Symbol wieder korrekt gesetzt

### v9.6.0

- externes Spielplan-/Sportmodul vollstaendig entfernt
- Eventbereich auf reine Leitstellenspiel-Events reduziert
- API-Aufrufe abgesichert
- Backup-System gehaertet
- Diagnoseexport anonymisiert
- grosse Mitgliederlisten performanter gemacht
- Patchnotes bereinigt
- Lizenz auf private Nutzung beschraenkt

## Hinweise

Dieses Skript arbeitet direkt im Browser und speichert Daten lokal ueber den UserScript-Manager. Bei Browser-, Tampermonkey- oder Cache-Bereinigungen koennen lokale Daten verloren gehen.

Es wird empfohlen, regelmaessig ein Backup ueber die Einstellungen zu erstellen.

## Lizenz

Dieses Projekt steht unter:

**Proprietary License - Personal Use Only**

Private Nutzung ist erlaubt. Kopieren, Veraendern, Weiterveroeffentlichen, Verkaufen, Hosten, Spiegeln oder Einbinden in andere Projekte ist ohne vorherige schriftliche Erlaubnis nicht gestattet.

## Feedback & Fehlerberichte

Fehler, Verbesserungsvorschlaege oder Ideen koennen direkt an Fabian (Capt.BobbyNash) gemeldet werden.

Bitte bei Fehlern moeglichst angeben:

- welche Ansicht geoeffnet war
- was genau passiert ist
- ob Fehlermeldungen angezeigt wurden
- optional eine anonymisierte Supportdatei aus den Einstellungen
