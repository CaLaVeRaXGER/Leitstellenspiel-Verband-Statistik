# 🚒 LSS Verband Statistik Pro (v9.6.0)

**Autor:** Fabian (Capt.BobbyNash)  
**Status:** Aktive Entwicklung  
**Website:** [Leitstellenspiel](https://www.leitstellenspiel.de/)  
**Lizenz:** Proprietary - Personal Use Only

---

## 📌 Beschreibung

**LSS Verband Statistik Pro** ist ein umfangreiches Premium-Dashboard für das Spiel **Leitstellenspiel**.  
Das Skript erweitert die Verbands- und Spielerübersicht um moderne Statistiken, Prognosen, Auswertungen, Live-Daten, Wetterinformationen, Fuhrpark-Analysen, Mitgliederübersichten und komfortable Verwaltungsfunktionen.

Ziel des Skripts ist es, wichtige Informationen rund um Verband, Spielerfortschritt, Fuhrpark, Einsätze und Entwicklung zentral, übersichtlich und professionell darzustellen — direkt im Spiel, ohne externe Tools öffnen zu müssen.

---

## ✨ Hauptfunktionen

### 📊 Professionelles Verbands-Dashboard

Zeigt wichtige Verbandsdaten wie:

- Gesamtcredits
- Verbandskasse
- Platzierung
- Mitgliederanzahl
- Tagesverdienst
- 7-Tage-Entwicklung
- mögliche Einnahmen aus offenen Einsätzen

---

### 🔮 Verbandsprognose

Berechnet anhand lokaler Verlaufsdaten:

- voraussichtliches Erreichungsdatum eines Zielwerts
- Resttage bis zum Ziel
- durchschnittlichen Tagesverdienst
- 7-Tage- und 30-Tage-Tempo
- Fortschritt zum gesetzten Meilenstein
- Datenqualität der Prognose

Die Fortschrittsanzeige besitzt eine eigene Farblegende, damit Status und Tempo verständlicher erkennbar sind.

---

### 👤 Spielerprognose

Zeigt die persönliche Entwicklung des Spielers mit:

- aktuellem Dienstgrad
- Fortschritt bis zur nächsten Beförderung
- fehlenden Credits
- voraussichtlichem Beförderungsdatum
- persönlichem Tagesdurchschnitt
- Meilensteinen und Rekorden

---

### 🚗 Fuhrpark & Standorte

Analysiert Fahrzeuge und Gebäude übersichtlich:

- Fahrzeugstatus
- Fahrzeugtypen
- Gebäudetypen
- Standorte
- Personal- und Ausbauinformationen
- Qualitätschecks
- API-Datenbasis

---

### 👥 Mitgliederübersicht

Stellt Verbandsmitglieder professionell dar:

- Rollen und Sonderrollen
- Online-/Inaktivitätsstatus
- Dienstgrad
- Credits
- Spielerrang
- Profil- und Nachrichtenlinks

Große Verbände werden performanter dargestellt, da Mitgliederkarten gebündelt gerendert werden.

---

### 💰 Credit-Popups

Bei neuen Einnahmen kann ein animiertes Popup erscheinen:

- Betrag der Einnahme
- Tagesstand
- Uhrzeit
- verschiedene Größen
- verschiedene Positionen
- mehrere Animationen
- mehrere Sounds
- Lautstärkeregler

---

### 🌦️ Wetter & Warnungen

Optionales Wettermodul mit:

- aktueller Wetterlage
- Stundenprognose
- 7-Tage-Ausblick
- Wind, Regen, Temperatur und Luftfeuchtigkeit
- DWD-Warnungen für Deutschland
- optionalem Warnton

---

### 📅 Leitstellenspiel-Events

Das Skript erkennt aktive Leitstellenspiel-Events direkt aus der Spielnavigation, z. B.:

- Credit-Boosts
- Coin-Sales
- Einsatz-Events

Externe Spielplan- oder Sportmodule wurden ab Version `v9.6.0` vollständig entfernt.

---

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

Der Import ist zusätzlich abgesichert durch:

- Dateigrößenlimit
- JSON-Prüfung
- Backup-Typprüfung
- Domainprüfung
- Feld-Allowlist
- Daten-Normalisierung

---

### 🔐 Sicherheit & Stabilität

Ab Version `v9.6.0` wurde die Sicherheit deutlich verbessert:

- sichere URL-Allowlist
- Blockierung unsicherer URLs
- Request-Deduplizierung
- leichtes Rate-Limiting
- Retry-Logik mit Backoff
- Timeout-Behandlung
- anonymisierte Supportdateien
- Schutz dynamischer Profil- und Nachrichtenlinks
- bessere Diagnose bei Fehlern

---

### 🎨 Designs & Bedienung

Enthaltene Themes:

- Dark
- Light
- Summer 2026
- Summer Dark 2026
- LCARS 2364

Das Dashboard kann als eingebettete Layout-Box oder als Floating-Menü genutzt werden.  
Tastenkürzel, Sprache, Anzeigen und Module sind in den Einstellungen anpassbar.

---

## 🔄 Automatische Updates

Das Skript unterstützt automatische Updates über Tampermonkey mithilfe von:

- `@updateURL`
- `@downloadURL`

Zusätzlich kann in den Einstellungen manuell geprüft werden, ob eine neue Version verfügbar ist.

---

## 🛠️ Installation

Dieses Skript kann mit einem UserScript-Manager installiert werden, z. B.:

- Tampermonkey
- Violentmonkey
- Greasemonkey

### Schritte

1. UserScript-Manager im Browser installieren
2. Skript hinzufügen oder über die GitHub-Raw-Datei installieren
3. Sicherstellen, dass das Skript auf folgenden Seiten aktiv ist:
   - [leitstellenspiel.de](https://www.leitstellenspiel.de/)
   - [polizei.leitstellenspiel.de](https://polizei.leitstellenspiel.de/)
4. Leitstellenspiel neu laden
5. Dashboard öffnen und Einstellungen anpassen

---

## ⚠️ Hinweise

Dieses Skript arbeitet direkt im Browser und speichert Daten lokal über den UserScript-Manager.  
Bei Browser-, Tampermonkey- oder Cache-Bereinigungen können lokale Daten verloren gehen.

Daher wird empfohlen, regelmäßig ein Backup über die Einstellungen zu erstellen.

---

## ℹ️ Aktueller Entwicklungsstand v9.6.0

Version `v9.6.0` konzentriert sich auf Sicherheit, Stabilität und Datenschutz.

Wichtige Änderungen:

- externes Spielplan-/Sportmodul vollständig entfernt
- Eventbereich auf reine Leitstellenspiel-Events reduziert
- API-Aufrufe abgesichert
- Backup-System gehärtet
- Diagnoseexport anonymisiert
- große Mitgliederlisten performanter gemacht
- Patchnotes bereinigt und auf einen aktuellen Block reduziert
- Lizenz auf private Nutzung beschränkt

---

## 🔒 Lizenz

Dieses Projekt steht unter:

**Proprietary License - Personal Use Only**

Private Nutzung ist erlaubt.  
Kopieren, Verändern, Weiterveröffentlichen, Verkaufen, Hosten, Spiegeln oder Einbinden in andere Projekte ist ohne vorherige schriftliche Erlaubnis nicht gestattet.

---

## 📬 Feedback & Fehlerberichte

Fehler, Verbesserungsvorschläge oder Ideen können direkt an **Fabian (Capt.BobbyNash)** gemeldet werden.

Bitte bei Fehlern möglichst angeben:

- welche Ansicht geöffnet war
- was genau passiert ist
- ob Fehlermeldungen angezeigt wurden
- optional eine anonymisierte Supportdatei aus den Einstellungen
