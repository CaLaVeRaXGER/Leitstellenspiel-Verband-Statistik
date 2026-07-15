// ==UserScript==
// @name         LSS Verband Statistik Pro
// @namespace    http://tampermonkey.net/
// @charset      UTF-8
// @version      9.6.2
// @description  Ultimate Premium Dashboard: Live-Charts, Verbandsprognose, Wetter, Events und animiertes Summer-2026-Design für Feuerwehr und Polizei.
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

(function () {
"use strict";

// Das Dashboard gehoert nur in das Hauptfenster. Spiel-Lightboxen und
// eingebettete Formulare bleiben dadurch vollstaendig unangetastet.
if(window.top!==window.self)return;
// Verbandsseiten enthalten editierbare Vorstellungstexte und Regeln. Dort
// darf das Dashboard niemals DOM-Inhalte einbetten oder versehentlich in
// Formular-/Beschreibungstexte geraten.
if(/^\/(?:alliances\/\d+|verband(?:\/|$))/i.test(location.pathname))return;

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  KONFIGURATION                                               â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const V   = "9.6.2";
const GAME_HOSTS = new Set(["www.leitstellenspiel.de","polizei.leitstellenspiel.de"]);
const BASE = GAME_HOSTS.has(location.hostname) ? location.origin : "https://www.leitstellenspiel.de";
const UPDATE_URL = "https://leitstellenspiel-verband-statistik.pages.dev/leitstellenspiel-verband-statistik-pro.user.js";
const SECURITY = {
  maxBackupBytes: 1_500_000,
  maxDiagnosticString: 360,
  minRequestGapMs: 175,
  pendingRequests: new Map(),
  lastRequestByOrigin: new Map(),
};

const API = {
  alliance:    `${BASE}/api/allianceinfo`,
  userinfo:    `${BASE}/api/userinfo`,
  vStates:     `${BASE}/api/vehicle_states`,
  buildings:   `${BASE}/api/v2/buildings`,
  allianceBuildings: `${BASE}/api/v2/alliance_buildings`,
  schoolings:  `${BASE}/api/alliance_schoolings`,
  schoolingsPage: `${BASE}/schoolings`,
  vehicles:    `${BASE}/api/v2/vehicles`,
  vDistances:  `${BASE}/api/v1/vehicle_distances.json`,
  pois:        `${BASE}/api/v2/pois`,
  aaos:        `${BASE}/api/v1/aaos`,
  aaoCategories:`${BASE}/api/v1/aao_categories`,
  missionTypes:`${BASE}/api/mission_type_data`,
  missionsJson:`${BASE}/einsaetze.json`,
  allianceEventTypes:`${BASE}/alliance_event_types.json`,
  creditsOverview: `${BASE}/credits/overview`,
  alliancesPage: `${BASE}/alliances`,
  toplist: `${BASE}/toplist`,
  wxGeo: "https://geocoding-api.open-meteo.com/v1/search",
  wxForecast: "https://api.open-meteo.com/v1/forecast",
  zipGeo: "https://api.zippopotam.us",
  dwdWarnings: "https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json",
};
const DEBUG = false;
function logDebug(...args){ if(DEBUG) console.debug("[LSS7]",...args); }

const WEATHER_COUNTRIES = {
  DE:{label:"Deutschland",zip:/\b\d{5}\b/,language:"de"},
  AT:{label:"Österreich",zip:/\b\d{4}\b/,language:"de"},
  CH:{label:"Schweiz",zip:/\b\d{4}\b/,language:"de"},
  FR:{label:"Frankreich",zip:/\b\d{5}\b/,language:"fr"},
  NL:{label:"Niederlande",zip:/\b\d{4}\b/i,language:"nl"},
};

const I18N = {
  en:{
    "Übersicht":"Overview","Verbandsprognose":"Alliance forecast","Fuhrpark & Standorte":"Fleet & locations",
    "Lehrgänge":"Courses","Verlauf":"History","Team":"Team","Mitglieder":"Members","Event":"Event","Einstellungen":"Settings",
    "Spielzeit":"Playtime","Eigene Credits":"Your credits","Tagesverd.":"Daily earnings","Uhrzeit":"Time",
    "Verband":"Alliance","Credits gesamt":"Total credits","Verbandskasse":"Alliance funds","Platzierung":"Ranking",
    "Mitglieder":"Members","Coins":"Coins","Tagesverdienst":"Daily earnings","Verbandsverdienst heute":"Alliance earnings today","Verbandsverdienst 7 Tage":"Alliance earnings: 7 days","Verbandsaktivität heute":"Alliance activity today","Tageslage Verband":"Alliance daily overview","Einsätze":"Missions","Einsätze abgeschlossen":"Missions completed","Patienten":"Patients","Patienten transportiert":"Patients transported","Gefangene":"Prisoners","Gefangene transportiert":"Prisoners transported",
    "Verbandsprognose":"Alliance forecast","Platzierungsumfeld":"Ranking context","Wetter":"Weather","Events":"Events",
    "Kreditverlauf (heute)":"Credit history (today)","Sammle Daten...":"Collecting data...","Meilenstein in Credits":"Credit milestone",
    "Prognose aktualisieren":"Update forecast","Fahrzeuge gesamt":"Total vehicles","Gebäude gesamt":"Total buildings",
    "Gebäudetypen":"Building types","Fahrzeuge je Gebäude":"Vehicles per building","Standorte & Ausbauten":"Locations & extensions",
    "Verlaufspunkte":"History entries","Erster Eintrag":"First entry","Zeit":"Time","Credits":"Credits","Aenderung":"Change",
    "Einstellungen":"Settings","Schnellaktionen":"Quick actions","Updates":"Updates","Darstellung & Bedienung":"Appearance & controls",
    "Browser-Benachrichtigungen":"Browser notifications","Coins anzeigen":"Show coins","Spielzeit anzeigen":"Show playtime",
    "Menü-Modus":"Menu mode","Panel-Theme":"Panel theme","Kopfzeilen-Button":"Header button","Nur Logo":"Only logo","Standard ohne Events":"Standard without events","Nur Dein Verband":"Only Your Alliance",
    "Sprache":"Language","Wetter & Warnungen":"Weather & warnings","Land":"Country","Ort / PLZ":"City / postal code",
    "Anzeige":"Display","Aus":"Off","Nur Settings":"Settings only","Übersicht-Box":"Overview panel","Warnsound":"Warning sound",
    "An":"On","Warnton":"Warning tone","Informationen":"Information","Kontakt":"Contact","Patch-Notes":"Patch notes",
    "Keine Wetterdaten":"No weather data","Ort fehlt":"Location missing","Wetterdaten werden geladen...":"Loading weather data...",
    "Gefühlt":"Feels like","Feuchte":"Humidity","Niederschlag":"Precipitation","Wind":"Wind","Keine Warnung":"No warning","Nächste 7 Stunden":"Next 7 hours","7-Tage-Ausblick":"7-day outlook","Tageswerte: Min / Max":"Daily values: min / max",
    "Aktuell liegt keine DWD-Warnung für den Ort vor.":"There is currently no DWD warning for this location.",
    "Amtliche Warnungen sind derzeit nur für Deutschland angebunden.":"Official warnings are currently connected for Germany only.",
    "Lehrgang":"Course","Plätze":"Seats","Kosten":"Cost","Fertig":"Finishes","Öffnen":"Open","Aktive Lehrgänge":"Active courses",
    "Lehrgangsarten":"Course types","Alle Lehrgänge":"All courses","Freie Plätze":"Available seats","Lehrgänge durchsuchen...":"Search courses...",
    "Mitglied suchen...":"Search members...","Alle Rollen":"All roles","Leitung":"Leadership","Mitglieder ohne Leitungsrolle":"Regular members",
    "Mitglieder gesamt":"Total members","Leitungsteam":"Leadership team","Sonderrollen":"Special roles","Profil öffnen":"Open profile","Verbands-Eigentümer":"Owner","Spielerprognose":"Player forecast",
    "Automatisch aus den API-Ergebnissen berechnet.":"Calculated automatically from API results.",
    "Was zeigt der Verlauf?":"What does History show?","Heute":"Today","Gestern":"Yesterday","Aktualisieren":"Refresh",
    "Daten werden ausschließlich lokal in diesem Browser gespeichert.":"Data is stored locally in this browser only.",
    "Der Verlauf zeigt regelmäßig gespeicherte Stände der Verbandscredits.":"History shows regularly saved snapshots of the alliance credits.",
    "Er ist kein vollständiges Spielprotokoll: Werte entstehen nur, während das Skript Daten abrufen kann.":"It is not a complete game log: entries are created only while the script can retrieve data."
  },
  fr:{
    "Übersicht":"Aperçu","Verbandsprognose":"Prévision de l'alliance","Fuhrpark & Standorte":"Véhicules et sites",
    "Lehrgänge":"Formations","Verlauf":"Historique","Team":"Équipe","Mitglieder":"Membres","Event":"Événement","Einstellungen":"Paramètres",
    "Spielzeit":"Temps de jeu","Eigene Credits":"Vos crédits","Tagesverd.":"Gain du jour","Uhrzeit":"Heure",
    "Verband":"Alliance","Credits gesamt":"Crédits totaux","Verbandskasse":"Caisse de l'alliance","Platzierung":"Classement",
    "Mitglieder":"Membres","Coins":"Pièces","Tagesverdienst":"Gain du jour","Verbandsverdienst heute":"Gain de l'alliance aujourd'hui","Verbandsverdienst 7 Tage":"Gains de l'alliance sur 7 jours","Verbandsaktivität heute":"Activité de l'alliance aujourd'hui","Tageslage Verband":"Bilan quotidien de l'alliance","Einsätze":"Interventions","Einsätze abgeschlossen":"Interventions terminées","Patienten":"Patients","Patienten transportiert":"Patients transportés","Gefangene":"Prisonniers","Gefangene transportiert":"Prisonniers transportés",
    "Verbandsprognose":"Prévision de l'alliance","Platzierungsumfeld":"Classement voisin","Wetter":"Météo","Events":"Événements",
    "Kreditverlauf (heute)":"Historique des crédits (aujourd'hui)","Sammle Daten...":"Collecte des données...","Meilenstein in Credits":"Objectif de crédits",
    "Prognose aktualisieren":"Actualiser la prévision","Fahrzeuge gesamt":"Total des véhicules","Gebäude gesamt":"Total des bâtiments",
    "Gebäudetypen":"Types de bâtiments","Fahrzeuge je Gebäude":"Véhicules par bâtiment","Standorte & Ausbauten":"Sites et extensions",
    "Verlaufspunkte":"Entrées d'historique","Erster Eintrag":"Première entrée","Zeit":"Heure","Credits":"Crédits","Aenderung":"Variation",
    "Schnellaktionen":"Actions rapides","Updates":"Mises à jour","Darstellung & Bedienung":"Affichage et utilisation",
    "Browser-Benachrichtigungen":"Notifications du navigateur","Coins anzeigen":"Afficher les pièces","Spielzeit anzeigen":"Afficher le temps de jeu",
    "Menü-Modus":"Mode du menu","Panel-Theme":"Thème du panneau","Kopfzeilen-Button":"Bouton d’en-tête","Nur Logo":"Logo uniquement","Standard ohne Events":"Standard sans événements","Nur Dein Verband":"Alliance uniquement",
    "Sprache":"Langue","Wetter & Warnungen":"Météo et alertes","Land":"Pays","Ort / PLZ":"Ville / code postal",
    "Anzeige":"Affichage","Aus":"Désactivé","Nur Settings":"Paramètres uniquement","Übersicht-Box":"Bloc d'aperçu","Warnsound":"Son d'alerte",
    "An":"Activé","Warnton":"Sonnerie","Informationen":"Informations","Kontakt":"Contact","Patch-Notes":"Notes de version",
    "Keine Wetterdaten":"Aucune donnée météo","Ort fehlt":"Lieu manquant","Wetterdaten werden geladen...":"Chargement des données météo...",
    "Gefühlt":"Ressenti","Feuchte":"Humidité","Niederschlag":"Précipitations","Wind":"Vent","Keine Warnung":"Aucune alerte","Nächste 7 Stunden":"7 prochaines heures","7-Tage-Ausblick":"Prévisions sur 7 jours","Tageswerte: Min / Max":"Valeurs journalières : min / max",
    "Aktuell liegt keine DWD-Warnung für den Ort vor.":"Aucune alerte DWD n'est actuellement active pour ce lieu.",
    "Amtliche Warnungen sind derzeit nur für Deutschland angebunden.":"Les alertes officielles sont actuellement disponibles uniquement pour l'Allemagne.",
    "Lehrgang":"Formation","Plätze":"Places","Kosten":"Coût","Fertig":"Fin","Öffnen":"Ouvrir","Aktive Lehrgänge":"Formations actives",
    "Lehrgangsarten":"Types de formation","Alle Lehrgänge":"Toutes les formations","Freie Plätze":"Places disponibles","Lehrgänge durchsuchen...":"Rechercher une formation...",
    "Mitglied suchen...":"Rechercher un membre...","Alle Rollen":"Tous les rôles","Leitung":"Direction","Mitglieder ohne Leitungsrolle":"Membres réguliers",
    "Mitglieder gesamt":"Total des membres","Leitungsteam":"Équipe dirigeante","Sonderrollen":"Rôles spéciaux","Profil öffnen":"Ouvrir le profil","Verbands-Eigentümer":"Propriétaire de l’alliance","Spielerprognose":"Prévision du joueur",
    "Automatisch aus den API-Ergebnissen berechnet.":"Calculé automatiquement à partir des résultats de l'API.",
    "Was zeigt der Verlauf?":"Que montre l'historique ?","Heute":"Aujourd'hui","Gestern":"Hier","Aktualisieren":"Actualiser",
    "Daten werden ausschließlich lokal in diesem Browser gespeichert.":"Les données sont enregistrées uniquement dans ce navigateur.",
    "Der Verlauf zeigt regelmäßig gespeicherte Stände der Verbandscredits.":"L'historique affiche des instantanés réguliers des crédits de l'alliance.",
    "Er ist kein vollständiges Spielprotokoll: Werte entstehen nur, während das Skript Daten abrufen kann.":"Il ne s'agit pas d'un journal complet : les valeurs sont créées uniquement lorsque le script peut récupérer les données."
  }
};

const LEVELS = [
  {rank:"Anwärter(in)", need:0, reward:"10 Coins"},
  {rank:"Feuerwehrmann/-frau", need:200, reward:"10 Coins"},
  {rank:"Oberfeuerwehrmann/-frau", need:10000, reward:"10 Coins"},
  {rank:"Hauptfeuerwehrmann/-frau", need:100000, reward:"10 Coins"},
  {rank:"Stv. Gruppenführer(in)", need:1000000, reward:"10 Coins"},
  {rank:"Gruppenführer(in)", need:5000000, reward:"10 Coins"},
  {rank:"Stv. Zugführer(in)", need:10000000, reward:"10 Coins"},
  {rank:"Zugführer(in)", need:20000000, reward:"10 Coins"},
  {rank:"Stv. Wehrführer(in)", need:50000000, reward:"10 Coins"},
  {rank:"Wehrführer(in)", need:100000000, reward:"10 Coins"},
  {rank:"Stv. Kreisbrandmeister(in)", need:200000000, reward:"10 Coins"},
  {rank:"Kreisbrandmeister(in)", need:500000000, reward:"10 Coins"},
  {rank:"Stv. Landesbrandmeister(in)", need:1000000000, reward:"10 Coins"},
  {rank:"Landesbrandmeister(in)", need:2000000000, reward:"10 Coins"},
  {rank:"Ehrenmitglied", need:5000000000, reward:"10 Coins"},
  {rank:"Stv. Bundesbranddirektor", need:10000000000, reward:"10 Coins"},
  {rank:"Bundesbranddirektor(in)", need:20000000000, reward:"10 Coins"},
  {rank:"Stv. Internationale(r) Branddirektor(in)", need:50000000000, reward:"10 Coins"},
  {rank:"Internationaler Branddirektor(in)", need:100000000000, reward:"10 Coins"}
];

const ALLIANCE_ROLE_DEFS = [
  {id:"owner",label:"Verbands-Eigentümer",color:"#d8a91f",text:"#211800",aliases:["owner","eigentumer","eigentuemer","verbandseigentumer","verbandseigentuemer","verbands_eigentumer","verbands_eigentuemer","alliance_owner"]},
  {id:"admin",label:"Administrator",color:"#8f1d2c",text:"#ffffff",aliases:["admin","administrator","verbands_admin","alliance_admin"]},
  {id:"coadmin",label:"Co. Administrator",color:"#e44752",text:"#ffffff",aliases:["coadmin","co_admin","coadministrator","verbands_co_admin","alliance_coadmin"]},
  {id:"schooling",label:"Lehrgangsmeister",color:"#438bf2",text:"#ffffff",aliases:["schooling","schooling_admin","schooling_master","education","educator","lehrgangsmeister"]},
  {id:"radio",label:"Sprechwunsch Admin",color:"#72c8f2",text:"#082536",aliases:["speaker","radio","radio_admin","sprech_request","speak_request","mission"]},
  {id:"board",label:"Aufsichtsrat",color:"#ed8a2f",text:"#2d1500",aliases:["board","supervisor","oversight","aufsichtsrat"]},
  {id:"finance",label:"Finanzminister",color:"#8b5bd0",text:"#ffffff",aliases:["finance","treasurer","financial","finanzminister"]},
  {id:"personnel",label:"Personal",color:"#aeb8c6",text:"#17202b",aliases:["staff","personnel","personal","member_admin"]},
  {id:"event",label:"Eventmanager",color:"#a96835",text:"#ffffff",aliases:["event_manager","eventmanager","event"]},
];
const ITV = {
  clock:    1000,
  timer:    1000,
  alliance: 60000,
  userinfo: 60000,
  vstates:  90000,
  buildings:300000,
  schools:  300000,
  vehicles: 300000,
  dailyEarn:300000,
  weather: 900000,
  profile: 600000,
  footer:   10000,
  midnight: 60000,
};

const VSTATUS = {
  1:{l:"Einsatzbereit (Wache)",  s:"Wache",   c:"#22c55e"},
  2:{l:"Einsatzbereit (Funk)",   s:"Funk",    c:"#4ade80"},
  3:{l:"Im Einsatz",             s:"Einsatz", c:"#f59e0b"},
  4:{l:"Einsatz übernommen",     s:"Übernom.",c:"#fb923c"},
  5:{l:"Sprechwunsch",           s:"Sprech.", c:"#ef4444"},
  6:{l:"Nicht einsatzbereit",    s:"N.E.",    c:"#475569"},
  7:{l:"RD bereit",              s:"RD",      c:"#60a5fa"},
  9:{l:"Sonderfahrt",            s:"Sonder.", c:"#a855f7"},
};

const BICONS = {0:"B",1:"B",2:"B",3:"B",4:"B",5:"B",6:"B",7:"B",
  8:"B",9:"B",11:"B",12:"B",13:"B",14:"B",15:"B",
  18:"B",20:"B",21:"B",25:"B"};

const BUILDING_TYPES = {
  0:"Feuerwache",1:"Feuerwehrschule",2:"Rettungswache",3:"Rettungsschule",
  4:"Krankenhaus",5:"Rettungshubschrauber-Station",6:"Polizeiwache",7:"Leitstelle",
  8:"Polizeischule",9:"THW-Ortsverband",10:"THW-Bundesschule",11:"Bereitschaftspolizei",
  12:"Schnelleinsatzgruppe (SEG)",13:"Polizeihubschrauberstation",14:"Bereitstellungsraum",
  15:"Wasserrettung",16:"Verbandszellen",17:"Polizei-Sondereinheiten",
  18:"Feuerwache (Kleinwache)",19:"Polizeiwache (Kleinwache)",20:"Rettungswache (Kleinwache)",
  21:"Rettungshundestaffel",22:"Großer Komplex",23:"Kleiner Komplex",24:"Reiterstaffel",
  25:"Bergrettungswache",26:"Seenotrettungswache",27:"Schule für Seefahrt und Seenotrettung",
  28:"Hubschrauberstation (Seenotrettung)",29:"Autobahnpolizei"
};
const VSTATUS_ORDER=[2,4,1,3,5,6,7,9];

const BUILDING_CATEGORIES = [
  {name:"Feuerwehr",color:"#ef4444",types:[0,1,18]},
  {name:"Rettung & Medizin",color:"#f59e0b",types:[2,3,4,5,12,20,21,25]},
  {name:"Polizei",color:"#22c55e",types:[6,8,11,13,16,17,19,24,29]},
  {name:"THW",color:"#3b82f6",types:[9,10]},
  {name:"Wasserrettung",color:"#22d3ee",types:[15,26,27,28]},
  {name:"Organisation",color:"#a855f7",types:[7,14,22,23]}
];

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  CSS â€” DESIGN SYSTEM                                         â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

/* â”€â”€ Tokens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7 {
  --bg0:#080c12; --bg1:#0d1117; --bg2:#131920; --bg3:#18202a;
  --bg4:#1d2736; --bgh:#1e2d3e; --bgc:#162032;
  --b0:rgba(255,255,255,0.04); --b1:rgba(255,255,255,0.07);
  --b2:rgba(255,255,255,0.11); --b3:rgba(255,255,255,0.18);
  --blue:#3b82f6;  --blueh:#60a5fa; --blue3:rgba(59,130,246,0.13);
  --green:#22c55e; --greenh:#4ade80;--green3:rgba(34,197,94,0.10);
  --amber:#f59e0b; --amberh:#fbbf24;--amber3:rgba(245,158,11,0.10);
  --red:#ef4444;   --redh:#f87171;  --red3:rgba(239,68,68,0.10);
  --purple:#a855f7;--purpleh:#c084fc;--purple3:rgba(168,85,247,0.10);
  --cyan:#22d3ee;  --cyanh:#67e8f9; --cyan3:rgba(34,211,238,0.10);
  --pink:#ec4899;  --pinkh:#f472b6; --pink3:rgba(236,72,153,0.10);
  --t1:#f8fbff; --t2:#d8e1ec; --t3:#b1bdcb; --t4:#8a98aa;
  --r:10px; --rsm:6px; --rlg:14px; --rxl:18px;
  --font:'Inter',system-ui,sans-serif;
  --mono:'JetBrains Mono',monospace;
  color-scheme:dark;
  --sh:0 0 0 1px rgba(255,255,255,0.03) inset,
       0 4px 24px rgba(0,0,0,0.5),
       0 20px 60px rgba(0,0,0,0.6),
       0 0 80px rgba(0,0,0,0.4);
  box-sizing:border-box;
}
#lss7 *{box-sizing:border-box;}

/* â”€â”€ Floating Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7 {
  position:fixed; top:52px; right:14px;
  width:clamp(560px,48vw,860px); max-width:calc(100vw - 24px);
  height:calc(100vh - 66px); max-height:calc(100vh - 66px);
  min-width:480px; min-height:420px;
  background:var(--bg0);
  border:1px solid var(--b2);
  border-radius:var(--rxl);
  box-shadow:var(--sh);
  font-family:var(--font);
  color:var(--t1);
  z-index:9999;
  display:none;
  flex-direction:column;
  overflow:hidden;
  resize:horizontal;
  animation:lss7-in .18s cubic-bezier(.4,0,.2,1) both;
}
#lss7:not(.layout){width:clamp(560px,48vw,860px)!important;height:calc(100vh - 66px)!important;max-height:calc(100vh - 66px)!important;}
#lss7.open { display:flex; }
#lss7.layout{
  position:relative; top:auto; right:auto; left:auto;
  width:100%; max-width:100%;
  height:auto; max-height:none; min-height:0;
  margin:8px 0 12px;
  border-radius:10px;
  z-index:20;
  resize:none;
}
@media(max-width:700px){
  #lss7:not(.layout){top:48px;right:6px;width:calc(100vw - 12px);max-width:none;min-width:0;height:calc(100vh - 54px);max-height:none;border-radius:10px;resize:none;}
}
#lss7.layout #lss7-body{max-height:68vh;}
#lss7.layout #lss7-x{display:none;}
#lss7.layout.align-right{margin-left:auto;}
#lss7.layout.align-left{margin-right:auto;}
@keyframes lss7-in {
  from{opacity:0;transform:translateY(-8px) scale(.98)}
  to  {opacity:1;transform:translateY(0)   scale(1)}
}

/* â”€â”€ Nav Trigger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-btn {
  display:inline-flex !important;
  align-items:center; gap:7px;
  min-height:36px; padding:4px 11px; border-radius:8px;
  cursor:pointer; transition:all .18s ease;
  user-select:none; text-decoration:none !important;
  border:1px solid rgba(255,255,255,.08);
  background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));
  box-shadow:0 1px 0 rgba(255,255,255,.08) inset;
}
#lss7-btn:hover {
  background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.05)) !important;
  border-color:rgba(255,255,255,.14);
}
#lss7-btn .lss7-nav-mark{
  position:relative;width:26px;height:26px;border-radius:7px;flex-shrink:0;
  display:inline-flex;align-items:center;justify-content:center;
  color:#eaf5ff;font:900 9px/1 var(--mono);letter-spacing:.5px;
  background:linear-gradient(145deg,#2563eb,#0891b2 62%,#22c55e);
  border:1px solid rgba(255,255,255,.24);box-shadow:0 5px 14px rgba(8,145,178,.24),inset 0 1px rgba(255,255,255,.25);
  overflow:hidden;
}
.lss7-nav-mark::before{content:"";position:absolute;inset:3px;border:1px solid rgba(255,255,255,.32);border-radius:4px;transform:rotate(45deg);}
.lss7-nav-mark span{position:relative;z-index:1;text-shadow:0 1px 3px rgba(0,0,0,.38);}
.lss7-nav-mark i{position:absolute;right:2px;bottom:2px;width:5px;height:5px;border-radius:50%;background:#8bffba;box-shadow:0 0 8px #3cff91;}
.lss7-nav-copy{display:flex;flex-direction:column;gap:2px;line-height:1.05;min-width:0;}
.lss7-nav-lbl{font-size:12px;font-weight:800;color:rgba(255,255,255,.96);letter-spacing:.2px;}
.lss7-nav-events{display:flex;align-items:center;gap:3px;max-width:250px;overflow:hidden;}
.lss7-nav-event{font-size:7px;font-weight:900;color:#f9e6a2;letter-spacing:.25px;text-transform:uppercase;white-space:nowrap;}
.lss7-nav-event+.lss7-nav-event::before{content:"·";margin-right:3px;color:rgba(255,255,255,.38);}
.lss7-nav-arr   { font-size:9px; color:rgba(255,255,255,.45); transition:transform .2s; }
#lss7-btn.open .lss7-nav-arr { transform:rotate(180deg); }
#lss7-btn.nav-logo-only{padding:4px 6px;gap:0;}
#lss7-btn.nav-logo-only .lss7-nav-copy,
#lss7-btn.nav-logo-only .lss7-live,
#lss7-btn.nav-logo-only .lss7-nav-arr{display:none!important;}
#lss7-btn.nav-no-events .lss7-nav-events{display:none!important;}
#lss7-btn.nav-name-only .lss7-nav-mark,
#lss7-btn.nav-name-only .lss7-nav-events,
#lss7-btn.nav-name-only .lss7-live,
#lss7-btn.nav-name-only .lss7-nav-arr{display:none!important;}
#lss7-btn.nav-name-only .lss7-nav-copy{display:flex;}
.lss7-live {
  width:6px; height:6px; border-radius:50%;
  background:var(--green); box-shadow:0 0 5px var(--green);
  animation:lpulse 2.4s ease-in-out infinite;
}
@keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.65)}}

/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-hd {
  flex-shrink:0;
  background:linear-gradient(150deg,#0c1e36 0%,#080c12 65%);
  padding:14px 16px 13px;
  border-bottom:1px solid var(--b1);
  position:relative; overflow:hidden;
}
#lss7-summer-scene{
  display:none;position:absolute;inset:0;width:100%;height:100%;z-index:0;
  pointer-events:none;opacity:.92;transition:opacity .25s ease;
}
#lss7.theme-summer #lss7-summer-scene,
#lss7.theme-summer-dark #lss7-summer-scene{display:block;}
#lss7-hd>.hd-row,#lss7-hd>.lss7-update-note{position:relative;z-index:2;}
#lss7-hd::after {
  content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 80% 30%,rgba(59,130,246,.09) 0%,transparent 60%);
}
.hd-row   { display:flex; align-items:center; gap:10px;position:relative; }
.hd-mark{
  position:relative;width:40px;height:40px;border-radius:11px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;overflow:hidden;
  color:#f5fbff;font:950 12px/1 var(--mono);letter-spacing:1px;
  background:linear-gradient(145deg,#1d4ed8 0%,#0891b2 56%,#16a34a 100%);
  border:1px solid rgba(125,211,252,.38);
  box-shadow:0 10px 24px rgba(8,145,178,.19),inset 0 1px rgba(255,255,255,.24),inset 0 -10px 18px rgba(3,15,32,.22);
}
.hd-mark::before{content:"";position:absolute;width:24px;height:24px;border:1px solid rgba(255,255,255,.30);border-radius:7px;transform:rotate(45deg);}
.hd-mark::after{content:"";position:absolute;inset:auto 5px 5px auto;width:7px;height:7px;border-radius:50%;background:#86efac;box-shadow:0 0 12px #22c55e;animation:brand-live 2.2s ease-in-out infinite;}
.hd-mark span{position:relative;z-index:1;text-shadow:0 2px 5px rgba(0,0,0,.38);}
@keyframes brand-live{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.72)}}
.hd-title { font-size:14px;font-weight:700;color:var(--t1);line-height:1.2; }
.hd-sub   { font-size:10px;color:var(--t3);margin-top:1px; }
.hd-meta  { margin-left:auto;display:flex;align-items:center;gap:6px;min-width:0;flex-shrink:1; }
.hd-events{
  display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:nowrap;min-width:0;
  position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:4;
}
.hd-event-badge{
  appearance:none;display:inline-flex;align-items:center;gap:5px;min-height:24px;padding:3px 8px;
  border-radius:7px;border:1px solid var(--b2);color:var(--t1);background:rgba(255,255,255,.045);
  font:900 8px/1.15 var(--font);letter-spacing:.35px;text-transform:uppercase;white-space:nowrap;
  cursor:pointer;text-decoration:none!important;transition:transform .15s ease,filter .15s ease,box-shadow .15s ease;
}
.hd-event-badge:hover{transform:translateY(-1px);filter:brightness(1.12);color:var(--t1);}
.hd-event-badge::before{content:"";width:6px;height:6px;border-radius:50%;background:currentColor;box-shadow:0 0 8px currentColor;animation:event-dot 1.8s ease-in-out infinite;}
.hd-event-badge.event-sale{color:#e9d5ff;background:rgba(147,51,234,.14);border-color:rgba(192,132,252,.38);}
.hd-event-badge.event-credit{color:#fde68a;background:rgba(217,119,6,.15);border-color:rgba(251,191,36,.40);}
.hd-event-badge.event-coin{color:#fecaca;background:rgba(220,38,38,.14);border-color:rgba(248,113,113,.38);}
.hd-event-badge.event-live{color:#bae6fd;background:rgba(2,132,199,.14);border-color:rgba(56,189,248,.36);}
@keyframes event-dot{0%,100%{opacity:1}50%{opacity:.42}}
@media(max-width:980px){
  .hd-events{position:static;transform:none;margin-right:auto;overflow-x:auto;justify-content:flex-start;}
}

/* Badges */
.bd {font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;
     letter-spacing:.4px;white-space:nowrap;line-height:1.4;}
.bd-blue  {color:var(--blue);  background:var(--blue3);  border:1px solid rgba(59,130,246,.3);}
.bd-green {color:var(--green); background:var(--green3); border:1px solid rgba(34,197,94,.3);}
.bd-amber {color:var(--amber); background:var(--amber3); border:1px solid rgba(245,158,11,.3);}
.bd-red   {color:var(--red);   background:var(--red3);   border:1px solid rgba(239,68,68,.3);}
.bd-purple{color:var(--purple);background:var(--purple3);border:1px solid rgba(168,85,247,.3);}
.bd-cyan  {color:var(--cyan);  background:var(--cyan3);  border:1px solid rgba(34,211,238,.3);}
.bd-gold  {color:#f9e6a2;background:linear-gradient(180deg,rgba(201,146,36,.28),rgba(122,82,16,.24));border:1px solid rgba(245,195,92,.45);}

/* Close */
#lss7-x {
  width:26px;height:26px;border-radius:7px;flex-shrink:0;
  background:rgba(255,255,255,.04);border:1px solid var(--b1);
  color:var(--t3);font-size:12px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
#lss7-x:hover{background:var(--red3);color:var(--red);border-color:rgba(239,68,68,.4);}
#lss7-col{
  min-width:108px;height:26px;padding:0 8px;border-radius:7px;flex-shrink:0;
  background:rgba(255,255,255,.04);border:1px solid var(--b1);
  color:var(--t3);font-size:11px;font-weight:600;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
#lss7-col:hover{background:var(--blue3);color:var(--blueh);border-color:rgba(59,130,246,.35);}
#lss7.emb-collapsed:not(.layout){height:auto!important;max-height:none!important;}
#lss7.emb-collapsed .prof-strip,
#lss7.emb-collapsed #lss7-qs,
#lss7.emb-collapsed #lss7-tabs,
#lss7.emb-collapsed #lss7-body,
#lss7.emb-collapsed #lss7-changelog,
#lss7.emb-collapsed .lacc,
#lss7.emb-collapsed #lss7-ft{display:none !important;}

/* â”€â”€ Quick-Stats Strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-qs {
  flex-shrink:0;
  display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr 1px 1fr 1px 1fr;
  background:var(--bg1);border-bottom:1px solid var(--b1);
}
#lss7-qs.no-playtime{grid-template-columns:1fr 1px 1fr 1px 1fr 1px 1fr;}
#lss7-qs.no-coins{grid-template-columns:1fr 1px 1fr 1px 1fr 1px 1fr;}
#lss7-qs.no-playtime.no-coins{grid-template-columns:1fr 1px 1fr 1px 1fr;}
.qs-div{background:var(--b1);}
.qs-cell{padding:9px 11px;display:flex;flex-direction:column;gap:2px;cursor:default;}
.qs-cell.clickable{position:relative;cursor:pointer;}
.qs-cell.clickable:hover{background:rgba(255,255,255,.025);}
.qs-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t4);}
.qs-val{font-size:12px;font-weight:700;color:var(--t1);}
.qs-val.mono{font-family:var(--mono);font-size:12px;letter-spacing:1.2px;color:var(--green);}
.qs-val.sm  {font-size:10px;font-weight:750;color:var(--t1);}
.qs-clock{display:flex;flex-direction:column;gap:2px;line-height:1.1;}
.qs-clock-time{color:var(--t1);font:850 11px/1 var(--mono);letter-spacing:.25px;}
.qs-clock-date{color:var(--t3);font-size:8px;font-weight:750;white-space:nowrap;}
.pt-pop{
  position:absolute;top:100%;left:8px;z-index:2147483647;width:250px;
  margin-top:6px;padding:10px;border:1px solid var(--b2);border-radius:8px;
  background:var(--bg2);box-shadow:0 16px 38px rgba(0,0,0,.45);display:none;
}
.pt-pop.open{display:block;}
#lss7-qs{position:relative;z-index:40;overflow:visible!important;}
#lss7-tabs{position:relative;z-index:10;}
.pt-pop-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.pt-pop-t{font-size:11px;font-weight:800;color:var(--t1);}
.pt-pop-s{font-size:10px;color:var(--t4);}
.pt-row{display:grid;grid-template-columns:76px 1fr 72px;gap:7px;align-items:center;padding:5px 0;border-top:1px solid var(--b0);}
.pt-row:first-child{border-top:none;}
.pt-day{font-size:10px;color:var(--t3);font-weight:700;white-space:nowrap;}
.pt-bar{height:6px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;}
.pt-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--cyan),var(--blue));min-width:2px;}
.pt-time{font-size:10px;color:var(--green);font-weight:800;text-align:right;font-family:var(--mono);}
.prof-strip{
  flex-shrink:0;
  position:relative;
  margin:0;
  border-top:1px solid var(--b1);
  border-bottom:1px solid var(--b1);
  border-left:none;
  border-right:none;
  border-radius:0;
  background:
    radial-gradient(circle at 14% 0%,rgba(34,211,238,.12),transparent 34%),
    radial-gradient(circle at 92% 8%,rgba(245,158,11,.13),transparent 31%),
    linear-gradient(135deg,rgba(59,130,246,.12),rgba(34,211,238,.035)),
    linear-gradient(180deg,rgba(255,255,255,.025),rgba(255,255,255,.01));
  padding:13px 14px;
  overflow:hidden;
}
.prof-strip::before{
  content:"";position:absolute;left:0;top:0;bottom:0;width:3px;
  background:linear-gradient(180deg,var(--cyan),var(--blue),var(--amber));
  opacity:.82;
}
.prof-row{position:relative;display:grid;grid-template-columns:82px minmax(0,1fr) minmax(220px,250px);align-items:center;gap:16px;min-width:0;}
.prof-av{
  width:82px;height:70px;border-radius:12px;
  object-fit:cover;border:1px solid rgba(96,165,250,.36);background:var(--bg3);flex-shrink:0;
  box-shadow:0 14px 28px rgba(0,0,0,.26),0 0 0 3px rgba(34,211,238,.045);
}
.prof-meta{display:flex;flex-direction:column;gap:7px;min-width:0;flex:1;}
.prof-top{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;}
.prof-name{font-size:16px;font-weight:950;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.1;text-shadow:0 1px 12px rgba(96,165,250,.12);}
.prof-rank{
  display:inline-flex;align-items:center;max-width:100%;
  padding:4px 9px;border-radius:999px;border:1px solid rgba(34,211,238,.34);
  background:linear-gradient(135deg,rgba(34,211,238,.15),rgba(59,130,246,.08));font-size:10px;color:var(--cyanh);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:900;
  box-shadow:0 0 14px rgba(34,211,238,.08) inset;
}
.prof-progress-row{display:flex;align-items:center;justify-content:space-between;gap:10px;min-width:0;}
.prof-sub{font-size:10px;color:var(--t1);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prof-reward{font-size:10px;color:var(--amber);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none;font-weight:800;}
.prof-next{font-size:10px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none;font-weight:700;text-align:right;}
.prof-bar{height:9px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden;margin-top:0;border:1px solid rgba(255,255,255,.055);box-shadow:0 1px 0 rgba(255,255,255,.035) inset;}
.prof-fill{position:relative;height:100%;width:0%;background:linear-gradient(90deg,var(--blue),var(--cyan),#6ee7b7);overflow:hidden;}
.prof-fill::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.34),transparent);transform:translateX(-120%);animation:profile-progress-sheen 4.8s ease-in-out infinite;}
.prof-roles{display:flex;align-items:center;gap:5px;flex-wrap:wrap;min-height:0;}
.prof-badges{display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;}
.prof-placement{
  position:relative;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;
  min-height:78px;padding:12px 14px 12px 54px;border:1px solid rgba(245,158,11,.42);border-radius:11px;
  background:
    linear-gradient(135deg,rgba(245,158,11,.18),rgba(59,130,246,.10)),
    linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.012));
  color:var(--t1);overflow:hidden;isolation:isolate;
  box-shadow:0 14px 32px rgba(0,0,0,.23),0 1px 0 rgba(255,255,255,.07) inset,0 0 24px rgba(245,158,11,.08);
  cursor:pointer;text-align:left;transition:transform .18s ease,border-color .18s ease,box-shadow .18s ease,filter .18s ease;
}
.prof-placement::before{content:'#';position:absolute;left:15px;top:50%;transform:translateY(-52%);font:950 34px/1 var(--mono);color:var(--amber);opacity:.94;text-shadow:0 0 18px rgba(245,158,11,.32);z-index:1;}
.prof-placement::after{content:"";position:absolute;inset:-45% auto -45% -70%;width:58%;background:linear-gradient(90deg,transparent,rgba(255,255,255,.14),transparent);transform:rotate(15deg);animation:profile-placement-sweep 5.6s ease-in-out infinite;pointer-events:none;z-index:0;}
.prof-placement-kicker{font-size:7.5px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:var(--amberh);}
.prof-placement-kicker,.prof-placement-main,.prof-placement-caption{position:relative;z-index:1;}
.prof-placement-main{display:flex;align-items:center;gap:9px;min-width:0;margin-top:2px;}
.prof-placement strong{display:inline-flex;margin-top:0;font:950 17px/1.1 var(--mono);color:var(--t1);white-space:nowrap;}
.prof-placement small{display:block;margin-top:0;color:var(--t3);font-size:7.5px;}
.prof-placement-caption{display:block;margin-top:6px;color:var(--t4);font-size:8px;font-weight:850;letter-spacing:.25px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;}
.prof-placement:hover{transform:translateY(-2px);filter:brightness(1.04);border-color:rgba(245,158,11,.68);box-shadow:0 18px 38px rgba(0,0,0,.28),0 0 26px rgba(245,158,11,.16),0 1px 0 rgba(255,255,255,.09) inset;}
.prof-placement:active{transform:translateY(0);}
.prof-subnav{display:flex;align-items:center;gap:6px;margin-top:11px;padding-top:9px;border-top:1px solid var(--b1);}
.prof-view-btn{min-height:30px;padding:7px 12px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.026);color:var(--t2);font-size:8.5px;font-weight:900;cursor:pointer;transition:background .16s ease,border-color .16s ease,color .16s ease,transform .16s ease;}
.prof-view-btn:hover,.prof-view-btn.active{border-color:rgba(59,130,246,.48);background:linear-gradient(135deg,rgba(59,130,246,.18),rgba(34,211,238,.07));color:var(--blueh);box-shadow:0 8px 18px rgba(2,12,27,.18);}
.prof-view-btn:hover{transform:translateY(-1px);}
.prof-forecast-panel{display:none;margin-top:10px;padding:10px;border:1px solid var(--b1);border-radius:10px;background:linear-gradient(180deg,rgba(4,10,19,.24),rgba(4,10,19,.14));box-shadow:0 10px 28px rgba(0,0,0,.14) inset;}
.prof-forecast-panel.open{display:block;}
.prof-role{
  display:inline-flex;align-items:center;min-height:20px;padding:3px 8px;border-radius:6px;
  color:var(--role-text,#fff);background:var(--role-color,#2563eb);border:1px solid rgba(255,255,255,.25);
  font-size:8px;font-weight:950;letter-spacing:.45px;text-transform:uppercase;
  box-shadow:0 0 0 1px rgba(255,255,255,.07) inset,0 0 12px color-mix(in srgb,var(--role-color) 52%,transparent);
  animation:profile-role-glow 2.8s ease-in-out infinite;
}
.prof-role:nth-child(2){animation-delay:.4s}.prof-role:nth-child(3){animation-delay:.8s}
@keyframes profile-role-glow{0%,100%{filter:brightness(1);transform:translateY(0)}50%{filter:brightness(1.15);transform:translateY(-1px)}}
@keyframes profile-progress-sheen{0%,72%{transform:translateX(-125%)}88%,100%{transform:translateX(125%)}}
@keyframes profile-placement-sweep{0%,72%{left:-74%;opacity:.0}84%{opacity:.62}100%{left:132%;opacity:0}}
@media (prefers-reduced-motion: reduce){.prof-fill::after,.prof-placement::after,.prof-role{animation:none!important}.prof-placement,.prof-view-btn{transition:none!important}}
.prof-event-strip{
  flex-shrink:0;
  position:relative;
  display:flex;flex-direction:column;gap:0;
  padding:5px 12px;border-bottom:1px solid var(--b1);
  background:linear-gradient(90deg,rgba(245,158,11,.10),rgba(34,197,94,.035));
  overflow:visible;
  transition:background .22s ease,border-color .22s ease;
}
.prof-event-strip.idle{
  background:linear-gradient(90deg,rgba(255,255,255,.025),rgba(255,255,255,.01));
}
.prof-event-row{
  display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:8px;align-items:center;
  min-height:30px;padding:5px 0;border-top:1px solid rgba(255,255,255,.045);
  position:relative;
}
.prof-event-row:first-child{border-top:none;}
.prof-event-row-link{color:inherit!important;text-decoration:none!important;cursor:pointer;transition:background .15s ease,border-color .15s ease;}
.prof-event-row-link:hover{background:rgba(168,85,247,.075);}
.prof-event-row.active::after{
  content:"";position:absolute;left:0;right:0;bottom:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(245,158,11,.42),transparent);
  opacity:.55;
}
.prof-event-dot{
  width:8px;height:8px;border-radius:50%;background:var(--t4);
  box-shadow:0 0 0 3px rgba(255,255,255,.035);
}
.prof-event-strip.active .prof-event-dot{background:#22c55e;box-shadow:0 0 13px rgba(34,197,94,.75),0 0 0 3px rgba(34,197,94,.14);}
.prof-event-strip.idle .prof-event-dot{background:rgba(138,152,170,.72);}
.prof-event-main{min-width:0;display:flex;flex-direction:column;gap:2px;}
.prof-event-titleline{min-width:0;display:flex;align-items:center;gap:6px;}
.prof-event-gem{
  position:relative;width:22px;height:22px;border-radius:7px;
  display:inline-flex;align-items:center;justify-content:center;
  color:#ffe5a8;background:rgba(245,158,11,.13);
  border:1px solid rgba(245,158,11,.38);
  font-size:13px;font-weight:900;line-height:1;cursor:help;
  box-shadow:0 0 16px rgba(245,158,11,.12) inset,0 0 12px rgba(245,158,11,.12);
  flex-shrink:0;
}
.prof-event-strip.idle .prof-event-gem{
  color:var(--t4);background:rgba(255,255,255,.035);border-color:var(--b1);box-shadow:none;
}
.prof-event-gem.siren{
  color:#ffd0d0;background:rgba(239,68,68,.13);border-color:rgba(239,68,68,.38);
  box-shadow:0 0 16px rgba(239,68,68,.12) inset,0 0 12px rgba(239,68,68,.12);
}
.prof-event-gem.sale{
  color:#e9d5ff;background:rgba(168,85,247,.13);border-color:rgba(168,85,247,.4);
  box-shadow:0 0 16px rgba(168,85,247,.12) inset,0 0 12px rgba(168,85,247,.12);
}
.prof-event-tip{
  pointer-events:none;position:absolute;left:0;top:calc(100% + 9px);
  width:min(360px,calc(100vw - 42px));z-index:80;
  padding:10px 12px;border-radius:9px;border:1px solid rgba(245,158,11,.36);
  background:linear-gradient(180deg,rgba(22,18,10,.98),rgba(12,15,20,.98));
  box-shadow:0 18px 42px rgba(0,0,0,.58),0 0 0 1px rgba(255,255,255,.04) inset;
  color:var(--t2);font-size:11px;line-height:1.45;font-weight:650;
  opacity:0;transform:translate(0,-4px);transition:opacity .16s ease,transform .16s ease;
}
.prof-event-tip b{display:block;color:#ffe5a8;font-size:11px;margin-bottom:3px;}
.prof-event-gem.siren .prof-event-tip{border-color:rgba(239,68,68,.38);}
.prof-event-gem.siren .prof-event-tip b{color:#fecaca;}
.prof-event-gem.sale .prof-event-tip{border-color:rgba(168,85,247,.42);}
.prof-event-gem.sale .prof-event-tip b{color:#e9d5ff;}
.prof-event-gem:hover .prof-event-tip{opacity:1;transform:translate(0,0);}
.prof-event-label{
  min-width:0;font-size:11px;color:var(--t2);font-weight:800;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
}
.prof-event-strip.active .prof-event-label{color:#ffe5a8;}
.prof-event-type{
  font-size:9px;color:var(--t4);font-weight:800;text-transform:uppercase;letter-spacing:.45px;
}
.prof-event-time{
  font-size:11px;color:var(--green);font-family:var(--mono);font-weight:900;white-space:nowrap;
}
.prof-event-strip.idle .prof-event-time{color:var(--t4);}

/* â”€â”€ Notification Banner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-notif{flex-shrink:0;display:none;}
.notif-item{
  display:flex;align-items:center;gap:8px;
  padding:7px 14px;font-size:11px;border-bottom:1px solid var(--b1);
}
.notif-warn{background:var(--amber3);color:var(--amber);}
.notif-info{background:var(--blue3); color:var(--blueh);}
.notif-succ{background:var(--green3);color:var(--green);}
.notif-x{margin-left:auto;cursor:pointer;opacity:.6;}
.notif-x:hover{opacity:1;}

/* â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-tabs{
  flex-shrink:0;display:flex;
  background:var(--bg1);border-bottom:1px solid var(--b1);
  overflow-x:auto;scrollbar-width:thin;
  user-select:none;
  -webkit-overflow-scrolling:touch;
}
#lss7-tabs::-webkit-scrollbar{height:6px;}
#lss7-tabs::-webkit-scrollbar-track{background:rgba(255,255,255,.03);}
#lss7-tabs::-webkit-scrollbar-thumb{background:var(--b2);border-radius:6px;}
.ltab{
  flex-shrink:0;padding:8px 12px;cursor:pointer;user-select:none;
  font-size:11px;font-weight:600;color:var(--t4);
  border-bottom:2px solid transparent;
  display:flex;align-items:center;gap:4px;white-space:nowrap;
  transition:all .14s;
  touch-action:pan-x;
}
.ltab:hover{color:var(--t2);background:rgba(255,255,255,.03);}
.ltab.active{color:var(--blue);border-bottom-color:var(--blue);background:rgba(59,130,246,.05);}
.ltab[data-tab="tp-event"]{
  color:#f9e6a2;background:linear-gradient(180deg,rgba(201,146,36,.18),rgba(201,146,36,.04));
  border-left:1px solid rgba(245,195,92,.16);border-right:1px solid rgba(245,195,92,.16);
}
.ltab[data-tab="tp-event"].active{color:#ffe5a8;border-bottom-color:#f6d377;background:rgba(201,146,36,.22);}

/* â”€â”€ Scrollable Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-body{
  flex:1;overflow-y:auto;
  scrollbar-width:thin;scrollbar-color:var(--b2) transparent;
}
#lss7-body::-webkit-scrollbar{width:3px;}
#lss7-body::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px;}

.lpanel{display:none;}
.lpanel.active{display:block;}

/* â”€â”€ Section Label â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.lss7-sec{
  padding:6px 14px 3px;
  font-size:9px;font-weight:700;text-transform:uppercase;
  letter-spacing:1.2px;color:var(--t4);
  border-top:1px solid var(--b1);margin-top:2px;
}
.lss7-sec:first-child{border-top:none;margin-top:0;}

/* â”€â”€ Stat Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.sg{display:grid;gap:1px;background:var(--b1);}
.sg2{grid-template-columns:1fr 1fr;}
.sg3{grid-template-columns:1fr 1fr 1fr;}
.sg4{grid-template-columns:repeat(4,1fr);}
.sc{
  background:var(--bg0);padding:11px 13px;
  display:flex;flex-direction:column;gap:3px;
  transition:background .12s;cursor:default;
}
.sc:hover{background:var(--bgh);}
.sc.w2{grid-column:span 2;}
.sc.w3{grid-column:span 3;}
.sc.w4{grid-column:span 4;}
.sl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t4);}
.sv{font-size:16px;font-weight:700;color:var(--t1);letter-spacing:-.3px;line-height:1.2;}
.sv-sm{font-size:13px;font-weight:600;color:var(--t1);}
.ss{font-size:10px;color:var(--t4);margin-top:1px;}
.sv a{color:var(--blue);text-decoration:none;}
.sv a:hover{text-decoration:underline;color:var(--blueh);}
.c-gr{color:var(--green) !important;}
.c-bl{color:var(--blue)  !important;}
.c-am{color:var(--amber) !important;}
.c-re{color:var(--red)   !important;}
.c-pu{color:var(--purple)!important;}
.c-cy{color:var(--cyan)  !important;}
.c-mt{color:var(--t4)    !important;}

/* â”€â”€ Progress Bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.prg{height:3px;border-radius:2px;background:var(--b1);overflow:hidden;margin-top:5px;}
.prg-fill{height:100%;border-radius:2px;transition:width .6s ease;}

/* â”€â”€ Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#cv-wrap{padding:14px 14px 14px;border-top:1px solid var(--b1);}
.cv-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.cv-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t4);}
.cv-meta{font-size:10px;color:var(--t4);}
#lss7-chart{width:100%;height:96px;display:block;}

/* â”€â”€ Donut â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#donut-wrap{display:flex;align-items:center;gap:14px;padding:14px 14px 10px;}
#lss7-donut{width:88px;height:88px;flex-shrink:0;}
#lss7-donut .donut-total{fill:var(--t1);}
#lss7-donut .donut-label{fill:var(--t4);}
#donut-leg{flex:1;display:flex;flex-direction:column;gap:4px;}
.dl-row{display:flex;align-items:center;gap:6px;font-size:11px;}
.dl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.dl-lbl{color:var(--t3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;}
.dl-val{font-family:var(--mono);font-size:10px;font-weight:600;color:var(--t2);min-width:26px;text-align:right;}
.dl-pct{font-size:9px;color:var(--t4);min-width:30px;text-align:right;}

.vehicle-summary{
  display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:12px 14px 4px;
}
.vehicle-summary-card{
  min-width:0;padding:10px 11px;border:1px solid var(--b1);border-radius:8px;
  background:rgba(255,255,255,.025);display:flex;flex-direction:column;gap:4px;
}
.vehicle-summary-label{font-size:8px;color:var(--t4);font-weight:900;text-transform:uppercase;letter-spacing:.6px;}
.vehicle-summary-value{font-family:var(--mono);font-size:16px;color:var(--t1);font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vehicle-summary-value.green{color:var(--greenh);}.vehicle-summary-value.blue{color:var(--blueh);}.vehicle-summary-value.amber{color:var(--amberh);}
@media(max-width:620px){.vehicle-summary{grid-template-columns:repeat(2,minmax(0,1fr));}}

.asset-section{margin:10px 14px 14px;border:1px solid var(--b1);border-radius:8px;overflow:hidden;background:rgba(255,255,255,.018);}
.asset-section-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:11px 12px;border-bottom:1px solid var(--b1);background:rgba(255,255,255,.025);}
.asset-section-title{display:block;color:var(--t1);font-size:11px;font-weight:900;}
.asset-section-sub{display:block;margin-top:2px;color:var(--t4);font-size:9px;line-height:1.4;}
.asset-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:10px 11px;}
.asset-kpi{min-width:0;padding:8px 9px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.025);}
.asset-kpi-label{display:block;color:var(--t4);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.45px;}
.asset-kpi-value{display:block;margin-top:3px;color:var(--t1);font-family:var(--mono);font-size:14px;font-weight:900;}
.building-category-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;padding:0 11px 10px;}
.building-category-card{position:relative;min-width:0;padding:8px 9px 8px 12px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.018);overflow:hidden;}
.building-category-card:before{content:"";position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--cat);}
.building-category-name{display:block;color:var(--t3);font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.building-category-count{display:block;margin-top:2px;color:var(--t1);font-family:var(--mono);font-size:13px;font-weight:900;}
.asset-subhead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 11px;border-top:1px solid var(--b1);border-bottom:1px solid var(--b1);color:var(--t3);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.45px;background:rgba(255,255,255,.018);}
.building-detail-row{display:grid;grid-template-columns:minmax(130px,1.5fr) repeat(4,minmax(54px,.55fr));gap:8px;align-items:center;padding:8px 11px;border-bottom:1px solid var(--b0);}
.building-detail-row:last-child{border-bottom:0;}
.building-detail-row:hover{background:var(--bgh);}
.building-detail-name{min-width:0;color:var(--t1);font-size:10px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.building-detail-stat{min-width:0;text-align:right;color:var(--t2);font-family:var(--mono);font-size:9px;font-weight:800;}
.building-detail-stat small{display:block;color:var(--t4);font-family:var(--font);font-size:7px;font-weight:800;text-transform:uppercase;letter-spacing:.25px;}
.extension-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:10px 11px;}
.extension-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 8px;border:1px solid var(--b1);border-radius:6px;background:rgba(255,255,255,.018);}
.extension-name{min-width:0;color:var(--t2);font-size:9px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.extension-count{color:var(--t1);font-family:var(--mono);font-size:9px;font-weight:900;white-space:nowrap;}
.extension-count em{color:var(--greenh);font-style:normal;}
.asset-action-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end}.lbtn.compact{width:auto;min-height:27px;padding:5px 8px;font-size:8px;text-align:center;justify-content:center}
.quality-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px 12px}.quality-grid.compact-grid{padding-top:0}
.quality-card{min-width:0;padding:10px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.02)}.quality-card.good{border-color:rgba(34,197,94,.28);background:rgba(34,197,94,.07)}.quality-card.warn{border-color:rgba(245,158,11,.34);background:rgba(245,158,11,.10)}.quality-card.info{border-color:rgba(59,130,246,.28);background:rgba(59,130,246,.08)}
.quality-label{display:block;color:var(--t3);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.6px}.quality-card b{display:block;margin-top:4px;color:var(--t1);font:950 15px/1.1 var(--mono)}.quality-note{display:block;margin-top:4px;color:var(--t4);font-size:8px;line-height:1.35}
.fleet-type-board{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;padding:0 12px 12px}.fleet-type-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(80px,1.2fr) 44px;gap:8px;align-items:center;padding:7px 8px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.018)}.fleet-type-row span{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--t2);font-size:9px;font-weight:850}.fleet-type-row i{height:6px;border-radius:999px;background:rgba(255,255,255,.065);overflow:hidden}.fleet-type-row em{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--blue),var(--cyan));}.fleet-type-row b{text-align:right;color:var(--greenh);font-family:var(--mono);font-size:9px}
@media(max-width:680px){
  .asset-kpis,.building-category-grid,.quality-grid{grid-template-columns:repeat(2,minmax(0,1fr));}
  .fleet-type-board{grid-template-columns:1fr}.asset-action-row{justify-content:flex-start}
  .building-detail-row{grid-template-columns:minmax(120px,1.4fr) repeat(2,minmax(50px,.6fr));}
  .building-detail-row .building-detail-stat:nth-child(4),.building-detail-row .building-detail-stat:nth-child(5){display:none;}
  .extension-list{grid-template-columns:1fr;}
}

/* â”€â”€ Vehicle Bars â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.vb-wrap{padding:2px 14px 12px;}
.vb-row{display:flex;align-items:center;gap:7px;margin-bottom:5px;}
.vb-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.vb-lbl{font-size:11px;color:var(--t2);width:152px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.vb-bg{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.05);overflow:hidden;}
.vb-fill{height:100%;border-radius:2px;transition:width .7s cubic-bezier(.4,0,.2,1);}
.vb-num{font-family:var(--mono);font-size:10px;font-weight:600;color:var(--t3);min-width:24px;text-align:right;}
.vb-total{
  display:flex;justify-content:space-between;align-items:center;
  padding-top:8px;margin-top:4px;border-top:1px solid var(--b1);
  font-size:11px;color:var(--t4);
}
.vb-tv{font-family:var(--mono);font-size:14px;font-weight:700;color:var(--t1);}

/* â”€â”€ List Rows â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.lrow{
  display:flex;align-items:center;gap:8px;
  padding:7px 14px;border-bottom:1px solid var(--b0);
  font-size:11px;transition:background .12s;cursor:default;
}
.lrow:last-child{border-bottom:none;}
.lrow:hover{background:var(--bgh);}
.lrow-icon{font-size:13px;flex-shrink:0;}
.lrow-name{flex:1;color:var(--t2);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.lrow-val{
  font-family:var(--mono);font-size:11px;font-weight:700;color:var(--t2);
  background:rgba(255,255,255,.05);border:1px solid var(--b1);
  border-radius:4px;padding:1px 7px;flex-shrink:0;
}
.lrow-sub{font-size:10px;color:var(--t4);flex-shrink:0;}
.sch-row{
  display:grid;grid-template-columns:minmax(0,1fr) 58px 92px 96px 72px;
  gap:8px;align-items:center;padding:7px 12px;border-bottom:1px solid var(--b0);font-size:11px;
}
.sch-row:last-child{border-bottom:none;}
.sch-row:hover{background:var(--bgh);}
.sch-name{color:var(--t1);font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sch-sub{display:block;margin-top:2px;color:var(--t3);font-size:10px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sch-seats,.sch-cost,.sch-finish{font-family:var(--mono);font-size:10px;text-align:right;color:var(--t2);font-weight:700;}
.sch-seats{color:var(--greenh);}
.schooling-toolbar,.team-toolbar{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--b1);background:rgba(255,255,255,.018);}
.schooling-toolbar .lss7-select,.team-toolbar .lss7-select{flex:1 1 180px;max-width:none;}
.schooling-toolbar button{width:auto;flex:0 0 auto;}
.sch-open{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 9px;border:1px solid rgba(59,130,246,.34);border-radius:6px;background:var(--blue3);color:var(--blueh);font-size:9px;font-weight:900;text-decoration:none;}
.sch-open:hover{background:rgba(59,130,246,.2);color:var(--t1);}
.sch-row.is-hidden,.team-card.is-hidden{display:none;}
@media(max-width:650px){.sch-row{grid-template-columns:minmax(0,1fr) 54px 68px}.sch-cost,.sch-finish{display:none}.schooling-toolbar,.team-toolbar{flex-wrap:wrap}}

/* Verbandsverdienst */
#alliance-earn-board{padding:10px 12px;}
.alli-earn-list{display:flex;flex-direction:column;gap:5px;}
.alli-earn-row{display:grid;grid-template-columns:70px minmax(0,1fr) 126px;gap:8px;align-items:center;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,.02);}
.alli-earn-row.today{background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.22);}
.alli-earn-row.zero .alli-earn-bar{background:rgba(96,165,250,.055);}
.alli-earn-row.zero .alli-earn-fill{width:100% !important;background:linear-gradient(90deg,rgba(96,165,250,.18),rgba(34,197,94,.10));opacity:.7;}
.alli-earn-day{font-size:10px;color:var(--t3);font-weight:700;white-space:nowrap;}
.alli-earn-bar{display:block;height:9px;border-radius:999px;background:rgba(255,255,255,.09);overflow:hidden;box-shadow:inset 0 0 0 1px rgba(255,255,255,.035);}
.alli-earn-fill{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#15803d,#22c55e,#86efac);min-width:14px;box-shadow:0 0 12px rgba(34,197,94,.45);}
.alli-earn-val{font-size:11px;color:var(--green);font-family:var(--mono);font-weight:700;text-align:right;white-space:nowrap;}
.alli-earn-empty{font-size:11px;color:var(--t3);padding:6px 2px;}

/* Verbandsprognose */
#forecast-board{padding:10px 12px;}
.forecast-controls{
  display:grid;grid-template-columns:minmax(220px,1fr) auto;
  gap:8px;align-items:end;padding:12px;margin-bottom:10px;
  border:1px solid var(--b1);background:rgba(255,255,255,.025);border-radius:8px;
}
.forecast-control{display:flex;flex-direction:column;gap:5px;min-width:0;}
.forecast-control span{font-size:9px;color:var(--t4);font-weight:900;text-transform:uppercase;letter-spacing:.5px;}
.forecast-controls .lss7-select{width:100%;max-width:none;}
@media(max-width:620px){.forecast-controls{grid-template-columns:1fr}.forecast-controls .lbtn{width:100%;}}
.forecast-wrap{padding:14px;display:flex;flex-direction:column;gap:12px;}
.forecast-beta{display:flex;align-items:flex-start;gap:9px;padding:10px 11px;border-radius:8px;border:1px solid rgba(245,158,11,.58);border-left:4px solid #f59e0b;background:linear-gradient(90deg,rgba(245,158,11,.18),rgba(245,158,11,.07));color:#ffe8aa;font-size:10px;line-height:1.45;box-shadow:0 0 18px rgba(245,158,11,.07) inset;}
.forecast-beta b{display:inline-flex;align-items:center;padding:2px 6px;border-radius:5px;background:#f59e0b;color:#171006;white-space:nowrap;font-size:9px;letter-spacing:.5px;}
.forecast-beta-badge{display:inline-flex;align-items:center;padding:3px 7px;border-radius:999px;background:rgba(245,158,11,.18);border:1px solid rgba(245,158,11,.58);color:#fcd34d!important;font-size:9px!important;font-weight:950!important;letter-spacing:.55px;text-transform:uppercase;}
.forecast-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;}
.forecast-title{font-size:15px;font-weight:900;color:var(--t1);}
.forecast-sub{margin-top:3px;font-size:10px;color:var(--t3);line-height:1.4;}
.forecast-status{flex-shrink:0;padding:4px 8px;border-radius:999px;border:1px solid var(--b2);background:rgba(255,255,255,.04);font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;}
.forecast-status.good{color:#86efac;border-color:rgba(34,197,94,.34);background:rgba(34,197,94,.10);}
.forecast-status.warn{color:#fcd34d;border-color:rgba(245,158,11,.34);background:rgba(245,158,11,.10);}
.forecast-status.bad{color:#fca5a5;border-color:rgba(239,68,68,.34);background:rgba(239,68,68,.10);}
.forecast-kpis{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--b1);border:1px solid var(--b1);border-radius:8px;overflow:hidden;}
.forecast-kpi{padding:10px;background:var(--bg1);min-width:0;}
.forecast-k{font-size:8px;color:var(--t4);text-transform:uppercase;letter-spacing:.7px;font-weight:800;}
.forecast-v{display:block;margin-top:4px;color:var(--t1);font-size:12px;font-family:var(--mono);font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.forecast-v.green{color:var(--greenh);}.forecast-v.amber{color:var(--amberh);}.forecast-v.blue{color:var(--blueh);}
.forecast-progress{height:10px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;border:1px solid rgba(255,255,255,.04);}
.forecast-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#2563eb,#22c55e,#86efac);transition:width .5s ease;}
.forecast-progress-meta{display:flex;justify-content:space-between;gap:10px;margin-top:5px;font-size:9px;color:var(--t4);}
.forecast-color-legend{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:7px;color:var(--t4);font-size:7.5px;font-weight:850;}
.forecast-color-legend span{display:inline-flex;align-items:center;gap:4px;}
.forecast-color-legend i{display:inline-block;width:8px;height:8px;border-radius:50%;}
.forecast-color-legend .l-blue i{background:var(--blue);}
.forecast-color-legend .l-green i{background:var(--green);}
.forecast-color-legend .l-amber i{background:var(--amber);}
.forecast-chart-box{padding:10px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.018);}
.forecast-chart-head{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px;font-size:9px;color:var(--t4);text-transform:uppercase;letter-spacing:.6px;font-weight:800;}
.forecast-canvas{display:block;width:100%;height:150px;}
.forecast-mini{display:flex;flex-direction:column;gap:10px;}
.forecast-mini .forecast-beta{padding:7px 9px;align-items:center;}
.forecast-mini-card{display:grid;grid-template-columns:minmax(155px,.8fr) minmax(0,1.2fr);gap:12px;align-items:stretch;}
.forecast-mini-hero{display:flex;flex-direction:column;justify-content:center;padding:12px;border:1px solid rgba(34,197,94,.25);border-radius:8px;background:linear-gradient(135deg,rgba(34,197,94,.10),rgba(59,130,246,.06));}
.forecast-mini-label{font-size:8px;color:var(--t4);font-weight:900;text-transform:uppercase;letter-spacing:.65px;}
.forecast-mini-time{margin-top:3px;font-family:var(--mono);font-size:22px;line-height:1.05;color:var(--greenh);font-weight:900;}
.forecast-mini-date{margin-top:5px;font-size:10px;color:var(--t2);font-weight:750;}
.forecast-mini-data{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
.forecast-mini-stat{padding:8px 9px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.022);min-width:0;}
.forecast-mini-stat span{display:block;font-size:8px;color:var(--t4);font-weight:850;text-transform:uppercase;letter-spacing:.45px;}
.forecast-mini-stat b{display:block;margin-top:3px;font-size:10px;color:var(--t1);font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.forecast-mini-stat b.green{color:var(--greenh);}.forecast-mini-stat b.amber{color:var(--amberh);}
.forecast-mini-progress{height:9px;border-radius:999px;background:rgba(255,255,255,.07);overflow:hidden;border:1px solid rgba(255,255,255,.035);}
.forecast-mini-progress span{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--blue),var(--green));}
.forecast-mini-foot{display:flex;justify-content:space-between;gap:10px;font-size:9px;color:var(--t4);}
@media(max-width:560px){.forecast-mini-card{grid-template-columns:1fr}.forecast-mini-time{font-size:19px;}}
@media(max-width:700px){.forecast-kpis{grid-template-columns:repeat(2,minmax(0,1fr));}.forecast-canvas{height:130px;}}

.forecast-pro .forecast-head{position:relative;padding:14px;border:1px solid rgba(59,130,246,.24);border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(34,211,238,.045));overflow:hidden;}
.forecast-pro .forecast-head::after{content:"";position:absolute;right:-46px;top:-70px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.16),transparent 66%);pointer-events:none;}
.forecast-pro .forecast-title{font-size:16px;font-weight:950;}
.forecast-pro .forecast-sub{margin-top:4px;line-height:1.5;max-width:780px;}
.forecast-pro .forecast-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;background:transparent;border:0;border-radius:0;overflow:visible;}
.forecast-pro .forecast-kpi{position:relative;padding:11px;border:1px solid var(--b1);border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.032),rgba(255,255,255,.012));overflow:hidden;}
.forecast-pro .forecast-kpi::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--blue),var(--cyan));opacity:.42;}
.forecast-pro .forecast-kpi small{display:block;margin-top:4px;color:var(--t4);font-size:8px;line-height:1.35;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.forecast-v.red{color:#fca5a5;}
.forecast-mini.pro .forecast-mini-card{grid-template-columns:minmax(170px,.78fr) minmax(0,1.22fr);}
.forecast-mini.pro .forecast-mini-hero{position:relative;padding:13px;border-color:rgba(34,197,94,.28);border-radius:9px;background:linear-gradient(135deg,rgba(34,197,94,.12),rgba(59,130,246,.07));overflow:hidden;}
.forecast-mini.pro .forecast-mini-hero::after{content:"";position:absolute;right:-24px;top:-34px;width:96px;height:96px;border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.18),transparent 66%);}
.forecast-mini.pro .forecast-mini-time{font-size:24px;font-weight:950;}
.forecast-mini.pro .forecast-mini-data{grid-template-columns:repeat(3,minmax(0,1fr));}
.forecast-mini-stat b.blue{color:var(--blueh);}.forecast-mini-stat b.red{color:#fca5a5;}
.forecast-details{display:grid;grid-template-columns:minmax(0,1.08fr) minmax(260px,.92fr);gap:10px;}
.forecast-panel{border:1px solid var(--b1);border-radius:9px;background:rgba(255,255,255,.018);padding:11px;min-width:0;}
.forecast-panel-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px;color:var(--t2);font-size:10px;font-weight:950;letter-spacing:.55px;text-transform:uppercase;}
.forecast-panel-title span{color:var(--t4);font-size:8px;font-weight:850;text-transform:none;letter-spacing:0;}
.forecast-horizon{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}
.forecast-horizon-card{padding:9px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.018);}
.forecast-horizon-card span{display:block;color:var(--t4);font-size:8px;font-weight:850;text-transform:uppercase;letter-spacing:.45px;}
.forecast-horizon-card b{display:block;margin-top:4px;color:var(--t1);font:900 11px/1.1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.forecast-insights{display:flex;flex-direction:column;gap:7px;}
.forecast-insight{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;padding:7px 8px;border:1px solid var(--b0);border-radius:7px;background:rgba(255,255,255,.014);}
.forecast-insight span{color:var(--t3);font-size:9px;font-weight:800;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.forecast-insight b{color:var(--t1);font:900 10px/1.1 var(--mono);white-space:nowrap;}
.forecast-quality{height:8px;border-radius:999px;background:rgba(255,255,255,.075);overflow:hidden;border:1px solid rgba(255,255,255,.035);}
.forecast-quality span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#f59e0b,#22c55e);}
.overview-command{grid-column:1/-1;position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:15px;border:1px solid rgba(59,130,246,.25);border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,.13),rgba(34,211,238,.045));overflow:hidden;}
.overview-command::after{content:"";position:absolute;right:-40px;top:-64px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.16),transparent 66%);pointer-events:none;}
.overview-command-copy{position:relative;z-index:1;min-width:0;}
.overview-eyebrow{display:block;color:var(--blueh);font-size:8px;font-weight:950;letter-spacing:.9px;text-transform:uppercase;}
.overview-title{display:block;margin-top:4px;color:var(--t1);font:950 17px/1.15 var(--head);}
.overview-title a{color:var(--t1);text-decoration:none;}
.overview-title a:hover{color:var(--blueh);text-decoration:underline;}
.overview-title-suffix{margin-left:6px;color:var(--t3);font-weight:850;}
.overview-sub{display:block;margin-top:5px;color:var(--t3);font-size:10px;line-height:1.45;max-width:820px;}
.overview-command-metrics{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(110px,1fr));gap:7px;min-width:250px;}
.overview-pill{padding:8px 9px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.028);}
.overview-pill span{display:block;color:var(--t4);font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.45px;}
.overview-pill b{display:block;margin-top:3px;color:var(--t1);font:950 11px/1.1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.sc.overview-card{position:relative;border-radius:8px;background:linear-gradient(180deg,rgba(255,255,255,.032),rgba(255,255,255,.012));border:1px solid rgba(148,163,184,.12);overflow:hidden;}
.sc.overview-card::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--card-accent,var(--blue));opacity:.58;}
.sc.overview-card .sv{font-size:17px;font-weight:900;}
.overview-card.alliance{--card-accent:var(--blueh)}.overview-card.total{--card-accent:var(--green)}.overview-card.cash{--card-accent:var(--cyan)}.overview-card.rank{--card-accent:var(--amber)}.overview-card.members{--card-accent:var(--blue)}
.overview-card.members{background:linear-gradient(135deg,rgba(59,130,246,.08),rgba(34,197,94,.035))!important;}
@media(max-width:760px){.forecast-details,.forecast-mini.pro .forecast-mini-card,.overview-command{grid-template-columns:1fr}.forecast-mini.pro .forecast-mini-data,.forecast-horizon,.forecast-pro .forecast-kpis{grid-template-columns:repeat(2,minmax(0,1fr));}.overview-command-metrics{min-width:0;grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:560px){.forecast-mini.pro .forecast-mini-data,.forecast-horizon,.forecast-pro .forecast-kpis,.overview-command-metrics{grid-template-columns:1fr}.forecast-canvas{height:130px;}}

/* â”€â”€ Credit History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.hist-row{
  display:flex;gap:8px;padding:5px 14px;
  border-bottom:1px solid var(--b0);font-size:11px;align-items:center;
}
.hist-row:last-child{border-bottom:none;}
.hist-t{color:var(--t4);min-width:54px;font-family:var(--mono);font-size:10px;}
.hist-v{flex:1;font-weight:600;color:var(--t2);font-family:var(--mono);}
.hist-d{min-width:72px;text-align:right;font-family:var(--mono);font-size:10px;font-weight:700;}
.history-explain{margin:10px 12px;}

/* â”€â”€ KM-Tabelle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.km-row{
  display:flex;align-items:center;gap:8px;
  padding:5px 14px;border-bottom:1px solid var(--b0);font-size:11px;
}
.km-row:last-child{border-bottom:none;}
.km-name{flex:1;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.km-total{font-family:var(--mono);font-size:10px;font-weight:700;color:var(--t2);min-width:60px;text-align:right;}
.km-30d  {font-family:var(--mono);font-size:10px;color:var(--green);min-width:58px;text-align:right;}

/* â”€â”€ ARR Table â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.arr-row{
  display:flex;align-items:center;gap:8px;
  padding:6px 14px;border-bottom:1px solid var(--b0);
  font-size:11px;transition:background .12s;
}
.arr-row:last-child{border-bottom:none;}
.arr-row:hover{background:var(--bgh);}
.arr-color{width:10px;height:10px;border-radius:50%;flex-shrink:0;border:1px solid rgba(255,255,255,.1);}
.arr-name{flex:1;color:var(--t2);font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.arr-name small{display:block;margin-top:2px;color:var(--t4);font-size:8px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.arr-hk{font-family:var(--mono);font-size:10px;color:var(--t4);background:var(--b1);
  border-radius:3px;padding:1px 5px;flex-shrink:0;}

/* â”€â”€ Team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.tg-head{
  padding:7px 14px 4px;font-size:9px;font-weight:700;
  text-transform:uppercase;letter-spacing:1.2px;color:var(--t4);
}
.tm-row{
  display:flex;align-items:center;gap:8px;
  padding:5px 14px;border-bottom:1px solid var(--b0);
  transition:background .12s;
}
.tm-row:hover{background:var(--bgh);}
.tm-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.tm-link{flex:1;font-size:12px;font-weight:500;color:var(--t2);text-decoration:none;}
.tm-link:hover{color:var(--t1);}
.tm-badge{
  font-size:9px;font-weight:700;padding:1px 6px;
  border-radius:4px;letter-spacing:.4px;flex-shrink:0;
}
.team-summary{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;padding:12px;}
.team-summary-card{padding:10px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.022);}
.team-summary-card span{display:block;color:var(--t4);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.55px;}
.team-summary-card b{display:block;margin-top:4px;color:var(--t1);font:900 18px/1 var(--mono);}
.team-summary-card.online b{color:var(--greenh);}
.team-category{margin:0 12px 10px;border:1px solid var(--b1);border-radius:8px;overflow:hidden;background:rgba(255,255,255,.012);}
.team-category-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 10px;border-bottom:1px solid var(--b1);background:rgba(255,255,255,.025);}
.team-category-title{display:flex;align-items:center;gap:7px;color:var(--t1);font-size:10px;font-weight:900;}
.team-category-dot{width:9px;height:9px;border-radius:50%;background:var(--role-color);box-shadow:0 0 7px var(--role-color);}
.team-category-count{color:var(--t4);font:800 9px/1 var(--mono);}
.team-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:9px;}
.team-card{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:9px;align-items:center;padding:10px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.02);transition:background .15s,border-color .15s,transform .15s;}
.team-card:hover{background:var(--bgh);border-color:var(--b3);transform:translateY(-1px);}
.team-avatar{width:38px;height:38px;border-radius:7px;display:flex;align-items:center;justify-content:center;background:linear-gradient(145deg,var(--blue3),var(--green3));border:1px solid var(--b2);color:var(--t1);font-size:12px;font-weight:950;}
.team-main{min-width:0;}.team-name{display:block;color:var(--t1);font-size:11px;font-weight:850;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.team-badges{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;}.team-role{padding:2px 5px;border-radius:4px;border:1px solid var(--b2);background:rgba(255,255,255,.04);color:var(--role-color);font-size:8px;font-weight:900;}
.team-role-owner{--role-color:#d8a91f;background:rgba(216,169,31,.14);border-color:rgba(216,169,31,.42)}.team-role-admin{--role-color:#c74a58;background:rgba(143,29,44,.18);border-color:rgba(143,29,44,.48)}.team-role-coadmin{--role-color:#e96670;background:rgba(228,71,82,.15);border-color:rgba(228,71,82,.44)}.team-role-radio{--role-color:#72c8f2;background:rgba(114,200,242,.14);border-color:rgba(114,200,242,.42)}.team-role-board{--role-color:#ed8a2f;background:rgba(237,138,47,.14);border-color:rgba(237,138,47,.42)}.team-role-finance{--role-color:#b98af0;background:rgba(165,106,232,.15);border-color:rgba(165,106,232,.44)}.team-role-schooling{--role-color:#6da5f5;background:rgba(67,139,242,.15);border-color:rgba(67,139,242,.44)}.team-role-personnel{--role-color:#c6ced9;background:rgba(174,184,198,.13);border-color:rgba(174,184,198,.40)}.team-role-event{--role-color:#c68b5b;background:rgba(183,121,69,.15);border-color:rgba(183,121,69,.44)}.team-role-member{--role-color:var(--t3)}.team-role-other{--role-color:var(--cyan)}
.team-open{width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;border:1px solid var(--b1);background:rgba(255,255,255,.03);color:var(--blueh);text-decoration:none;font-weight:900;}
.team-open:hover{background:var(--blue3);color:var(--t1);}
.team-empty-filter{display:none;margin:0 12px 12px;}.team-category.is-hidden{display:none;}
@media(max-width:1000px){.team-grid{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:640px){.team-summary{grid-template-columns:repeat(2,minmax(0,1fr));}.team-grid{grid-template-columns:1fr;}}

/* â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.set-wrap{padding:14px;display:grid;grid-template-columns:1fr;gap:10px;align-items:start;}
#lss7.layout .set-wrap{grid-template-columns:repeat(12,minmax(0,1fr));}
.settings-intro,.set-wide{grid-column:1/-1;}
.settings-intro{order:0}.nav-style-setting{order:1}.settings-actions{order:2}.settings-export{order:3}.settings-updates{order:4}.settings-appearance{order:5}.settings-feature-grid{order:6}.settings-patch-notes{order:7}.settings-contact{order:8}.settings-diagnostics{order:9}.settings-info{order:10}
.settings-intro{padding:12px 13px;border:1px solid rgba(59,130,246,.24);border-radius:8px;background:linear-gradient(135deg,rgba(59,130,246,.10),rgba(34,197,94,.035));}
.settings-intro b{display:block;color:var(--t1);font-size:13px;margin-bottom:3px;}
.settings-intro span{font-size:10px;color:var(--t3);line-height:1.45;}
.set-head{font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.8px;color:var(--t2);padding-bottom:7px;margin-bottom:2px;border-bottom:1px solid var(--b1);}
.set-group{display:flex;flex-direction:column;gap:6px;padding:11px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.018);min-width:0;}
.hotkey-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
.hotkey-capture{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;
  width:100%;min-height:58px;padding:10px 11px;border:1px solid var(--b1);border-radius:8px;
  background:linear-gradient(135deg,rgba(59,130,246,.07),rgba(255,255,255,.018));
  color:var(--t2);text-align:left;cursor:pointer;transition:border-color .16s,background .16s,transform .16s;
}
.hotkey-capture:hover{border-color:var(--b2);background:var(--bgh);transform:translateY(-1px);}
.hotkey-capture.recording{border-color:rgba(34,211,238,.58);background:rgba(34,211,238,.10);box-shadow:0 0 0 1px rgba(34,211,238,.15) inset;}
.hotkey-title{font-size:10px;font-weight:850;color:var(--t2);min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hotkey-value{grid-row:1/3;grid-column:2;min-width:86px;padding:6px 8px;border-radius:7px;border:1px solid var(--b2);background:rgba(0,0,0,.18);color:var(--t1);font:900 11px/1 var(--mono);text-align:center;}
.hotkey-hint{font-size:8px;color:var(--t4);font-weight:750;}
.set-group .tog-row{min-height:40px;}
.set-group .lss7-select{flex:0 1 220px;min-width:0;}
.set-group .set-note{margin-top:2px;}
.settings-feature-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;}
.settings-feature-column{display:flex;flex-direction:column;gap:10px;min-width:0;}
.settings-feature-column>.set-group{flex:0 0 auto;}
.settings-info-grid{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:18px;align-items:start;}
.diagnostics-note{width:100%;max-width:none!important;min-height:72px;resize:vertical;font-family:var(--mono);line-height:1.45;}
.diagnostics-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;}
.settings-diagnostics{border-color:rgba(34,211,238,.22)!important;background:linear-gradient(135deg,rgba(34,211,238,.055),rgba(59,130,246,.025))!important;}
.diagnostics-results{display:flex;flex-direction:column;gap:6px;margin-top:2px;}
.diagnostics-result{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:center;padding:8px 9px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.018);}
.diagnostics-result i{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:999px;font-style:normal;font-size:10px;font-weight:950;border:1px solid var(--b2);}
.diagnostics-result.ok i{color:#86efac;border-color:rgba(34,197,94,.42);background:rgba(34,197,94,.12);}
.diagnostics-result.warn i{color:#fde68a;border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.13);}
.diagnostics-result.error i{color:#fecaca;border-color:rgba(239,68,68,.45);background:rgba(239,68,68,.13);}
.diagnostics-result b{display:block;color:var(--t1);font-size:10px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.diagnostics-result span{display:block;margin-top:2px;color:var(--t3);font-size:8.5px;line-height:1.35;}
.diagnostics-result small{color:var(--t4);font:850 8px/1 var(--mono);text-transform:uppercase;}
.settings-contact .set-note{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;}
.settings-contact .set-note>div{margin-top:0!important;}.settings-contact .lbtn{min-width:170px;justify-content:center;}
.settings-category{grid-column:1/-1;border:1px solid var(--b1);border-radius:12px;overflow:hidden;background:rgba(255,255,255,.012);box-shadow:0 8px 24px rgba(0,0,0,.07);}
.settings-category-head{padding:12px 14px;border-bottom:1px solid var(--b1);background:linear-gradient(90deg,rgba(59,130,246,.09),rgba(34,211,238,.025));}
.settings-category-head b{display:block;color:var(--t1);font-size:12px;font-weight:950;}
.settings-category-head span{display:block;margin-top:3px;color:var(--t3);font-size:9px;line-height:1.4;}
.settings-category-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:10px;}
.settings-category-grid>.set-group{grid-column:auto!important;margin:0!important;box-shadow:none!important;}
.settings-category-grid>.set-group:only-child{grid-column:1/-1!important;}
.settings-category-grid>.settings-credit-popups,.settings-category-grid>.settings-actions,.settings-category-grid>.settings-export,.settings-category-grid>.settings-diagnostics,.settings-category-grid>.settings-info,.settings-category-grid>.settings-contact,.settings-category-grid>.settings-patch-notes,.settings-category-grid>.settings-updates,.settings-category-grid>.nav-style-setting{grid-column:1/-1!important;}
#lss7.theme-light .settings-category,#lss7.theme-summer .settings-category{background:rgba(255,255,255,.52);}
#lss7.theme-lcars .settings-category{border-radius:18px 7px 7px 18px;background:#090b10;border-color:rgba(232,169,88,.20);box-shadow:inset 5px 0 rgba(232,169,88,.72);}
#lss7.theme-lcars .settings-category-head{background:#10131a;border-color:rgba(232,169,88,.20);}
@media(max-width:920px){.settings-feature-grid,.settings-info-grid{grid-template-columns:1fr}.settings-contact .set-note,.diagnostics-actions{grid-template-columns:1fr}.settings-contact .lbtn{width:100%}}
@media(max-width:760px){#lss7.layout .set-wrap{grid-template-columns:1fr}.set-wide,.settings-intro{grid-column:1}.settings-category-grid{grid-template-columns:1fr}.settings-category-grid>.set-group{grid-column:1!important;}}
.lbtn{
  display:flex;align-items:center;gap:8px;padding:9px 12px;
  font-size:12px;font-weight:600;font-family:var(--font);
  color:var(--t3);background:rgba(255,255,255,.04);
  border:1px solid var(--b1);border-radius:var(--rsm);
  cursor:pointer;transition:all .15s;text-align:left;width:100%;
}
.lbtn:hover{background:rgba(255,255,255,.08);color:var(--t1);border-color:var(--b3);}
.lbtn.danger:hover{background:var(--red3);color:var(--red);border-color:rgba(239,68,68,.4);}
.lbtn.prime{background:var(--blue3);color:var(--blue);border-color:rgba(59,130,246,.4);}
.lbtn.prime:hover{background:rgba(59,130,246,.2);color:var(--blueh);}
.lbtn-i{font-size:14px;flex-shrink:0;}

/* Toggle */
.tog-row{
  display:flex;align-items:center;gap:10px;padding:8px 12px;
  border:1px solid var(--b1);border-radius:var(--rsm);
  background:rgba(255,255,255,.02);cursor:pointer;
}
.tog-lbl{flex:1;font-size:12px;color:var(--t2);font-weight:500;user-select:none;}
.tog-track{
  width:36px;height:20px;border-radius:10px;background:var(--b2);
  position:relative;transition:background .2s;flex-shrink:0;
}
.tog-track.on{background:var(--blue);}
.tog-knob{
  position:absolute;top:3px;left:3px;
  width:14px;height:14px;border-radius:50%;background:#fff;
  transition:transform .2s;box-shadow:0 1px 4px rgba(0,0,0,.4);
}
.tog-track.on .tog-knob{transform:translateX(16px);}

/* Settings info blocks */
.set-note{
  padding:10px 12px;border:1px solid var(--b1);border-radius:var(--rsm);
  background:rgba(255,255,255,.02);font-size:11px;color:var(--t3);line-height:1.45;
}
.set-note b{color:var(--t1);}

/* Events */
.event-card{
  padding:14px;border:1px solid var(--b1);border-radius:var(--rlg);
  background:linear-gradient(180deg,rgba(59,130,246,.10),rgba(255,255,255,.015));
  display:flex;flex-direction:column;gap:12px;
}
.event-top{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.event-title{font-size:15px;font-weight:800;color:var(--t1);}
.event-sub{font-size:11px;color:var(--t3);line-height:1.45;}
.event-count{
  padding:10px 12px;border:1px solid rgba(96,165,250,.25);border-radius:10px;
  background:rgba(59,130,246,.10);font-size:24px;font-weight:900;letter-spacing:.4px;
  color:var(--blueh);font-family:var(--mono);
}
.event-status{display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
.event-pill{
  display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;
  background:rgba(34,197,94,.13);border:1px solid rgba(34,197,94,.34);color:#7cffb2;
  font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.45px;
}
.event-pill::before{content:"";width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 12px rgba(34,197,94,.8);}
.event-count-lbl{font-size:10px;color:var(--t3);text-transform:uppercase;letter-spacing:.7px;font-weight:800;}
.event-grid{
  display:grid;grid-template-columns:1fr 1fr;gap:8px;
}
.event-kpi{
  padding:10px 12px;border:1px solid var(--b1);border-radius:var(--rsm);
  background:rgba(255,255,255,.02);display:flex;flex-direction:column;gap:4px;
}
.event-k{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--t3);}
.event-v{font-size:12px;color:var(--t1);font-weight:600;line-height:1.35;}
.event-actions{display:flex;gap:8px;flex-wrap:wrap;}
.event-actions .lbtn{width:auto;flex:1;justify-content:center;}
.event-note{font-size:11px;color:var(--t3);line-height:1.45;}
.event-source{font-size:10px;color:var(--t3);text-align:right;}
.game-events-card{
  display:flex;flex-direction:column;gap:9px;
  padding:12px;border:1px solid rgba(245,158,11,.32);border-radius:10px;
  background:linear-gradient(180deg,rgba(245,158,11,.13),rgba(34,197,94,.035));
  box-shadow:0 0 22px rgba(245,158,11,.07) inset;
}
.game-events-head{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.game-events-title{font-size:12px;font-weight:900;color:#ffe5a8;text-transform:uppercase;letter-spacing:.55px;}
.game-events-live{
  display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border-radius:999px;
  border:1px solid rgba(34,197,94,.38);background:rgba(34,197,94,.14);
  color:#86efac;font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:.5px;
}
.game-events-live::before{content:"";width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 12px rgba(34,197,94,.9);}
.game-events-list{display:flex;flex-direction:column;gap:7px;}
.game-event-row{
  display:grid;grid-template-columns:36px minmax(0,1fr) auto;gap:9px;align-items:center;
  padding:8px 9px;border:1px solid rgba(255,255,255,.08);border-radius:8px;
  background:rgba(8,12,18,.38);
}
.game-event-row-link{color:inherit!important;text-decoration:none!important;cursor:pointer;transition:border-color .15s ease,background .15s ease,transform .15s ease;}
.game-event-row-link:hover{border-color:rgba(168,85,247,.42);background:rgba(168,85,247,.08);transform:translateY(-1px);}
.game-event-ico{
  width:30px;height:30px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;
  border:1px solid rgba(245,158,11,.35);background:rgba(245,158,11,.15);
  color:#ffe5a8;font-size:14px;font-weight:900;
}
.game-event-main{min-width:0;}
.game-event-title{font-size:12px;color:var(--t1);font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.game-event-desc{margin-top:2px;font-size:10px;color:var(--t3);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.game-event-time{
  min-width:76px;text-align:right;color:#86efac;font-family:var(--mono);
  font-size:12px;font-weight:900;white-space:nowrap;
}
.game-events-mini{display:flex;flex-direction:column;gap:6px;margin-bottom:8px;}
.game-events-mini .game-event-row{grid-template-columns:30px minmax(0,1fr) auto;padding:7px 8px;background:rgba(245,158,11,.08);border-color:rgba(245,158,11,.24);}
.game-events-mini .game-event-ico{width:24px;height:24px;font-size:12px;}
.game-events-mini .game-event-title{font-size:11px;}
.game-events-mini .game-event-desc{display:none;}
.game-events-mini .game-event-time{font-size:11px;}
.weather-mini{display:block;}
.wx-card{
  display:grid;grid-template-columns:minmax(260px,.75fr) minmax(420px,1.25fr);gap:10px;align-items:start;
  padding:0;width:100%;
}
.weather-head{
  display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px;align-items:center;
  padding:8px 10px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.025);
}
.wx-place{display:flex;align-items:center;gap:8px;min-width:0;}
.wx-icon{
  width:28px;height:28px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;
  background:rgba(96,165,250,.12);border:1px solid rgba(96,165,250,.24);font-size:16px;flex-shrink:0;
}
.wx-place-main{min-width:0;}
.wx-city{display:block;font-size:11px;color:var(--t1);font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.wx-desc{display:block;font-size:9px;color:var(--t3);margin-top:1px;}
.wx-now{text-align:right;white-space:nowrap;}
.wx-temp{display:block;font-size:17px;line-height:1;color:var(--cyan);font-weight:900;font-family:var(--mono);}
.wx-wind{display:block;margin-top:3px;font-size:9px;color:var(--t3);font-family:var(--mono);}
.weather-mini .w-l{font-size:11px;color:var(--t2);}
.weather-mini .w-r{font-size:11px;color:var(--cyan);font-family:var(--mono);}
.weather-forecast{display:grid;grid-template-columns:repeat(7,minmax(58px,1fr));gap:6px;padding:0;min-width:0;}
.wx-chip{
  border:1px solid var(--b1);background:rgba(255,255,255,.025);border-radius:7px;
  padding:6px 5px;font-size:9px;color:var(--t2);text-align:center;min-width:0;
}
.wx-chip b{display:block;font-size:9px;color:var(--t3);font-family:var(--mono);margin-bottom:2px;}
.wx-chip span{display:block;color:var(--t1);font-weight:800;white-space:nowrap;font-size:10px;}
.wx-chip em{display:block;margin-top:2px;color:var(--t4);font-style:normal;font-size:8px;white-space:nowrap;}
.wx-forecast-block{min-width:0;}
.wx-trend-block{grid-column:1/-1;min-width:0;}
.wx-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 5px;color:var(--t3);font-size:8px;font-weight:900;letter-spacing:.65px;text-transform:uppercase;}
.wx-section-title span{color:var(--t4);font-weight:750;letter-spacing:0;text-transform:none;white-space:nowrap;}
.wx-trend{display:grid;grid-template-columns:repeat(7,minmax(88px,1fr));gap:7px;padding-top:2px;overflow-x:auto;}
.wx-day{min-width:88px;padding:8px 7px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.025);text-align:center;}
.wx-day-name{display:block;color:var(--t3);font-size:9px;font-weight:900;text-transform:uppercase;}
.wx-day-icon{display:block;margin:4px 0 3px;font-size:18px;line-height:1;}
.wx-day-temp{display:block;color:var(--t1);font:900 10px/1.3 var(--mono);white-space:nowrap;}
.wx-day-meta{display:flex;justify-content:center;gap:6px;margin-top:4px;color:var(--t4);font-size:8px;white-space:nowrap;}
.wx-alert{margin-top:6px;font-size:10px;color:var(--amber);}
.wx-warn{
  grid-column:1/-1;padding:8px 9px;border-radius:7px;border:1px solid var(--b1);font-size:10px;line-height:1.35;display:block;width:auto;
}
.wx-warn b{font-size:10px;text-transform:uppercase;letter-spacing:.4px;}
.wx-warn.lvl0{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.35);color:#4ade80;}
.wx-warn.lvl2{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.35);color:#fbbf24;}
.wx-warn.lvl3{background:rgba(249,115,22,.12);border-color:rgba(249,115,22,.35);color:#fb923c;}
.wx-warn.lvl4{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35);color:#f87171;}
.wx-warn.lvl5{background:rgba(168,85,247,.12);border-color:rgba(168,85,247,.35);color:#c084fc;}
.wx-src{grid-column:1/-1;font-size:9px;color:var(--t4);text-align:right;opacity:.72;margin-top:-4px;}
.wx-details{grid-column:1/-1;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;}
.wx-detail{padding:6px 8px;border-radius:7px;border:1px solid var(--b1);background:rgba(255,255,255,.025);}
.wx-detail-k{display:block;font-size:8px;color:var(--t4);text-transform:uppercase;letter-spacing:.6px;font-weight:800;}
.wx-detail-v{display:block;margin-top:2px;font-size:10px;color:var(--t1);font-family:var(--mono);font-weight:800;}
#lss7:not(.layout) .wx-card{grid-template-columns:1fr;max-width:none;}
#lss7:not(.layout) .weather-forecast{grid-template-columns:repeat(4,minmax(0,1fr));overflow:visible;}
#lss7:not(.layout) .wx-details{grid-template-columns:repeat(2,minmax(0,1fr));}
#lss7:not(.layout) .wx-trend{grid-template-columns:repeat(7,minmax(92px,1fr));}
@media (max-width:640px){
  .wx-card{grid-template-columns:1fr;max-width:none;}
  .weather-forecast{grid-template-columns:repeat(4,minmax(0,1fr));}
  .wx-details{grid-template-columns:repeat(2,minmax(0,1fr));}
  .wx-trend{grid-template-columns:repeat(7,94px);}
}

#lss7-changelog{
  flex-shrink:0;border-top:1px solid var(--b1);
  padding:8px 12px;font-size:11px;color:var(--t3);
  background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));
}
#lss7-changelog b{color:var(--blueh);}

/* Light mode */
#lss7.theme-light{
  --bg0:#f7fafc; --bg1:#edf2f7; --bg2:#e2e8f0; --bg3:#dbe3ee;
  --bg4:#d3deea; --bgh:#dde7f2; --bgc:#eaf1f8;
  --b0:rgba(15,23,42,0.04); --b1:rgba(15,23,42,0.10);
  --b2:rgba(15,23,42,0.16); --b3:rgba(15,23,42,0.24);
  --t1:#0f172a; --t2:#1e293b; --t3:#475569; --t4:#64748b;
  color-scheme:light;
  box-shadow:0 0 0 1px rgba(15,23,42,.06) inset,0 10px 40px rgba(15,23,42,.18);
}

/* Summer 2026 */
#lss7.theme-summer{
  --bg0:#f6fbfd; --bg1:#edf8fc; --bg2:#e3f3f8; --bg3:#d8edf3; --bg4:#cce6ee;
  --bgh:#dcf2ef; --bgc:#fff9e8;
  --b0:rgba(22,50,73,.045); --b1:rgba(22,50,73,.10);
  --b2:rgba(22,50,73,.17); --b3:rgba(22,50,73,.25);
  --blue:#1687c8; --blueh:#0f6fa8; --blue3:rgba(22,135,200,.12);
  --green:#2f9e5b; --greenh:#247d49; --green3:rgba(47,158,91,.12);
  --amber:#e6a300; --amberh:#bd7f00; --amber3:rgba(230,163,0,.13);
  --red:#dc4c56; --redh:#ba3640; --red3:rgba(220,76,86,.11);
  --purple:#8b62bf; --purpleh:#70499f; --purple3:rgba(139,98,191,.11);
  --cyan:#0e9c9a; --cyanh:#087c7b; --cyan3:rgba(14,156,154,.11);
  --pink:#dc5f86; --pinkh:#bd4168; --pink3:rgba(220,95,134,.11);
  --t1:#163249; --t2:#29495f; --t3:#526d7c; --t4:#738c98;
  color-scheme:light;
  box-shadow:0 0 0 1px rgba(22,135,200,.08) inset,0 14px 42px rgba(29,82,104,.22),0 24px 70px rgba(29,82,104,.12);
}
#lss7.theme-summer #lss7-hd{
  background:
    linear-gradient(115deg,rgba(255,255,255,.78),rgba(255,255,255,.16) 48%,transparent 72%),
    linear-gradient(135deg,#bcecff 0%,#dcf6f3 56%,#fff1a8 100%);
  border-bottom-color:rgba(22,135,200,.16);
}
#lss7.theme-summer #lss7-hd::before{
  content:'☀';position:absolute;right:18px;top:-17px;font-size:62px;line-height:1;
  color:#f2b600;opacity:.22;pointer-events:none;transform:rotate(9deg);
  filter:drop-shadow(0 4px 10px rgba(230,163,0,.18));
}
#lss7.theme-summer #lss7-hd::after{
  content:'✿  ✿';inset:auto 132px 5px auto;width:auto;height:auto;
  background:none;color:rgba(220,95,134,.42);font-size:13px;letter-spacing:7px;
  pointer-events:none;
}
#lss7.theme-summer.summer-webgl-ready #lss7-hd::before,
#lss7.theme-summer.summer-webgl-ready #lss7-hd::after{opacity:0;}
#lss7.theme-summer #lss7-hd .hd-row,
#lss7.theme-summer #lss7-hd .lss7-update-note{position:relative;z-index:1;}
#lss7.theme-summer .hd-mark{
  color:#ffffff;background:linear-gradient(145deg,#1687c8,#19a66a 68%,#e5ad24);
  border-color:rgba(22,135,200,.34);box-shadow:0 6px 16px rgba(22,135,200,.19),inset 0 1px rgba(255,255,255,.32);
}
#lss7.theme-summer .prof-strip{
  background:
    linear-gradient(120deg,rgba(22,135,200,.10),rgba(47,158,91,.07) 58%,rgba(255,213,79,.13)),
    rgba(255,255,255,.44);
}
#lss7.theme-summer{
  background:
    linear-gradient(180deg,rgba(255,255,255,.32),transparent 130px),
    linear-gradient(145deg,#f7fcfe,#edf9f7 56%,#fff9e7);
}
#lss7.theme-summer #lss7-body{
  background:
    linear-gradient(90deg,rgba(22,135,200,.025) 1px,transparent 1px),
    linear-gradient(rgba(47,158,91,.022) 1px,transparent 1px),
    linear-gradient(145deg,#f8fcfe,#f2faf8 70%,#fffaf0);
  background-size:34px 34px,34px 34px,auto;
}
#lss7.theme-summer #lss7-tabs,
#lss7.theme-summer #lss7-qs{
  background:rgba(237,248,252,.94);backdrop-filter:blur(8px);
}
#lss7.theme-summer .sc,
#lss7.theme-summer .set-group,
#lss7.theme-summer .forecast-controls,
#lss7.theme-summer .forecast-chart-box{
  background:rgba(255,255,255,.68);border-color:rgba(22,80,104,.13);
  box-shadow:0 7px 20px rgba(37,102,126,.07),0 1px 0 rgba(255,255,255,.85) inset;
}
#lss7.theme-summer .sc:hover{border-color:rgba(22,135,200,.24);}
#lss7.theme-summer .qs-cell.clickable:hover{background:rgba(22,135,200,.06);}
#lss7.theme-summer .prof-fill,
#lss7.theme-summer .pt-fill{
  background:linear-gradient(90deg,#19a6c7,#38b66b 58%,#f1bd28);
}
#lss7.theme-summer .ltab.active{
  color:#0f6fa8;background:linear-gradient(180deg,rgba(255,255,255,.62),rgba(22,135,200,.08));
}
#lss7.theme-summer .ltab.active::after{background:linear-gradient(90deg,#1687c8,#2f9e5b,#e6a300);}
#lss7.theme-summer .lbtn.prime{
  background:linear-gradient(135deg,#1687c8,#0e9c9a);border-color:rgba(15,111,168,.35);color:#fff;
}
#lss7.theme-summer .forecast-beta{
  color:#5a3b00;background:linear-gradient(105deg,#fff0a8,#fff8dc 62%,#fffdf5);
  border-color:#d18a00;border-left-color:#c87600;
  box-shadow:0 8px 20px rgba(195,125,0,.10),0 1px 0 rgba(255,255,255,.9) inset;
  font-size:10.5px;font-weight:650;
}
#lss7.theme-summer .forecast-beta b{
  color:#fff;background:#9a5700;box-shadow:0 2px 7px rgba(126,68,0,.22);
}
#lss7.theme-summer .forecast-beta-badge{
  color:#fff!important;background:#9a5700;border-color:#6f3d00;
  box-shadow:0 2px 8px rgba(126,68,0,.22);
}
#lss7.theme-summer .ltab[data-tab="tp-forecast"]{
  color:#704400;font-weight:850;background:rgba(255,222,99,.18);
}
#lss7.theme-summer .ltab[data-tab="tp-forecast"].active{
  color:#513000;background:linear-gradient(180deg,#fff1ac,#fff8df);
}
#lss7.theme-summer .forecast-status.good{color:#146b3b;background:#e0f6e8;border-color:#55a875;}
#lss7.theme-summer .forecast-status.warn{color:#754600;background:#fff1bd;border-color:#c58a19;}
#lss7.theme-summer .forecast-status.bad{color:#922d38;background:#ffe4e7;border-color:#d66a73;}
#lss7.theme-summer .vehicle-summary-card{
  background:linear-gradient(145deg,rgba(255,255,255,.92),rgba(231,247,248,.78));
  border-color:rgba(22,80,104,.16);box-shadow:0 6px 16px rgba(37,102,126,.07);
}
#lss7.theme-summer .vehicle-summary-value{color:#163249;}
#lss7.theme-summer .vehicle-summary-value.green{color:#197442;}
#lss7.theme-summer .vehicle-summary-value.blue{color:#0f6fa8;}
#lss7.theme-summer .vehicle-summary-value.amber{color:#8a5600;}
#lss7.theme-summer .dl-val,
#lss7.theme-summer .vb-num{
  color:#15384e;background:#e4f5fa;border:1px solid rgba(15,111,168,.24);
  border-radius:5px;padding:2px 6px;font-weight:950;min-width:34px;
}
#lss7.theme-summer .dl-pct{color:#526674;font-weight:850;}
#lss7.theme-summer .vb-tv{
  color:#fff;background:#0f6fa8;border:1px solid #0a5e90;border-radius:7px;
  padding:3px 9px;text-shadow:none;box-shadow:0 4px 12px rgba(15,111,168,.20);
}
#lss7.theme-summer .prof-event-strip{background:linear-gradient(90deg,#fff9dd,#eef9f1);border-bottom-color:rgba(103,119,73,.22);box-shadow:inset 4px 0 #e5ad24;}
#lss7.theme-summer .prof-event-strip.idle{background:rgba(255,255,255,.62);box-shadow:inset 4px 0 #8ca2ad;}
#lss7.theme-summer .prof-event-row{border-top-color:rgba(22,80,104,.12);}
#lss7.theme-summer .prof-event-label,
#lss7.theme-summer .prof-event-strip.active .prof-event-label{color:#243f4f;}
#lss7.theme-summer .prof-event-type{color:#5b7180;}
#lss7.theme-summer .prof-event-time{color:#0d6537;background:#e1f6e9;border:1px solid #71b68c;border-radius:6px;padding:3px 6px;}
#lss7.theme-summer .prof-event-strip.idle .prof-event-time{color:#526b79;background:#eef3f5;border-color:#b8c7ce;}
#lss7.theme-summer .prof-event-gem{color:#744700;background:#fff0b5;border-color:#c58a19;box-shadow:none;}
#lss7.theme-summer .prof-event-gem.siren{color:#8d2732;background:#ffe4e7;border-color:#d66a73;box-shadow:none;}
#lss7.theme-summer .prof-event-gem.sale,
#lss7.theme-summer .game-event-ico.sale{
  color:#fff;background:#7b3e9d;border-color:#5f287e;text-shadow:none;
  box-shadow:0 4px 12px rgba(95,40,126,.20);font-weight:950;
}
#lss7.theme-summer .bd-gold,
#lss7.theme-summer .event-pill{
  color:#634100;background:linear-gradient(180deg,#ffe99d,#ffd96a);border-color:#c99720;
  text-shadow:none;
}
#lss7.theme-summer .ltab[data-tab="tp-event"]{
  color:#664300;background:linear-gradient(180deg,#fff2bd,#fff9e7);
  border-color:rgba(184,126,0,.22);
}
#lss7.theme-summer .ltab[data-tab="tp-event"].active{
  color:#4e3200;border-bottom-color:#c48300;background:#ffe9a0;
}
#lss7.theme-summer .set-note{color:#425f70;background:rgba(255,255,255,.58);}
#lss7.theme-summer .set-note b{color:#754600;}
#lss7.theme-summer .game-event-row{background:rgba(255,255,255,.62);}
#lss7.theme-summer .game-events-title{color:#704600;}
#lss7.theme-summer .game-events-live{color:#146b3b;background:#e1f6e9;border-color:#58a978;}
#lss7.theme-summer .game-event-title{color:#1d3f54;}
#lss7.theme-summer .game-event-time{color:#197442;}
#lss7.theme-summer .wx-warn.lvl0{color:#146b3b;background:#e1f6e9;border-color:#58a978;}
#lss7.theme-summer .wx-warn.lvl2{color:#754600;background:#fff1bd;border-color:#c58a19;}
#lss7.theme-summer .wx-warn.lvl3{color:#983b10;background:#ffe6cc;border-color:#d77b37;}
#lss7.theme-summer .wx-warn.lvl4{color:#922d38;background:#ffe4e7;border-color:#d66a73;}
#lss7.theme-summer .lss7-update-note{color:#146b3b;background:#e1f6e9;border-color:#58a978;}
#lss7.theme-summer .lss7-update-note.available{color:#754600;background:#fff1bd;border-color:#c58a19;}
#lss7.theme-summer .set-group,
#lss7.theme-summer .patch-ver,
#lss7.theme-summer .rank-mini-row{
  box-shadow:0 1px 0 rgba(255,255,255,.66) inset;
}
#lss7.theme-summer .rank-mini-row.me{
  background:linear-gradient(90deg,rgba(22,135,200,.13),rgba(47,158,91,.08));
  border-color:rgba(22,135,200,.32);
}
#lss7.theme-summer.layout #lss7-summer-scene{opacity:1;filter:saturate(1.08);}
#lss7.theme-summer.layout .hd-mark{animation:summer-float 3.4s ease-in-out infinite;}
#lss7.theme-summer.layout .bd-summer{animation:summer-glow 2.8s ease-in-out infinite;}
#lss7.theme-summer.layout .sc,
#lss7.theme-summer.layout .vehicle-summary-card{animation:summer-card-in .42s cubic-bezier(.2,.8,.2,1) both;}
#lss7.theme-summer.layout .sc:nth-child(2n),
#lss7.theme-summer.layout .vehicle-summary-card:nth-child(2n){animation-delay:.05s;}
#lss7.theme-summer.layout .prof-fill,
#lss7.theme-summer.layout .forecast-progress-fill,
#lss7.theme-summer.layout .vb-fill{position:relative;overflow:hidden;}
#lss7.theme-summer.layout .prof-fill::after,
#lss7.theme-summer.layout .forecast-progress-fill::after,
#lss7.theme-summer.layout .vb-fill::after{
  content:'';position:absolute;inset:0;transform:translateX(-125%);
  background:linear-gradient(105deg,transparent 28%,rgba(255,255,255,.62) 48%,transparent 68%);
  animation:summer-shimmer 3.2s ease-in-out infinite;
}
#lss7.theme-summer.layout .game-events-live::before{animation:summer-live 1.8s ease-in-out infinite;}
#lss7.theme-summer.layout .wx-icon{animation:summer-float 3s ease-in-out infinite;}

/* Summer Dark 2026 */
#lss7.theme-summer-dark{
  --bg0:#050814;--bg1:#091124;--bg2:#0e1930;--bg3:#14213c;--bg4:#1a2948;
  --bgh:#142744;--bgc:#111d35;
  --b0:rgba(177,205,255,.05);--b1:rgba(177,205,255,.12);--b2:rgba(177,205,255,.20);--b3:rgba(177,205,255,.30);
  --blue:#70a7ff;--blueh:#9bc2ff;--blue3:rgba(112,167,255,.14);
  --green:#55d69a;--greenh:#82e8b8;--green3:rgba(85,214,154,.13);
  --amber:#f3c868;--amberh:#ffe09a;--amber3:rgba(243,200,104,.13);
  --red:#ff7482;--redh:#ff9ba5;--red3:rgba(255,116,130,.13);
  --purple:#bb8cff;--purpleh:#d4b5ff;--purple3:rgba(187,140,255,.13);
  --cyan:#5ad9e8;--cyanh:#91edf5;--cyan3:rgba(90,217,232,.13);
  --pink:#ff8db7;--pinkh:#ffb7d1;--pink3:rgba(255,141,183,.13);
  --t1:#f4f7ff;--t2:#d8e2f6;--t3:#9eb0cd;--t4:#7183a3;
  color-scheme:dark;background:linear-gradient(160deg,#050814,#0a1530 58%,#10152c);
  box-shadow:0 0 0 1px rgba(130,170,255,.12) inset,0 18px 62px rgba(0,0,0,.68),0 0 42px rgba(82,116,220,.10);
}
#lss7.theme-summer-dark #lss7-hd{
  background:radial-gradient(circle at 82% 18%,rgba(136,169,255,.20),transparent 24%),linear-gradient(135deg,#081329,#111d42 56%,#1c1741);
  border-bottom-color:rgba(154,190,255,.18);
}
#lss7.theme-summer-dark #lss7-hd::before{content:'☾';position:absolute;right:24px;top:-16px;color:#fff0b0;font-size:68px;line-height:1;opacity:.25;filter:drop-shadow(0 0 14px rgba(255,232,145,.45));}
#lss7.theme-summer-dark #lss7-hd::after{content:'✦  ·  ✧  ·  ✦';position:absolute;inset:8px 118px auto auto;background:none;color:rgba(210,228,255,.50);font-size:12px;letter-spacing:8px;}
#lss7.theme-summer-dark.summer-webgl-ready #lss7-hd::before,
#lss7.theme-summer-dark.summer-webgl-ready #lss7-hd::after{opacity:0;}
#lss7.theme-summer-dark #lss7-body{background:linear-gradient(rgba(120,156,226,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(120,156,226,.025) 1px,transparent 1px),linear-gradient(145deg,#070c1a,#0a1429 68%,#11142b);background-size:36px 36px,36px 36px,auto;}
#lss7.theme-summer-dark #lss7-tabs,#lss7.theme-summer-dark #lss7-qs{background:rgba(7,14,30,.94);backdrop-filter:blur(10px);}
#lss7.theme-summer-dark .sc,#lss7.theme-summer-dark .set-group,#lss7.theme-summer-dark .vehicle-summary-card,#lss7.theme-summer-dark .forecast-controls,#lss7.theme-summer-dark .forecast-chart-box{background:rgba(15,28,53,.76);border-color:rgba(154,190,255,.14);box-shadow:0 8px 22px rgba(0,0,0,.20),0 1px 0 rgba(255,255,255,.035) inset;}
#lss7.theme-summer-dark .prof-strip{background:linear-gradient(120deg,rgba(91,142,255,.13),rgba(74,219,186,.07) 58%,rgba(185,132,255,.12)),rgba(7,14,30,.78);}
#lss7.theme-summer-dark .prof-event-strip{background:linear-gradient(90deg,rgba(243,200,104,.12),rgba(85,214,154,.055));border-bottom-color:rgba(243,200,104,.18);box-shadow:inset 4px 0 #f3c868;}
#lss7.theme-summer-dark .prof-event-label,#lss7.theme-summer-dark .prof-event-strip.active .prof-event-label{color:#fff3c7;}
#lss7.theme-summer-dark .prof-event-time{color:#8af1bf;background:rgba(31,110,75,.26);border:1px solid rgba(85,214,154,.34);border-radius:6px;padding:3px 6px;}
#lss7.theme-summer-dark .bd-summer{color:#f5ecff;background:linear-gradient(135deg,rgba(107,85,190,.82),rgba(35,89,149,.76));border-color:rgba(169,196,255,.38);box-shadow:0 0 18px rgba(117,151,255,.18);}
#lss7.theme-summer-dark.layout #lss7-summer-scene{opacity:1;filter:saturate(1.08);}
#lss7.theme-summer-dark.layout .hd-mark,#lss7.theme-summer-dark.layout .wx-icon{animation:summer-float 3.6s ease-in-out infinite;}

/* LCARS 2364 */
#lss7.theme-lcars{
  --bg0:#030303;--bg1:#070707;--bg2:#0d0b0b;--bg3:#15100d;--bg4:#21170f;--bgh:#17110d;--bgc:#0b0908;
  --b0:rgba(255,180,92,.08);--b1:rgba(255,180,92,.16);--b2:rgba(255,180,92,.26);--b3:rgba(255,180,92,.42);
  --blue:#78d7ff;--blueh:#b4ecff;--blue3:rgba(120,215,255,.12);
  --green:#80ffd0;--greenh:#bcffe7;--green3:rgba(128,255,208,.10);
  --amber:#ffba5c;--amberh:#ffd58f;--amber3:rgba(255,186,92,.14);
  --red:#ff7b73;--redh:#ffaaa5;--red3:rgba(255,123,115,.12);
  --purple:#b89aff;--purpleh:#d6c8ff;--purple3:rgba(184,154,255,.14);
  --cyan:#73f2ff;--cyanh:#b9fbff;--cyan3:rgba(115,242,255,.10);
  --pink:#ff9ccc;--pinkh:#ffc6e2;--pink3:rgba(255,156,204,.12);
  --t1:#fff3d0;--t2:#f4d59f;--t3:#c9a36b;--t4:#8b704a;
  color-scheme:dark;background:#030303;border-color:#302011;border-radius:18px;
  box-shadow:0 0 0 1px rgba(255,186,92,.22) inset,0 20px 72px rgba(0,0,0,.80),0 0 34px rgba(255,122,52,.10);
}
#lss7.theme-lcars::before{content:"";position:absolute;left:0;top:0;bottom:0;width:10px;background:linear-gradient(180deg,#ff9d45 0 22%,#b89aff 22% 45%,#ffcf71 45% 68%,#78d7ff 68% 86%,#ff7b73 86% 100%);z-index:3;pointer-events:none;}
#lss7.theme-lcars #lss7-summer-scene{display:none!important;}
#lss7.theme-lcars #lss7-hd{min-height:96px;background:#030303;border-bottom:1px solid #2a1c0e;padding:14px 18px 13px 28px;overflow:hidden;}
#lss7.theme-lcars #lss7-hd::before{content:"";position:absolute;left:18px;top:11px;right:132px;height:18px;border-radius:18px 0 0 18px;background:linear-gradient(90deg,#ff9d45 0 16%,#ffba5c 16% 38%,#b89aff 38% 54%,#78d7ff 54% 70%,#ff7b73 70% 82%,transparent 82%);box-shadow:0 22px 0 rgba(255,157,69,.42);}
#lss7.theme-lcars #lss7-hd::after{content:"LCARS 2364";position:absolute;right:16px;top:10px;min-width:96px;text-align:center;color:#030303;background:#ffba5c;border-radius:999px;padding:4px 13px;font:950 9px/1 var(--mono);letter-spacing:1.4px;}
#lss7.theme-lcars #lss7-hd .hd-row{position:relative;z-index:2;margin-top:31px;padding-left:0;}
#lss7.theme-lcars .hd-mark{width:54px;height:32px;border-radius:18px 6px 6px 18px;background:#ff9d45;color:#030303;border:0;box-shadow:none;font-size:11px;}
#lss7.theme-lcars .hd-mark::before{display:none}#lss7.theme-lcars .hd-mark::after{right:5px;bottom:5px;background:#030303;box-shadow:none;}
#lss7.theme-lcars .hd-title{color:#fff3d0;text-transform:uppercase;letter-spacing:.65px}.theme-lcars .hd-sub{color:#c9a36b;}
#lss7.theme-lcars .bd-summer{color:#030303;background:#ffba5c;border:0;border-radius:999px;box-shadow:none;font-weight:950;}
#lss7.theme-lcars #lss7-qs,#lss7.theme-lcars #lss7-tabs{background:#030303;border-color:#21170f;}
#lss7.theme-lcars #lss7-tabs{padding:9px 10px;}
#lss7.theme-lcars .qs-cell{background:#070707;border-right-color:#21170f;box-shadow:inset 4px 0 #b89aff;}
#lss7.theme-lcars .qs-cell:nth-child(3n){box-shadow:inset 4px 0 #ffba5c}#lss7.theme-lcars .qs-cell:nth-child(4n){box-shadow:inset 4px 0 #78d7ff;}
#lss7.theme-lcars .qs-label,#lss7.theme-lcars .sl,#lss7.theme-lcars .asset-section-sub,#lss7.theme-lcars .quality-label{color:#c9a36b;}
#lss7.theme-lcars .qs-val,#lss7.theme-lcars .sv,#lss7.theme-lcars .asset-section-title{color:#fff3d0;}
#lss7.theme-lcars #lss7-body{background:linear-gradient(90deg,rgba(255,186,92,.045) 0 1px,transparent 1px),linear-gradient(180deg,#030303,#070504);background-size:44px 100%,auto;}
#lss7.theme-lcars .lss7-nav-group{border-color:#2a1c0e;background:#070707;border-radius:16px;overflow:hidden;}
#lss7.theme-lcars .lss7-nav-group-label{min-width:78px;background:#ff9d45;color:#030303;border-radius:0 999px 999px 0;margin:-1px 0 -1px -1px;padding-left:13px;}
#lss7.theme-lcars .ltab{border:1px solid rgba(3,3,3,.35);border-radius:999px;background:#b89aff;color:#030303!important;text-transform:uppercase;font-weight:950;letter-spacing:.25px;box-shadow:inset 0 -8px rgba(0,0,0,.08);}
#lss7.theme-lcars .ltab:nth-child(2n){background:#ffba5c}#lss7.theme-lcars .ltab:nth-child(3n){background:#78d7ff}#lss7.theme-lcars .ltab:nth-child(4n){background:#ff9d45;}
#lss7.theme-lcars .ltab.active{background:#fff3d0!important;color:#030303!important;box-shadow:0 0 0 3px #030303 inset,0 0 0 1px rgba(255,186,92,.8);}
#lss7.theme-lcars .ltab.active::after{display:none;}
#lss7.theme-lcars .sc,#lss7.theme-lcars .set-group,#lss7.theme-lcars .asset-section,#lss7.theme-lcars .fleet-panel,#lss7.theme-lcars .event-card,#lss7.theme-lcars .prof-strip,#lss7.theme-lcars .vehicle-summary-card,#lss7.theme-lcars .forecast-controls,#lss7.theme-lcars .forecast-chart-box,#lss7.theme-lcars .quality-card{
  background:#080707;border-color:#2a1c0e;border-radius:18px 8px 8px 18px;box-shadow:inset 7px 0 #ff9d45;
}
#lss7.theme-lcars .sc:nth-child(2n),#lss7.theme-lcars .vehicle-summary-card:nth-child(2n),#lss7.theme-lcars .quality-card:nth-child(2n){box-shadow:inset 7px 0 #b89aff;}
#lss7.theme-lcars .sc:nth-child(3n),#lss7.theme-lcars .vehicle-summary-card:nth-child(3n),#lss7.theme-lcars .quality-card:nth-child(3n){box-shadow:inset 7px 0 #78d7ff;}
#lss7.theme-lcars .lbtn{background:#ff9d45;color:#030303;border:0;border-radius:999px;font-weight:950;text-align:center;justify-content:center;}
#lss7.theme-lcars .lbtn.prime{background:#b89aff;color:#030303}#lss7.theme-lcars .lbtn.danger{background:#ff7b73;color:#030303;}
#lss7.theme-lcars .lss7-select{background:#0b0b0b!important;color:#fff3d0!important;border-color:#5a3a1a!important;border-radius:999px;}
#lss7.theme-lcars .vb-fill,#lss7.theme-lcars .pt-fill,#lss7.theme-lcars .prof-fill,#lss7.theme-lcars .forecast-progress-fill{background:linear-gradient(90deg,#ff9d45,#ffba5c,#b89aff)!important;}
#lss7.theme-lcars .game-event-row,#lss7.theme-lcars .sch-row,#lss7.theme-lcars .arr-row,#lss7.theme-lcars .hist-row,#lss7.theme-lcars .rank-mini-row,#lss7.theme-lcars .team-card{background:#070707;border-color:#21170f;border-radius:16px 7px 7px 16px;}
#lss7.theme-lcars .sch-row:hover,#lss7.theme-lcars .arr-row:hover,#lss7.theme-lcars .team-card:hover{background:#120d09;}
#lss7.theme-lcars #lss7-ft{background:#030303;border-top:7px solid #b89aff;color:#c9a36b;}
#lss7.theme-lcars .ft-version{background:#ffba5c;color:#030303;border:0;border-radius:999px;font-weight:950;}
body.lss7-lcars-global{background:#030303!important;color:#fff3d0!important;}
body.lss7-lcars-global::before{content:"";position:fixed;left:0;top:0;bottom:0;width:10px;z-index:9998;pointer-events:none;background:linear-gradient(180deg,#ff9d45 0 22%,#b89aff 22% 45%,#ffba5c 45% 67%,#78d7ff 67% 84%,#ff7b73 84% 100%);}
body.lss7-lcars-global .navbar,body.lss7-lcars-global .navbar-default,body.lss7-lcars-global #navbar-main-collapse{background:#030303!important;border-color:#2a1c0e!important;box-shadow:inset 0 -7px #ff9d45!important;}
body.lss7-lcars-global .navbar a,body.lss7-lcars-global .navbar .navbar-text{color:#fff3d0!important;text-shadow:none!important;}
body.lss7-lcars-global .navbar .dropdown-menu{background:#070707!important;border:1px solid #5a3a1a!important;border-radius:16px 6px 6px 16px!important;box-shadow:inset 6px 0 #b89aff,0 14px 34px rgba(0,0,0,.45)!important;}
body.lss7-lcars-global .navbar .dropdown-menu>li>a:hover{background:#ff9d45!important;color:#030303!important;}
body.lss7-lcars-global .btn:not(#lss7-btn):not(.lbtn),body.lss7-lcars-global .btn-default,body.lss7-lcars-global .btn-success,body.lss7-lcars-global .btn-primary{background:#ff9d45!important;border:0!important;color:#030303!important;border-radius:999px!important;font-weight:850!important;box-shadow:none!important;}
body.lss7-lcars-global .btn-danger{background:#ff7b73!important;color:#030303!important;}
body.lss7-lcars-global input:not([type="checkbox"]):not([type="radio"]),body.lss7-lcars-global select,body.lss7-lcars-global textarea{background:#080707!important;color:#fff3d0!important;border:1px solid #5a3a1a!important;border-radius:999px!important;box-shadow:none!important;}
body.lss7-lcars-global textarea{border-radius:16px!important;}
body.lss7-lcars-global .panel,body.lss7-lcars-global .well,body.lss7-lcars-global .modal-content,body.lss7-lcars-global .missionSideBarEntry,body.lss7-lcars-global #mission_list .missionSideBarEntry,body.lss7-lcars-global #chat_panel,body.lss7-lcars-global #radio_messages,body.lss7-lcars-global .container-fluid>.row>div>[class*="panel"]{background:#070707!important;color:#fff3d0!important;border:1px solid #2a1c0e!important;border-radius:18px 8px 8px 18px!important;box-shadow:inset 7px 0 #ff9d45!important;}
body.lss7-lcars-global .panel-heading,body.lss7-lcars-global .modal-header,body.lss7-lcars-global .missionSideBarEntry .panel-heading{background:#0d0906!important;color:#ffba5c!important;border-color:#2a1c0e!important;border-radius:16px 7px 0 0!important;text-transform:uppercase;letter-spacing:.4px;}
body.lss7-lcars-global .table,body.lss7-lcars-global table{background:#070707!important;color:#fff3d0!important;}
body.lss7-lcars-global .table>tbody>tr>td,body.lss7-lcars-global .table>thead>tr>th{border-color:#2a1c0e!important;color:#fff3d0!important;}
body.lss7-lcars-global .table-striped>tbody>tr:nth-of-type(odd){background:#0d0a08!important;}
body.lss7-lcars-global .label,body.lss7-lcars-global .badge{border-radius:999px!important;background:#b89aff!important;color:#030303!important;}
body.lss7-lcars-global #map_outer,body.lss7-lcars-global #map,body.lss7-lcars-global .leaflet-container{background:#030303!important;border-color:#2a1c0e!important;}
body.lss7-lcars-global a{color:#78d7ff;}body.lss7-lcars-global a:hover{color:#ffba5c;}
body.lss7-lcars-global #mission_list::-webkit-scrollbar,body.lss7-lcars-global ::-webkit-scrollbar{width:8px;height:8px}body.lss7-lcars-global #mission_list::-webkit-scrollbar-thumb,body.lss7-lcars-global ::-webkit-scrollbar-thumb{background:#ff9d45;border-radius:999px}
body.lss7-lcars-global .container,body.lss7-lcars-global .container-fluid,body.lss7-lcars-global #content,body.lss7-lcars-global .tab-content{background:transparent!important;color:#fff3d0!important;}
body.lss7-lcars-global .nav-tabs{border-bottom:7px solid #b89aff!important;background:#030303!important;}
body.lss7-lcars-global .nav-tabs>li>a{background:#ffba5c!important;color:#030303!important;border:0!important;border-radius:999px 999px 0 0!important;font-weight:900!important;text-transform:uppercase;}
body.lss7-lcars-global .nav-tabs>li.active>a,body.lss7-lcars-global .nav-tabs>li.active>a:hover{background:#fff3d0!important;color:#030303!important;box-shadow:inset 0 -4px #030303!important;}
body.lss7-lcars-global .list-group-item,body.lss7-lcars-global .dropdown-menu>li>a{background:#070707!important;color:#fff3d0!important;border-color:#2a1c0e!important;}
body.lss7-lcars-global .alert{background:#130d07!important;border:1px solid #ffba5c!important;color:#fff3d0!important;border-radius:18px 8px 8px 18px!important;box-shadow:inset 7px 0 #ffba5c!important;}
body.lss7-lcars-global .alert-success{border-color:#80ffd0!important;box-shadow:inset 7px 0 #80ffd0!important;}body.lss7-lcars-global .alert-danger{border-color:#ff7b73!important;box-shadow:inset 7px 0 #ff7b73!important;}
body.lss7-lcars-global .progress{background:#17110d!important;border-radius:999px!important;box-shadow:inset 0 0 0 1px #2a1c0e!important;}
body.lss7-lcars-global .progress-bar{background:linear-gradient(90deg,#ff9d45,#ffba5c,#b89aff)!important;color:#030303!important;font-weight:900!important;}
body.lss7-lcars-global .popover,body.lss7-lcars-global .tooltip-inner,body.lss7-lcars-global .leaflet-popup-content-wrapper{background:#070707!important;color:#fff3d0!important;border:1px solid #5a3a1a!important;border-radius:16px!important;box-shadow:0 18px 42px rgba(0,0,0,.55),inset 6px 0 #78d7ff!important;}
body.lss7-lcars-global .leaflet-popup-tip{background:#070707!important;}

/* LCARS 2364 refined cockpit pass */
#lss7.theme-lcars{
  --bg0:#050506;--bg1:#090908;--bg2:#10100e;--bg3:#17130f;--bg4:#201911;--bgh:#12100d;--bgc:#080807;
  --b0:rgba(255,198,112,.09);--b1:rgba(255,198,112,.18);--b2:rgba(255,198,112,.30);--b3:rgba(255,198,112,.48);
  --blue:#8fdcff;--blueh:#d5f4ff;--green:#9dffd2;--greenh:#d4ffe9;--amber:#f6b45d;--amberh:#ffe0a7;
  --red:#ff8b82;--redh:#ffc1bc;--purple:#c7a8ff;--purpleh:#eadcff;--cyan:#91f2ff;--cyanh:#d9fbff;
  --t1:#fff8e8;--t2:#ead0a2;--t3:#c19b67;--t4:#81684a;
  border:1px solid rgba(246,180,93,.36);border-radius:20px 8px 8px 20px;background:#050506;
  box-shadow:0 24px 70px rgba(0,0,0,.82),inset 12px 0 #f6b45d,inset 0 0 0 1px rgba(255,255,255,.035);
}
#lss7.theme-lcars::before{width:12px;background:linear-gradient(180deg,#f6b45d 0 20%,#c7a8ff 20% 39%,#8fdcff 39% 56%,#ff8b82 56% 73%,#ffe0a7 73% 100%);}
#lss7.theme-lcars #lss7-hd{min-height:88px;padding:13px 16px 12px 32px;background:radial-gradient(circle at 88% 14%,rgba(143,220,255,.10),transparent 32%),#050506;border-bottom:1px solid rgba(246,180,93,.22);}
#lss7.theme-lcars #lss7-hd::before{left:32px;right:150px;top:10px;height:13px;border-radius:18px 0 0 18px;background:linear-gradient(90deg,#f6b45d 0 18%,#ffe0a7 18% 34%,#c7a8ff 34% 51%,#8fdcff 51% 68%,#ff8b82 68% 82%,transparent 82%);box-shadow:none;opacity:.92;}
#lss7.theme-lcars #lss7-hd::after{right:15px;top:7px;background:#11100e;color:#ffe0a7;border:1px solid rgba(246,180,93,.55);box-shadow:inset 5px 0 #f6b45d;padding:5px 12px;border-radius:18px 6px 6px 18px;}
#lss7.theme-lcars #lss7-hd .hd-row{margin-top:22px;}
#lss7.theme-lcars .hd-mark{width:58px;height:34px;border-radius:20px 7px 7px 20px;background:linear-gradient(90deg,#f6b45d,#ffe0a7);color:#070707;font-weight:950;}
#lss7.theme-lcars .hd-title{font-size:14px;color:#fff8e8;text-shadow:0 0 12px rgba(246,180,93,.12);}
#lss7.theme-lcars .hd-sub{color:#c19b67;}
#lss7.theme-lcars #lss7-col,#lss7.theme-lcars #lss7-x{background:#11100e;color:#ffe0a7;border-color:rgba(246,180,93,.40);}
#lss7.theme-lcars #lss7-col:hover,#lss7.theme-lcars #lss7-x:hover{background:#21170f;color:#fff8e8;border-color:#f6b45d;}
#lss7.theme-lcars #lss7-qs{background:#070707;border-color:rgba(246,180,93,.20);}
#lss7.theme-lcars .qs-cell{background:#090908;box-shadow:inset 5px 0 rgba(199,168,255,.86);}
#lss7.theme-lcars .qs-cell:nth-child(4n+1){box-shadow:inset 5px 0 rgba(246,180,93,.92);}
#lss7.theme-lcars .qs-cell:nth-child(4n+3){box-shadow:inset 5px 0 rgba(143,220,255,.88);}
#lss7.theme-lcars .lss7-nav-group{border-color:rgba(246,180,93,.28);background:#080807;border-radius:18px 7px 7px 18px;}
#lss7.theme-lcars .lss7-nav-group-label{background:#f6b45d;color:#050506;border-radius:0 18px 18px 0;font-weight:950;}
#lss7.theme-lcars .ltab{background:#10100e;color:#fff8e8!important;border:1px solid rgba(246,180,93,.22);box-shadow:inset 5px 0 var(--purple);border-radius:15px 6px 6px 15px;text-shadow:none;}
#lss7.theme-lcars .ltab:nth-child(2n),#lss7.theme-lcars .ltab:nth-child(3n),#lss7.theme-lcars .ltab:nth-child(4n){background:#10100e;}
#lss7.theme-lcars .ltab:hover{background:#19130e;color:#ffe0a7!important;border-color:rgba(246,180,93,.48);}
#lss7.theme-lcars .ltab.active{background:#f6b45d!important;color:#050506!important;box-shadow:inset 7px 0 #ffe0a7,0 0 0 1px rgba(246,180,93,.55);font-weight:950;}
#lss7.theme-lcars .lbtn{background:#11100e;color:#fff8e8;border:1px solid rgba(246,180,93,.36);box-shadow:inset 5px 0 #f6b45d;border-radius:15px 6px 6px 15px;}
#lss7.theme-lcars .lbtn:hover{background:#1d160f;color:#ffe0a7;border-color:#f6b45d;}
#lss7.theme-lcars .lbtn.prime{background:#182337;color:#d5f4ff;border-color:rgba(143,220,255,.46);box-shadow:inset 5px 0 #8fdcff;}
#lss7.theme-lcars .lbtn.danger{background:#2a1111;color:#ffc1bc;border-color:rgba(255,139,130,.46);box-shadow:inset 5px 0 #ff8b82;}
#lss7.theme-lcars .lss7-select,#lss7.theme-lcars input,#lss7.theme-lcars select,#lss7.theme-lcars textarea{background:#080807!important;color:#fff8e8!important;border-color:rgba(246,180,93,.35)!important;border-radius:13px 5px 5px 13px!important;}
#lss7.theme-lcars .lss7-select option{background:#080807!important;color:#fff8e8!important;}
#lss7.theme-lcars .sc,#lss7.theme-lcars .set-group,#lss7.theme-lcars .asset-section,#lss7.theme-lcars .fleet-panel,#lss7.theme-lcars .event-card,#lss7.theme-lcars .prof-strip,#lss7.theme-lcars .vehicle-summary-card,#lss7.theme-lcars .forecast-controls,#lss7.theme-lcars .forecast-chart-box,#lss7.theme-lcars .quality-card{background:#080807;border-color:rgba(246,180,93,.20);border-radius:18px 7px 7px 18px;box-shadow:inset 7px 0 rgba(246,180,93,.92);}
#lss7.theme-lcars .sv,#lss7.theme-lcars .qs-val,#lss7.theme-lcars .asset-section-title,#lss7.theme-lcars .set-head{color:#fff8e8;}
#lss7.theme-lcars .sl,#lss7.theme-lcars .qs-lbl,#lss7.theme-lcars .asset-section-sub,#lss7.theme-lcars .quality-label{color:#c19b67;}
#lss7.theme-lcars .rank-mini-row.me{background:rgba(143,220,255,.12);border-color:rgba(143,220,255,.44);box-shadow:inset 6px 0 #8fdcff;}
#lss7.theme-lcars #lss7-ft{background:#050506;border-top:5px solid #c7a8ff;color:#c19b67;}
body.lss7-lcars-global{background:#050506!important;color:#fff8e8!important;}
body.lss7-lcars-global::before{width:8px;background:linear-gradient(180deg,#f6b45d 0 22%,#c7a8ff 22% 44%,#8fdcff 44% 64%,#ff8b82 64% 82%,#ffe0a7 82% 100%);}
body.lss7-lcars-global .navbar,body.lss7-lcars-global .navbar-default,body.lss7-lcars-global #navbar-main-collapse{background:#050506!important;border-color:rgba(246,180,93,.24)!important;box-shadow:inset 0 -5px #f6b45d!important;}
body.lss7-lcars-global .btn:not(#lss7-btn):not(.lbtn),body.lss7-lcars-global .btn-default{background:#11100e!important;color:#fff8e8!important;border:1px solid rgba(246,180,93,.34)!important;border-radius:14px 5px 5px 14px!important;box-shadow:inset 5px 0 #f6b45d!important;}
body.lss7-lcars-global .btn-primary{background:#162234!important;color:#d5f4ff!important;border-color:rgba(143,220,255,.45)!important;box-shadow:inset 5px 0 #8fdcff!important;}
body.lss7-lcars-global .btn-success{background:#10251c!important;color:#d4ffe9!important;border-color:rgba(157,255,210,.38)!important;box-shadow:inset 5px 0 #9dffd2!important;}
body.lss7-lcars-global .btn-danger{background:#2a1111!important;color:#ffc1bc!important;border-color:rgba(255,139,130,.42)!important;box-shadow:inset 5px 0 #ff8b82!important;}
body.lss7-lcars-global .dropdown-menu>li>a:hover,body.lss7-lcars-global .list-group-item:hover{background:#1b140d!important;color:#ffe0a7!important;}

/* LCARS 2364 command refit */
#lss7.theme-lcars{
  --bg0:#06070a;--bg1:#090b10;--bg2:#10131a;--bg3:#151925;--bg4:#1c2230;--bgh:#15110c;--bgc:#0b0d12;
  --b0:rgba(232,169,88,.08);--b1:rgba(232,169,88,.18);--b2:rgba(232,169,88,.32);--b3:rgba(232,169,88,.48);
  --amber:#e8a958;--amberh:#ffd99b;--blue:#85d6ff;--blueh:#d7f2ff;--purple:#bfa3ff;--purpleh:#eadfff;--green:#8dffd0;--greenh:#ccffe9;--red:#ff8f84;--redh:#ffc5be;
  --t1:#fff7e8;--t2:#e8cfad;--t3:#b79466;--t4:#806b50;
  background:linear-gradient(180deg,#06070a,#08080a 38%,#050506);
  border:1px solid rgba(232,169,88,.32);border-radius:22px 8px 8px 22px;
  box-shadow:0 22px 70px rgba(0,0,0,.82),inset 10px 0 #e8a958,inset 0 0 0 1px rgba(255,255,255,.035);
}
#lss7.theme-lcars::before{width:10px;background:linear-gradient(180deg,#e8a958 0 28%,#bfa3ff 28% 48%,#85d6ff 48% 68%,#ff8f84 68% 84%,#ffd99b 84% 100%);}
#lss7.theme-lcars #lss7-hd{
  min-height:82px;padding:12px 15px 11px 30px;background:
    linear-gradient(90deg,rgba(232,169,88,.12),transparent 48%),
    radial-gradient(circle at 88% 18%,rgba(133,214,255,.11),transparent 28%),
    #06070a;
  border-bottom:1px solid rgba(232,169,88,.24);
}
#lss7.theme-lcars #lss7-hd::before{left:30px;right:145px;top:9px;height:10px;border-radius:20px 0 0 20px;background:linear-gradient(90deg,#e8a958 0 26%,#ffd99b 26% 40%,#bfa3ff 40% 58%,#85d6ff 58% 76%,transparent 76%);opacity:.96;}
#lss7.theme-lcars #lss7-hd::after{content:"LCARS 2364";right:14px;top:6px;background:#0e1015;color:#ffd99b;border:1px solid rgba(232,169,88,.48);box-shadow:inset 6px 0 #e8a958;border-radius:18px 6px 6px 18px;padding:5px 12px;font-size:8px;}
#lss7.theme-lcars #lss7-hd .hd-row{margin-top:18px;}
#lss7.theme-lcars .hd-mark{background:linear-gradient(135deg,#e8a958,#ffd99b);color:#06070a;border-radius:20px 7px 7px 20px;box-shadow:0 0 0 1px rgba(232,169,88,.34);}
#lss7.theme-lcars .hd-title{color:#fff7e8;font-size:14px;letter-spacing:.9px}.theme-lcars .hd-sub{color:#a98d67;}
#lss7.theme-lcars .bd-summer{background:#12151f;color:#ffd99b;border:1px solid rgba(232,169,88,.45);box-shadow:none;}
#lss7.theme-lcars #lss7-qs,#lss7.theme-lcars #lss7-tabs{background:#07080b;border-color:rgba(232,169,88,.20);}
#lss7.theme-lcars .qs-cell{background:#0b0d12;box-shadow:inset 4px 0 #bfa3ff;}
#lss7.theme-lcars .qs-cell:nth-child(4n+1){box-shadow:inset 4px 0 #e8a958;}
#lss7.theme-lcars .qs-cell:nth-child(4n+3){box-shadow:inset 4px 0 #85d6ff;}
#lss7.theme-lcars .lss7-nav-group{border-color:rgba(232,169,88,.25);background:#0b0d12;border-radius:18px 7px 7px 18px;}
#lss7.theme-lcars .lss7-nav-group-label{background:#0f1218;color:#ffd99b;border-right:1px solid rgba(232,169,88,.32);border-radius:18px 0 0 18px;margin:0;padding:0 11px;box-shadow:inset 5px 0 #e8a958;}
#lss7.theme-lcars .ltab{
  background:#10131a!important;color:#e8cfad!important;border:1px solid rgba(232,169,88,.22);
  border-radius:14px 6px 6px 14px;box-shadow:inset 4px 0 #bfa3ff;text-transform:none;font-weight:850;letter-spacing:.1px;
}
#lss7.theme-lcars .ltab:hover{background:#171a22!important;color:#fff7e8!important;border-color:rgba(232,169,88,.48);}
#lss7.theme-lcars .ltab.active{background:#21170f!important;color:#ffd99b!important;border-color:rgba(232,169,88,.62);box-shadow:inset 5px 0 #e8a958,0 0 0 1px rgba(232,169,88,.16);}
#lss7.theme-lcars .sc,#lss7.theme-lcars .set-group,#lss7.theme-lcars .asset-section,#lss7.theme-lcars .fleet-panel,#lss7.theme-lcars .event-card,#lss7.theme-lcars .prof-strip,#lss7.theme-lcars .vehicle-summary-card,#lss7.theme-lcars .forecast-controls,#lss7.theme-lcars .forecast-chart-box,#lss7.theme-lcars .quality-card{
  background:linear-gradient(180deg,#0b0d12,#08090d);border-color:rgba(232,169,88,.19);border-radius:18px 7px 7px 18px;box-shadow:inset 6px 0 rgba(232,169,88,.90);
}
#lss7.theme-lcars .sc:nth-child(2n),#lss7.theme-lcars .vehicle-summary-card:nth-child(2n),#lss7.theme-lcars .quality-card:nth-child(2n){box-shadow:inset 6px 0 rgba(191,163,255,.88);}
#lss7.theme-lcars .sc:nth-child(3n),#lss7.theme-lcars .vehicle-summary-card:nth-child(3n),#lss7.theme-lcars .quality-card:nth-child(3n){box-shadow:inset 6px 0 rgba(133,214,255,.88);}
#lss7.theme-lcars .lbtn,#lss7.theme-lcars .hotkey-capture{
  background:#10131a;color:#fff7e8;border:1px solid rgba(232,169,88,.30);box-shadow:inset 5px 0 #e8a958;border-radius:15px 6px 6px 15px;text-shadow:none;
}
#lss7.theme-lcars .lbtn:hover,#lss7.theme-lcars .hotkey-capture:hover{background:#171a22;color:#ffd99b;border-color:rgba(232,169,88,.55);}
#lss7.theme-lcars .lbtn.prime{background:#101a25;color:#d7f2ff;border-color:rgba(133,214,255,.42);box-shadow:inset 5px 0 #85d6ff;}
#lss7.theme-lcars .lbtn.danger{background:#211112;color:#ffc5be;border-color:rgba(255,143,132,.42);box-shadow:inset 5px 0 #ff8f84;}
#lss7.theme-lcars .hotkey-value{background:#06070a;color:#ffd99b;border-color:rgba(232,169,88,.42);}
#lss7.theme-lcars .hotkey-capture.recording{background:#10202a;color:#d7f2ff;border-color:rgba(133,214,255,.58);box-shadow:inset 5px 0 #85d6ff;}
#lss7.theme-lcars .lss7-select,#lss7.theme-lcars input,#lss7.theme-lcars select,#lss7.theme-lcars textarea{background:#0b0d12!important;color:#fff7e8!important;border:1px solid rgba(232,169,88,.32)!important;border-radius:13px 5px 5px 13px!important;}
#lss7.theme-lcars .rank-mini-row.me{background:rgba(133,214,255,.10);border-color:rgba(133,214,255,.42);box-shadow:inset 5px 0 #85d6ff;}
#lss7.theme-lcars #lss7-ft{background:#06070a;border-top:4px solid #bfa3ff;color:#b79466;}
body.lss7-lcars-global{background:#06070a!important;color:#fff7e8!important;}
body.lss7-lcars-global::before{width:5px;background:linear-gradient(180deg,#e8a958,#bfa3ff 45%,#85d6ff 70%,#ff8f84);}
body.lss7-lcars-global .navbar,body.lss7-lcars-global .navbar-default,body.lss7-lcars-global #navbar-main-collapse{background:#07080b!important;border-color:rgba(232,169,88,.22)!important;box-shadow:inset 0 -4px #e8a958!important;}
body.lss7-lcars-global .navbar a,body.lss7-lcars-global .navbar .navbar-text{color:#fff7e8!important;}
body.lss7-lcars-global .btn:not(#lss7-btn):not(.lbtn),body.lss7-lcars-global .btn-default,body.lss7-lcars-global .btn-primary,body.lss7-lcars-global .btn-success{
  background:#10131a!important;color:#fff7e8!important;border:1px solid rgba(232,169,88,.30)!important;border-radius:14px 5px 5px 14px!important;box-shadow:inset 5px 0 #e8a958!important;
}
body.lss7-lcars-global .btn-danger{background:#211112!important;color:#ffc5be!important;border-color:rgba(255,143,132,.42)!important;box-shadow:inset 5px 0 #ff8f84!important;}
body.lss7-lcars-global .panel,body.lss7-lcars-global .well,body.lss7-lcars-global .modal-content,body.lss7-lcars-global .missionSideBarEntry,body.lss7-lcars-global #mission_list .missionSideBarEntry,body.lss7-lcars-global #chat_panel,body.lss7-lcars-global #radio_messages{background:#0b0d12!important;color:#fff7e8!important;border-color:rgba(232,169,88,.20)!important;box-shadow:inset 6px 0 #e8a958!important;}
@keyframes summer-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes summer-glow{0%,100%{box-shadow:0 3px 10px rgba(230,163,0,.12)}50%{box-shadow:0 4px 18px rgba(230,163,0,.34)}}
@keyframes summer-card-in{from{opacity:.25;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}
@keyframes summer-shimmer{0%,35%{transform:translateX(-125%)}70%,100%{transform:translateX(125%)}}
@keyframes summer-live{0%,100%{transform:scale(.85);box-shadow:0 0 5px rgba(34,197,94,.55)}50%{transform:scale(1.18);box-shadow:0 0 15px rgba(34,197,94,.95)}}
.bd-summer{
  color:#6f5200;background:linear-gradient(135deg,rgba(255,223,94,.78),rgba(255,255,255,.58));
  border:1px solid rgba(196,137,0,.34);box-shadow:0 3px 10px rgba(230,163,0,.12);
}
@media(max-width:620px){
  #lss7.theme-summer #lss7-hd::after{display:none;}
  #lss7.theme-summer #lss7-hd::before{right:8px;opacity:.14;}
  #lss7-hd{padding:11px 12px 10px;}
  #lss7-hd .hd-row{display:grid;grid-template-columns:82px minmax(0,1fr);align-items:center;gap:8px 10px;}
  #lss7-hd .hd-mark{grid-column:1;grid-row:1;}
  #lss7-hd .hd-row>div:nth-child(2){grid-column:2;grid-row:1;min-width:0;}
  #lss7-hd .hd-title{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  #lss7-hd .hd-sub{font-size:9px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  #lss7-hd .hd-meta{grid-column:1/-1;grid-row:2;margin-left:0;padding-left:92px;display:flex;flex-wrap:wrap;justify-content:flex-start;gap:5px;}
  #lss7-hd #lss7-col{min-width:92px;}
  #lss7.theme-summer #lss7-summer-scene,
  #lss7.theme-summer-dark #lss7-summer-scene{opacity:.82;}
}
@media(prefers-reduced-motion:reduce){
  #lss7.theme-summer.layout .hd-mark,
  #lss7.theme-summer-dark.layout .hd-mark,
  #lss7.theme-summer.layout .bd-summer,
  #lss7.theme-summer-dark.layout .bd-summer,
  #lss7.theme-summer.layout .sc,
  #lss7.theme-summer.layout .vehicle-summary-card,
  #lss7.theme-summer.layout .prof-fill::after,
  #lss7.theme-summer.layout .forecast-progress-fill::after,
  #lss7.theme-summer.layout .vb-fill::after,
  #lss7.theme-summer.layout .game-events-live::before,
  #lss7.theme-summer.layout .wx-icon,
  #lss7.theme-summer-dark.layout .wx-icon{animation:none!important;}
}

/* Accordion */
.lacc{border-top:1px solid var(--b1);}
.lacc-hd{
  display:flex;align-items:center;gap:8px;padding:10px 14px;
  cursor:pointer;font-size:11px;font-weight:600;color:var(--t4);
  user-select:none;transition:all .14s;
}
.lacc-hd:hover{background:var(--bgh);color:var(--t2);}
.lacc-arr{margin-left:auto;font-size:9px;transition:transform .2s;}
.lacc.open .lacc-arr{transform:rotate(180deg);}
.lacc-body{display:none;background:var(--bg1);border-top:1px solid var(--b1);}
.lacc.open .lacc-body{display:block;}
.lacc-content{padding:12px 14px;font-size:11px;color:var(--t2);line-height:1.85;}
.info-r{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--b0);font-size:11px;}
.info-r:last-child{border-bottom:none;}
.info-k{color:var(--t4);}
.info-v{color:var(--t2);font-weight:500;}
.patch-i{display:flex;gap:8px;margin-bottom:5px;font-size:11px;}
.patch-b{color:var(--blue);flex-shrink:0;}
.patch-ver{
  border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.02);
  margin:0 0 8px;overflow:hidden;
}
.patch-ver summary{
  list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;
  padding:9px 10px;color:var(--blueh);font-size:11px;font-weight:800;
  background:rgba(59,130,246,.055);user-select:none;
}
.patch-ver summary::-webkit-details-marker{display:none;}
.patch-ver summary::before{
  content:"›";display:inline-flex;align-items:center;justify-content:center;
  width:16px;height:16px;border-radius:5px;border:1px solid var(--b1);
  color:var(--t3);transition:transform .16s ease;
}
.patch-ver[open] summary::before{transform:rotate(90deg);color:var(--blueh);}
.patch-ver-body{padding:9px 10px 8px;}

/* Footer */
#lss7-ft{
  flex-shrink:0;padding:7px 14px;
  background:var(--bg1);border-top:1px solid var(--b1);
  display:flex;align-items:center;justify-content:space-between;
}
.ft-l,.ft-r{font-size:10px;color:var(--t4);}
.ft-r{display:flex;align-items:center;gap:8px;}
.ft-version{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;color:var(--blueh);background:var(--blue3);border:1px solid rgba(59,130,246,.28);font-weight:900;font-family:var(--mono);}

@media (prefers-reduced-motion:reduce){
  .hd-mark::after,.hd-event-badge::before,.prof-role{animation:none!important;}
}

/* Update status */
.lss7-update-note{display:none;position:relative;z-index:2;margin-top:10px;padding:8px 10px;border-radius:7px;border:1px solid rgba(34,197,94,.35);background:rgba(34,197,94,.10);align-items:center;gap:8px;color:#a7f3c2;font-size:10px;font-weight:750;}
.lss7-update-note.show{display:flex;}
.lss7-update-note.available{border-color:rgba(245,158,11,.42);background:rgba(245,158,11,.11);color:#fcd98b;}
.lss7-update-note span{flex:1;min-width:0;}
.lss7-update-note button{border:0;background:transparent;color:inherit;font-size:10px;font-weight:900;cursor:pointer;padding:0;white-space:nowrap;}
.lss7-update-note .update-patches{text-decoration:underline;}
.lss7-update-close{width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;border-radius:6px!important;border:1px solid currentColor!important;text-decoration:none!important;font-size:15px!important;line-height:1!important;opacity:.78;}
.lss7-update-close:hover{opacity:1;background:rgba(255,255,255,.10)!important;}
.lss7-toast{position:absolute;right:14px;bottom:38px;z-index:50;max-width:min(360px,calc(100% - 28px));padding:9px 12px;border:1px solid rgba(34,197,94,.34);border-radius:8px;background:rgba(6,78,59,.92);color:#dcfce7;font-size:10px;font-weight:850;box-shadow:0 16px 42px rgba(0,0,0,.32);opacity:0;transform:translateY(8px);pointer-events:none;transition:opacity .18s ease,transform .18s ease}.lss7-toast.show{opacity:1;transform:translateY(0)}.lss7-toast.bad{border-color:rgba(239,68,68,.40);background:rgba(127,29,29,.94);color:#fee2e2}
.update-status{display:flex;flex-direction:column;gap:7px;padding:9px 10px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.02);font-size:10px;color:var(--t3);line-height:1.4;}
.update-status strong{color:var(--t1);}
.update-status.good{border-color:rgba(34,197,94,.28);background:rgba(34,197,94,.07);}
.update-status.warn{border-color:rgba(245,158,11,.30);background:rgba(245,158,11,.07);}
.update-actions{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;}
.update-actions .lbtn{justify-content:center;text-align:center;}
.set-actions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px!important;}
.set-actions .set-head{grid-column:1/-1;}
#lss7:not(.layout) .set-actions,#lss7:not(.layout) .update-actions{grid-template-columns:1fr!important;}
@media(max-width:700px){.set-actions{grid-template-columns:1fr!important}.update-actions{grid-template-columns:1fr;}}

/* Shared */
.lss7-div{height:1px;background:var(--b1);}
.lss7-empty{padding:24px;text-align:center;font-size:12px;color:var(--t4);}
.lspin{
  display:inline-block;width:11px;height:11px;
  border:2px solid rgba(255,255,255,.08);border-top-color:var(--blue);
  border-radius:50%;animation:spin .65s linear infinite;vertical-align:middle;margin-right:4px;
}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes lflash{from{opacity:.25}to{opacity:1}}
.lflash{animation:lflash .3s ease-out;}

/* Sortable table header */
.sort-hdr{
  display:grid;align-items:center;
  padding:5px 14px;background:var(--bg1);
  font-size:9px;font-weight:700;text-transform:uppercase;
  letter-spacing:1px;color:var(--t4);border-bottom:1px solid var(--b1);
}
.lss7-select{
  min-width:180px;
  background:var(--bg2) !important;
  color:var(--t1) !important;
  border:1px solid var(--b2) !important;
  border-radius:6px;
  font-size:11px;
  padding:4px 8px;
}
.lss7-select::placeholder{color:var(--t4) !important;}
.lss7-select option{background:var(--bg0) !important;color:var(--t1) !important;}
#sv-rank-next{font-size:10px;color:var(--t3);}
#rank-board{padding:10px 12px;}
.rank-mini-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.rank-mini-title{font-size:11px;font-weight:700;color:var(--t2);}
.rank-mini-note{font-size:10px;color:var(--t4);}
.rank-mini-list{display:flex;flex-direction:column;gap:4px;}
.rank-mini-row{display:grid;grid-template-columns:46px 1fr 140px;gap:8px;padding:6px 8px;border-radius:6px;background:rgba(255,255,255,.02);}
.rank-mini-row.me{background:rgba(59,130,246,.12);border:1px solid rgba(59,130,246,.35);}
.rank-mini-r{font-size:11px;color:var(--t3);font-family:var(--mono);}
.rank-mini-n{font-size:11px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none;min-width:0;}
a.rank-mini-n:hover{color:var(--blueh);text-decoration:underline;}
.rank-mini-c{font-size:11px;color:var(--green);text-align:right;font-family:var(--mono);}

/* 9.1.0: fleet cockpit */
.fleet-status-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;padding:10px 12px 4px;}
.fleet-status-kpi{padding:10px;border:1px solid var(--b1);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.035),rgba(255,255,255,.012));min-width:0;}
.fleet-status-kpi b{display:block;color:var(--t1);font:900 17px/1.1 var(--mono);}
.fleet-status-kpi span{display:block;margin-top:4px;color:var(--t3);font-size:9px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.fleet-status-kpi.ready{border-color:rgba(34,197,94,.28);background:var(--green3)}
.fleet-status-kpi.active{border-color:rgba(245,158,11,.28);background:var(--amber3)}
.fleet-status-kpi.attention{border-color:rgba(239,68,68,.24);background:var(--red3)}
.fleet-status-kpi.coverage{border-color:rgba(59,130,246,.28);background:var(--blue3)}
.vb-row.primary{background:rgba(255,255,255,.025);border:1px solid var(--b1);border-radius:7px;padding:7px 8px;margin-bottom:4px;}
.vb-row.primary .vb-lbl{color:var(--t1);font-weight:850;}
.vb-fill.is-zero{min-width:0!important;opacity:.18;}
@media(max-width:720px){.fleet-status-kpis{grid-template-columns:repeat(2,minmax(0,1fr));}}

/* 9.1.0: player forecast */
.player-forecast{padding:14px;display:flex;flex-direction:column;gap:10px;}
.player-forecast-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:13px;border:1px solid rgba(34,211,238,.24);border-radius:9px;background:linear-gradient(135deg,rgba(34,211,238,.11),rgba(59,130,246,.05));}
.player-forecast-title{font-size:14px;font-weight:950;color:var(--t1);}.player-forecast-sub{margin-top:4px;font-size:10px;color:var(--t3);line-height:1.45;}
.beta-strong{display:inline-flex;padding:4px 8px;border-radius:999px;border:1px solid rgba(245,158,11,.45);background:rgba(245,158,11,.15);color:var(--amberh);font-size:9px;font-weight:950;letter-spacing:.7px;}
.player-forecast-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;}
.player-forecast-kpi{padding:11px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.02);min-width:0;}
.player-forecast-kpi span{display:block;font-size:8px;color:var(--t4);text-transform:uppercase;letter-spacing:.7px;font-weight:850}.player-forecast-kpi b{display:block;margin-top:5px;color:var(--t1);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.player-forecast-progress{height:10px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;border:1px solid var(--b1);}.player-forecast-fill{height:100%;background:linear-gradient(90deg,var(--blue),var(--cyan),var(--green));transition:width .35s ease;}
.player-rank-context{display:flex;flex-direction:column;gap:5px}.player-rank-row{display:grid;grid-template-columns:56px minmax(0,1fr) 150px;gap:8px;padding:7px 9px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.02);font-size:10px;}.player-rank-row.me{border-color:rgba(59,130,246,.42);background:var(--blue3)}.player-rank-row span:last-child{text-align:right;color:var(--greenh);font-family:var(--mono)}.player-rank-row a,.player-rank-row b{color:var(--t1);font-weight:850;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:none}.player-rank-row a:hover{color:var(--blueh);text-decoration:underline}
.rank-delta.up,.prof-placement-history.up{color:#86efac!important}.rank-delta.down,.prof-placement-history.down{color:#fca5a5!important}.rank-delta.neutral,.prof-placement-history.neutral{color:var(--t3)!important}
.rank-delta,.prof-placement-history{display:inline-flex;align-items:center;gap:5px;font-family:var(--mono);font-weight:950;line-height:1.2;max-width:100%;flex-wrap:nowrap;transform:none!important;writing-mode:horizontal-tb!important;}
.player-forecast-kpi b.rank-delta{display:flex!important;align-items:center!important;gap:6px!important;margin-top:5px!important;overflow:visible!important;text-overflow:clip!important;white-space:nowrap!important;min-height:18px;}
.prof-placement-history{margin-top:4px;font-size:9px;white-space:nowrap!important;overflow:visible;align-self:flex-start;}
.prof-placement small.prof-placement-history{display:inline-flex!important;align-items:center!important;gap:5px!important;margin-top:4px!important;font-size:9px!important;white-space:nowrap!important;overflow:visible!important;}
.rank-delta .rank-trend-label,.prof-placement-history .rank-trend-label{display:inline!important;color:inherit!important;font-size:inherit!important;font-weight:inherit!important;text-transform:none!important;letter-spacing:0!important;white-space:nowrap!important;transform:none!important;writing-mode:horizontal-tb!important;}
.rank-delta .rank-trend-icon,.prof-placement-history .rank-trend-icon{display:inline-flex!important;align-items:center;justify-content:center;width:16px;height:16px;border-radius:999px;font-size:10px!important;font-weight:950;line-height:1;background:rgba(148,163,184,.14);border:1px solid rgba(148,163,184,.28);flex:0 0 16px;text-transform:none!important;letter-spacing:0!important;transform:none!important;writing-mode:horizontal-tb!important;}
.rank-delta.up .rank-trend-icon,.prof-placement-history.up .rank-trend-icon{background:rgba(34,197,94,.14);border-color:rgba(34,197,94,.42);color:#22c55e;}
.rank-delta.down .rank-trend-icon,.prof-placement-history.down .rank-trend-icon{background:rgba(239,68,68,.14);border-color:rgba(239,68,68,.42);color:#ef4444;}
.rank-delta.neutral .rank-trend-icon,.prof-placement-history.neutral .rank-trend-icon{background:rgba(148,163,184,.12);border-color:rgba(148,163,184,.28);color:var(--t3);}
.player-forecast.pro{gap:12px;padding:14px;}
.player-forecast.pro .player-forecast-head{position:relative;padding:15px;border-color:rgba(59,130,246,.25);border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,.13),rgba(34,211,238,.05));overflow:hidden;}
.player-forecast.pro .player-forecast-head::after{content:"";position:absolute;right:-42px;top:-64px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.15),transparent 66%);pointer-events:none;}
.player-forecast.pro .player-forecast-title{font-size:16px;font-weight:950;}
.player-forecast.pro .player-forecast-sub{max-width:820px;color:var(--t3);}
.player-forecast-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(300px,.95fr);gap:10px;align-items:stretch;}
.player-forecast-hero-main,.player-forecast-hero-grid{border:1px solid var(--b1);border-radius:9px;background:linear-gradient(180deg,rgba(255,255,255,.032),rgba(255,255,255,.012));}
.player-forecast-hero-main{position:relative;display:flex;flex-direction:column;justify-content:center;gap:5px;padding:14px;overflow:hidden;}
.player-forecast-hero-main::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:linear-gradient(90deg,var(--green),var(--cyan));opacity:.65;}
.player-forecast-eyebrow{color:var(--greenh);font-size:8px;font-weight:950;letter-spacing:.8px;text-transform:uppercase;}
.player-forecast-hero-rank{color:var(--t1);font:950 19px/1.15 var(--head);}
.player-forecast-hero-meta{color:var(--t3);font-size:10px;line-height:1.45;}
.player-forecast-hero-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--b1);overflow:hidden;}
.player-forecast-hero-stat{padding:11px;background:rgba(255,255,255,.018);min-width:0;}
.player-forecast-hero-stat span{display:block;color:var(--t4);font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:.45px;}
.player-forecast-hero-stat b{display:block;margin-top:5px;color:var(--t1);font:950 12px/1.1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.player-forecast.pro .player-forecast-grid{grid-template-columns:repeat(4,minmax(0,1fr));}
.player-forecast.pro .player-forecast-kpi{position:relative;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.012));overflow:hidden;}
.player-forecast.pro .player-forecast-kpi::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--card-accent,var(--blue));opacity:.45;}
.player-forecast.pro .player-forecast-kpi.progress{--card-accent:var(--green)}
.player-forecast.pro .player-forecast-kpi.rank{--card-accent:var(--amber)}
.player-forecast.pro .player-forecast-kpi.data{--card-accent:var(--cyan)}
@media(max-width:720px){.player-forecast-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.player-rank-row{grid-template-columns:46px minmax(0,1fr) 110px;}.prof-row{grid-template-columns:58px minmax(0,1fr)}.prof-av{width:58px;height:48px}.prof-placement{grid-column:1/-1;min-height:54px}.prof-badges{align-items:flex-start}}
@media(max-width:820px){.player-forecast-hero{grid-template-columns:1fr}.player-forecast-hero-grid{grid-template-columns:repeat(3,minmax(0,1fr));}}
@media(max-width:560px){.player-forecast.pro .player-forecast-grid,.player-forecast-hero-grid{grid-template-columns:1fr;}}
`);

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  STATE                                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const S = {
  playtime:0, lastTs:Date.now(),
  lastAlliCreds:0, dailyEarn:0,
  vehicleTotal:0, buildingTotal:0, buildingTypes:0,
  lastDate:todayStr(),
  creditHist:[],     // [{ts,v}]
  allianceDaily:[],   // [{date,start,end}]
  allianceSnapshot:null,
  playtimeDaily:[],   // [{date,seconds}]
  userCredits:0, userCoins:0, userId:null,
  playerDaily:[],
  playerRanking:{rank:null,status:"",rows:[],lastTs:0,loading:false},
  playerRankHistory:{date:"",startRank:null,lastRank:null,bestRank:null,worstRank:null,updates:0,lastTs:0},
  allianceId:null, allianceName:"", allianceRank:null, allianceCredits:0,
  weather:null, weatherTs:0, weatherLoc:"",
  gameEvents:[],
  profile:{name:"-",since:"-",avatar:"",rank:"-",progress:0,progressText:"-",reward:"",needText:"",roles:[],totalCredits:0},
  weatherAlertKey:"",
  lastApiTs:null,
  teamAdmin:{details:{},detailsByName:{},users:{},loading:false,lastTs:0,error:""},
  allianceActivity:{date:"",missions:0,patients:0,prisoners:0,seen:[]},
  allianceActivityLive:{},
  currentMissions:{},
  dataCache:{vehicles:{},buildings:[],schoolings:[],aaos:[],aaoCategories:[],pois:[],missionTypes:null,missions:[],missionMetaById:{},missionMetaByName:{},allianceEventTypes:[],lastMetaTs:0},
  update:{previousVersion:"",justUpdated:false,availableVersion:"",checking:false,lastCheck:0,error:""},
  diagnostics:{errors:[],created:0,lastReportTs:0,lastAnalysis:null},
  settings:{
    notifications:false,
    coins:true,
    compact:false,
    panelPlacement:"default",
    panelMode:"embedded",
    panelCollapsed:false,
    panelTheme:"summer",
    navButtonStyle:"standard",
    playerForecastPlacement:"profile",
    language:"de",
    weatherLocation:"",
    weatherCountry:"DE",
    weatherMode:"off", // off | settings | overview
    weatherSound:false,
    weatherTone:"beep",
    eventMode:"overview", // off | overview
    creditPopupEnabled:true,
    creditPopupSound:true,
    creditPopupSoundType:"kaching",
    creditPopupVolume:65,
    creditPopupSize:"medium",
    creditPopupPosition:"right-center",
    creditPopupAnimation:"slide",
    creditPopupDuration:5000,
    creditPopupMinimum:1,
    playtimeEnabled:true,
    forecastEnabled:true,
    forecastTarget:30000000000,
    hotkeysEnabled:true,
    panelHotkey:"Alt+V",
    collapseHotkey:"Alt+C",
  },
};

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  PERSISTENCE                                                 â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function save(){
  const today=todayStr();
  GM_setValue("v7_pt",  S.playtime);
  GM_setValue("v7_lts", S.lastTs);
  GM_setValue("v7_lc",  S.lastAlliCreds);
  GM_setValue("v7_de",  S.dailyEarn);
  GM_setValue("v7_ld",  S.lastDate||today);
  GM_setValue("v7_ch",  JSON.stringify(S.creditHist));
  GM_setValue("v7_ad",  JSON.stringify(S.allianceDaily));
  GM_setValue("v7_as",  JSON.stringify(S.allianceSnapshot));
  GM_setValue("v7_pd",  JSON.stringify(S.playtimeDaily));
  GM_setValue("v7_player_daily",JSON.stringify(S.playerDaily));
  GM_setValue("v7_player_rank",JSON.stringify(S.playerRanking));
  GM_setValue("v7_player_rank_hist",JSON.stringify(S.playerRankHistory));
  GM_setValue("v7_alliance_activity",JSON.stringify(S.allianceActivity));
  GM_setValue("v7_diag",JSON.stringify(S.diagnostics));
  GM_setValue("v7_set", JSON.stringify(S.settings));
}
function saveWeatherCache(){
  const loc=(S.settings.weatherLocation||"").trim();
  const locKey=`${S.settings.weatherCountry||"DE"}|${loc}`;
  if(!loc || !S.weather || S.weather.error) return;
  S.weatherTs=Date.now();
  S.weatherLoc=locKey;
  GM_setValue("v7_wx_cache", JSON.stringify({loc:locKey,ts:S.weatherTs,data:S.weather}));
}
function loadWeatherCache(){
  const loc=(S.settings.weatherLocation||"").trim();
  const locKey=`${S.settings.weatherCountry||"DE"}|${loc}`;
  if(!loc) return;
  try{
    const cache=JSON.parse(GM_getValue("v7_wx_cache","null"));
    if(!cache || cache.loc!==locKey || !cache.data) return;
    if(Date.now()-(Number(cache.ts)||0)>10800000) return;
    S.weather=cache.data;
    S.weatherTs=Number(cache.ts)||Date.now();
    S.weatherLoc=locKey;
  }catch{}
}
function load(){
  const today=todayStr();
  const saved=GM_getValue("v7_ld",today);
  const storedPlaytime=GM_getValue("v7_pt",0);
  const newDay=saved!==today;
  S.playtime     =newDay?0:storedPlaytime;
  S.lastAlliCreds=GM_getValue("v7_lc",0);
  S.dailyEarn    =newDay?0:GM_getValue("v7_de",0);
  S.lastTs       =Date.now();
  S.lastDate     =today;
  try{S.creditHist=JSON.parse(GM_getValue("v7_ch","[]"))||[];}catch{S.creditHist=[];}
  try{S.allianceDaily=JSON.parse(GM_getValue("v7_ad","[]"))||[];}catch{S.allianceDaily=[];}
  try{S.allianceSnapshot=JSON.parse(GM_getValue("v7_as","null"));}catch{S.allianceSnapshot=null;}
  try{S.playtimeDaily=JSON.parse(GM_getValue("v7_pd","[]"))||[];}catch{S.playtimeDaily=[];}
  try{S.playerDaily=JSON.parse(GM_getValue("v7_player_daily","[]"))||[];}catch{S.playerDaily=[];}
  try{Object.assign(S.playerRanking,JSON.parse(GM_getValue("v7_player_rank","{}"))||{});}catch{}
  try{Object.assign(S.playerRankHistory,JSON.parse(GM_getValue("v7_player_rank_hist","{}"))||{});}catch{}
  try{Object.assign(S.allianceActivity,JSON.parse(GM_getValue("v7_alliance_activity","{}"))||{});}catch{}
  try{Object.assign(S.diagnostics,JSON.parse(GM_getValue("v7_diag","{}"))||{});}catch{}
  S.diagnostics.errors=Array.isArray(S.diagnostics.errors)?S.diagnostics.errors.slice(0,40):[];
  S.diagnostics.created=Math.max(0,Number(S.diagnostics.created)||0);
  S.diagnostics.lastReportTs=Math.max(0,Number(S.diagnostics.lastReportTs)||0);
  S.diagnostics.lastAnalysis=S.diagnostics.lastAnalysis&&typeof S.diagnostics.lastAnalysis==="object"?S.diagnostics.lastAnalysis:null;
  S.allianceActivity.date=String(S.allianceActivity.date||today);
  S.allianceActivity.missions=Math.max(0,Number(S.allianceActivity.missions)||0);
  S.allianceActivity.patients=Math.max(0,Number(S.allianceActivity.patients)||0);
  S.allianceActivity.prisoners=Math.max(0,Number(S.allianceActivity.prisoners)||0);
  S.allianceActivity.seen=Array.isArray(S.allianceActivity.seen)?S.allianceActivity.seen.map(String).slice(-500):[];
  if(S.allianceActivity.date!==today)S.allianceActivity={date:today,missions:0,patients:0,prisoners:0,seen:[]};
  S.playerRanking.loading=false;
  normalizePlayerRankHistory();
  if(newDay && saved && storedPlaytime>0)recordPlaytimeDay(saved,storedPlaytime);
  try{Object.assign(S.settings,JSON.parse(GM_getValue("v7_set","{}"))||{});}catch{}
  S.update.previousVersion=String(GM_getValue("v7_installed_version","")||"");
  const existingInstallation=!!GM_getValue("v7_layout_default_done",false);
  S.update.justUpdated=S.update.previousVersion?compareVersions(V,S.update.previousVersion)>0:existingInstallation;
  GM_setValue("v7_installed_version",V);
  const validPlacements=["default","top-left","top-right","bottom-left","bottom-right"];
  if(!validPlacements.includes(S.settings.panelPlacement)) S.settings.panelPlacement="default";
  const validModes=["floating","embedded"];
  if(!validModes.includes(S.settings.panelMode)) S.settings.panelMode="embedded";
  if(typeof S.settings.panelCollapsed!=="boolean") S.settings.panelCollapsed=false;
  delete S.settings.panelSize;
  const validNavStyles=["logo","standard","standard-no-event","name"];
  if(!validNavStyles.includes(S.settings.navButtonStyle))S.settings.navButtonStyle="standard";
  if(!["profile","both"].includes(S.settings.playerForecastPlacement))S.settings.playerForecastPlacement="profile";
  const validThemes=["dark","light","summer","summer-dark","lcars"];
  if(!validThemes.includes(S.settings.panelTheme)) S.settings.panelTheme="summer";
  const validLanguages=["de","en","fr"];
  if(!validLanguages.includes(S.settings.language)) S.settings.language="de";
  const validWeatherCountries=Object.keys(WEATHER_COUNTRIES);
  if(!validWeatherCountries.includes(S.settings.weatherCountry)) S.settings.weatherCountry="DE";
  if(!GM_getValue("v901_summer_theme_done",false)){
    S.settings.panelTheme="summer";
    GM_setValue("v901_summer_theme_done",true);
    GM_setValue("v7_set",JSON.stringify(S.settings));
  }
  const validWeatherModes=["off","settings","overview"];
  if(!validWeatherModes.includes(S.settings.weatherMode)) S.settings.weatherMode="off";
  const validEventModes=["off","overview"];
  if(!validEventModes.includes(S.settings.eventMode)) S.settings.eventMode="overview";
  if(typeof S.settings.weatherSound!=="boolean") S.settings.weatherSound=false;
  if(typeof S.settings.creditPopupEnabled!=="boolean")S.settings.creditPopupEnabled=true;
  if(typeof S.settings.creditPopupSound!=="boolean")S.settings.creditPopupSound=true;
  if(!["kaching","coins","register","success","soft","arcade"].includes(S.settings.creditPopupSoundType))S.settings.creditPopupSoundType="kaching";
  const creditVolume=Number(S.settings.creditPopupVolume);
  S.settings.creditPopupVolume=Number.isFinite(creditVolume)?Math.max(0,Math.min(100,Math.round(creditVolume))):65;
  if(!["small","medium","large"].includes(S.settings.creditPopupSize))S.settings.creditPopupSize="medium";
  if(!["right-top","right-center","right-bottom","left-top","left-center","left-bottom"].includes(S.settings.creditPopupPosition))S.settings.creditPopupPosition="right-center";
  if(!["slide","float","scale","bounce","fade"].includes(S.settings.creditPopupAnimation))S.settings.creditPopupAnimation="slide";
  S.settings.creditPopupDuration=Math.max(2000,Math.min(12000,Number(S.settings.creditPopupDuration)||5000));
  S.settings.creditPopupMinimum=Math.max(1,Math.round(Number(S.settings.creditPopupMinimum)||1));
  const validTones=["beep","alarm","chime"];
  if(!validTones.includes(S.settings.weatherTone)) S.settings.weatherTone="beep";
  if(typeof S.settings.playtimeEnabled!=="boolean") S.settings.playtimeEnabled=true;
  if(typeof S.settings.forecastEnabled!=="boolean") S.settings.forecastEnabled=true;
  S.settings.forecastTarget=Math.max(1,Number(S.settings.forecastTarget)||30000000000);
  if(typeof S.settings.hotkeysEnabled!=="boolean") S.settings.hotkeysEnabled=true;
  S.settings.panelHotkey=S.settings.panelHotkey===""?"":(normalizeHotkey(S.settings.panelHotkey)||"Alt+V");
  S.settings.collapseHotkey=S.settings.collapseHotkey===""?"":(normalizeHotkey(S.settings.collapseHotkey)||"Alt+C");
  if(S.settings.panelHotkey && S.settings.panelHotkey===S.settings.collapseHotkey)S.settings.collapseHotkey=S.settings.panelHotkey==="Alt+C"?"Alt+V":"Alt+C";
  delete S.settings.forecastDeadline;
  loadWeatherCache();
  if(!GM_getValue("v7_layout_default_done",false)){
    S.settings.panelMode="embedded";
    S.settings.panelPlacement="default";
    GM_setValue("v7_set", JSON.stringify(S.settings));
    GM_setValue("v7_layout_default_done",true);
  }
  if(newDay)save();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  UTILITIES                                                   â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function todayStr(){return localDateKey();}
function uiLocale(){return S.settings.language==="fr"?"fr-FR":S.settings.language==="en"?"en-GB":"de-DE";}
function tr(text){return I18N[S.settings.language]?.[String(text)]||String(text);}
function applyTranslations(root){
  if(!root || S.settings.language==="de")return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{
    const raw=node.nodeValue||"";
    const trimmed=raw.trim();
    if(!trimmed)return;
    const translated=I18N[S.settings.language]?.[trimmed];
    if(translated)node.nodeValue=raw.replace(trimmed,translated);
  });
  root.querySelectorAll?.("[placeholder],[title]").forEach(el=>{
    ["placeholder","title"].forEach(attr=>{
      const value=el.getAttribute(attr);
      const translated=value&&I18N[S.settings.language]?.[value];
      if(translated)el.setAttribute(attr,translated);
    });
  });
}
function localDateKey(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function dateKeyToLocalDate(key){
  const m=String(key||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return new Date();
  return new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
}
function dayLabel(key){
  const d=dateKeyToLocalDate(key);
  const today=localDateKey();
  const yesterday=localDateKey(new Date(Date.now()-86400000));
  if(key===today)return tr("Heute");
  if(key===yesterday)return tr("Gestern");
  return d.toLocaleDateString(uiLocale(),{weekday:"short",day:"2-digit",month:"2-digit"});
}
function fmt(n,u=""){return typeof n==="number"?n.toLocaleString(uiLocale())+(u?" "+u:""):"-";}
function fmtMoney(n){return typeof n==="number"?n.toLocaleString(uiLocale())+" ¢":"-";}
function fmtKm(n){
  if(typeof n!=="number")return "-";
  return n>=1000000?(n/1000000).toFixed(1)+" Mio km":
         n>=1000?(n/1000).toFixed(1)+" Tkm":n+" km";
}
function fmtHHMM(s){
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return [h,m,sec].map(x=>String(x).padStart(2,"0")).join(":");
}
function fmtClock(){
  return new Date().toLocaleString(uiLocale(),{
    weekday:"short",day:"2-digit",month:"2-digit",year:"numeric",
    hour:"2-digit",minute:"2-digit",second:"2-digit"
  }).replace(",","");
}
function renderClock(){
  const now=new Date();
  $("#lss7-clock .qs-clock-time").text(now.toLocaleTimeString(uiLocale(),{hour:"2-digit",minute:"2-digit",second:"2-digit"}));
  $("#lss7-clock .qs-clock-date").text(now.toLocaleDateString(uiLocale(),{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}));
}
function escHtml(v){
  return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}
function safeSameOriginPath(path,fallback="/"){
  const raw=String(path||"").trim();
  if(!raw || /^(?:javascript|data|vbscript):/i.test(raw))return fallback;
  try{
    const u=new URL(raw,BASE);
    if(u.origin!==BASE)return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  }catch{return fallback;}
}
function safeExternalUrl(url,fallback="#"){
  const raw=String(url||"").trim();
  if(!raw || /^(?:javascript|data|vbscript):/i.test(raw))return fallback;
  try{
    const u=new URL(raw,location.href);
    return /^https?:$/.test(u.protocol)?u.href:fallback;
  }catch{return fallback;}
}
function normalizeHotkey(value){
  const raw=String(value||"").trim();
  if(!raw)return "";
  const parts=raw.split("+").map(x=>x.trim()).filter(Boolean);
  const key=parts.pop();
  if(!key)return "";
  const mods=new Set(parts.map(x=>x.toLowerCase()));
  const out=[];
  if(mods.has("ctrl")||mods.has("control")||mods.has("strg"))out.push("Ctrl");
  if(mods.has("alt"))out.push("Alt");
  if(mods.has("shift")||mods.has("umschalt"))out.push("Shift");
  const k=key.length===1?key.toUpperCase():key.charAt(0).toUpperCase()+key.slice(1);
  out.push(k);
  return out.join("+");
}
function hotkeyLabel(value){
  return normalizeHotkey(value)||"Nicht belegt";
}
function hotkeyCaptureButton(key,label,value){
  return `<button class="hotkey-capture" type="button" data-hotkey-key="${escHtml(key)}" title="Klicken und danach gewünschte Taste drücken">
    <span class="hotkey-title">${escHtml(label)}</span>
    <span class="hotkey-value">${escHtml(hotkeyLabel(value))}</span>
    <span class="hotkey-hint">Klicken zum Ändern</span>
  </button>`;
}
function eventHotkey(e){
  if(["Control","Alt","Shift","Meta"].includes(e.key))return "";
  const key=e.key===" "?"Space":(String(e.key||"").length===1?String(e.key).toUpperCase():String(e.key||""));
  return `${e.ctrlKey?"Ctrl+":""}${e.altKey?"Alt+":""}${e.shiftKey?"Shift+":""}${key}`;
}
function isTypingTarget(target){
  if(!target)return false;
  const el=target instanceof Element?target:null;
  if(!el)return false;
  if(el.closest(".hotkey-capture"))return false;
  return !!el.closest("input,textarea,select,[contenteditable='true'],[contenteditable='']");
}
let activeHotkeyCapture="";
function refreshHotkeyButtons(){
  $(".hotkey-capture").each(function(){
    const key=String($(this).data("hotkey-key")||"");
    $(this).toggleClass("recording",activeHotkeyCapture===key);
    $(this).find(".hotkey-value").text(activeHotkeyCapture===key?"Taste drücken...":hotkeyLabel(S.settings[key]));
    $(this).find(".hotkey-hint").text(activeHotkeyCapture===key?"Esc bricht ab · Entf löscht":"Klicken zum Ändern");
  });
}
function startHotkeyCapture(key){
  activeHotkeyCapture=String(key||"");
  refreshHotkeyButtons();
}
function commitHotkeyCapture(value){
  const key=activeHotkeyCapture;
  if(!key)return false;
  if(["Control","Alt","Shift","Meta"].includes(String(value||"")))return true;
  if(value==="Escape"){
    activeHotkeyCapture="";
    refreshHotkeyButtons();
    return true;
  }
  if(value==="Backspace"||value==="Delete"){
    S.settings[key]="";
    activeHotkeyCapture="";
    save();refreshHotkeyButtons();
    return true;
  }
  const next=normalizeHotkey(value);
  if(!next)return true;
  if(key==="panelHotkey" && next===normalizeHotkey(S.settings.collapseHotkey))S.settings.collapseHotkey="";
  if(key==="collapseHotkey" && next===normalizeHotkey(S.settings.panelHotkey))S.settings.panelHotkey="";
  S.settings[key]=next;
  activeHotkeyCapture="";
  save();refreshHotkeyButtons();
  return true;
}
function fmtCountdownMs(endTs){
  const end=Number(endTs)||0;
  if(!end)return "-";
  const diff=Math.max(0,end-Date.now());
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  const s=Math.floor((diff%60000)/1000);
  const time=`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
  return d>0?`${d}T ${time}`:time;
}
function gameEventIcon(type,title){
  const t=`${type} ${title}`.toLowerCase();
  if(t.includes("coin"))return "C";
  if(t.includes("credit"))return "¢";
  if(t.includes("einsatz"))return "!";
  return "EV";
}
function profEventGemHtml(){
  return `<span class="prof-event-gem" aria-label="Info zu Credit-Events">&#9670;<span class="prof-event-tip"><b>Doppelte Credits f&uuml;r regul&auml;re Eins&auml;tze</b>Erledige Eins&auml;tze und verdiene 2x Credits f&uuml;r regul&auml;re Eins&auml;tze. (Eins&auml;tze, die zu Verbands-Events geh&ouml;ren und Verbands-Gro&szlig;eins&auml;tze sind ausgeschlossen)</span></span>`;
}
function profEventSirenHtml(){
  return `<span class="prof-event-gem siren" aria-label="Info zu Einsatz-Events">&#128680;<span class="prof-event-tip"><b>Einsatz-Event</b>Spare 50% beim sofortigen Beenden von Eins&auml;tzen!</span></span>`;
}
function profEventSaleHtml(){
  return `<span class="prof-event-gem sale" aria-label="Info zum Coin-Sale">%<span class="prof-event-tip"><b>Coin-Sale aktiv</b>Die Echtgeldw&auml;hrung Coins ist aktuell reduziert. Die genaue verbleibende Zeit wird direkt aus der Spielnavigation &uuml;bernommen.</span></span>`;
}
function isCreditGameEvent(ev){
  return `${ev?.type||""} ${ev?.title||""}`.toLowerCase().includes("credit");
}
function isSaleGameEvent(ev){
  return `${ev?.type||""} ${ev?.title||""} ${ev?.desc||""}`.toLowerCase().includes("sale");
}
function isCoinGameEvent(ev){
  const t=`${ev?.type||""} ${ev?.title||""} ${ev?.desc||""}`.toLowerCase();
  return t.includes("coin") || t.includes("einsatz-event") || t.includes("sofortigen beenden");
}
function profEventActionHtml(ev){
  if(isSaleGameEvent(ev))return profEventSaleHtml();
  if(isCreditGameEvent(ev))return profEventGemHtml();
  if(isCoinGameEvent(ev))return profEventSirenHtml();
  return "";
}
function profileGameEventRowHtml(ev){
  const action=profEventActionHtml(ev);
  const sale=isSaleGameEvent(ev),tag=sale?"a":"div";
  const link=sale?` href="${BASE}/coins" target="_blank" rel="noopener" title="Coin-Shop öffnen"`:"";
  return `<${tag} class="prof-event-row active${sale?" prof-event-row-link":""}"${link} data-event-key="${escHtml(ev.key||ev.title||"event")}">
    <span class="prof-event-dot"></span>
    <span class="prof-event-main">
      <span class="prof-event-titleline">
        <span class="prof-event-label">${escHtml(ev.title||"Leitstellenspiel Event")}</span>
        ${action}
      </span>
      <span class="prof-event-type">${escHtml(ev.type||"Live-Event")}</span>
    </span>
    <span class="prof-event-time" data-event-time="${escHtml(ev.key||ev.title||"event")}">${escHtml(fmtCountdownMs(ev.end))}</span>
  </${tag}>`;
}
function profileGameEventIdleHtml(){
  return `<div class="prof-event-row">
    <span class="prof-event-dot"></span>
    <span class="prof-event-main">
      <span class="prof-event-titleline">
        <span class="prof-event-label">Derzeit kein Leitstellenspiel-Event aktiv</span>
      </span>
      <span class="prof-event-type">Live-Status</span>
    </span>
    <span class="prof-event-time">-</span>
  </div>`;
}
function updateProfileGameEventTimes(prof,events){
  const map=new Map(events.map(ev=>[String(ev.key||ev.title||"event"),fmtCountdownMs(ev.end)]));
  prof.find(".prof-event-row.active").each(function(){
    const key=String($(this).attr("data-event-key")||"");
    const val=map.get(key);
    if(val)$(this).find(".prof-event-time").text(val);
  });
}
function parseSaleCountdownMs(text){
  const raw=String(text||"");
  const dayMatch=raw.match(/(\d+)\s*Tag/i);
  const timeMatch=raw.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  const days=dayMatch?parseInt(dayMatch[1],10)||0:0;
  if(!timeMatch && !days)return 0;
  const hours=timeMatch?parseInt(timeMatch[1],10)||0:0;
  const minutes=timeMatch?parseInt(timeMatch[2],10)||0:0;
  const seconds=timeMatch?parseInt(timeMatch[3],10)||0:0;
  return (((days*24+hours)*60+minutes)*60+seconds)*1000;
}
function readGameEventsFromDom(){
  const nodes=Array.from(document.querySelectorAll("li#event-info-block.timer-event, li.timer-event.credit-modifier-event, li.timer-event.coin-reduction-event"));
  const seen=new Set();
  const events=nodes.map((el,idx)=>{
    const $el=$(el);
    const timer=$el.find(".timer[data-end-time]").first();
    const end=Number(timer.attr("data-end-time")||0);
    if(end && end<=Date.now())return null;
    const title=(
      $el.find(".credits-title").first().text().trim() ||
      $el.clone().children(".timer,a,img").remove().end().text().replace(/\s+/g," ").trim() ||
      "Leitstellenspiel Event"
    );
    const desc=String($el.attr("data-original-title")||$el.attr("title")||"").trim();
    const type=$el.hasClass("coin-reduction-event") ? "Coin-Rabatt" :
      $el.hasClass("credit-modifier-event") ? "Credit-Boost" : "Live-Event";
    const key=`${type}|${title}|${end||idx}`;
    if(seen.has(key))return null;
    seen.add(key);
    return {key,type,title,desc,end,icon:gameEventIcon(type,title)};
  }).filter(Boolean);
  const sale=document.querySelector("#sale_countdown");
  const saleText=String(sale?.textContent||"").replace(/\s+/g," ").trim();
  if(sale && /sale/i.test(saleText)){
    const remaining=parseSaleCountdownMs(saleText);
    events.push({
      key:"coin-sale",
      type:"Coin-Sale",
      title:"Coin-Sale aktiv",
      desc:"Die Echtgeldwährung Coins ist aktuell reduziert.",
      end:remaining?Date.now()+remaining:0,
      icon:"%"
    });
  }
  return events;
}
function scanGameEvents(){
  S.gameEvents=readGameEventsFromDom();
  renderGameEvents();
}
function gameEventRowHtml(ev,mini=false){
  const desc=mini?"":`<div class="game-event-desc">${escHtml(ev.desc||"Laufendes Spiel-Event")}</div>`;
  const sale=isSaleGameEvent(ev),tag=sale?"a":"div";
  const link=sale?` href="${BASE}/coins" target="_blank" rel="noopener" title="Coin-Shop öffnen"`:"";
  return `<${tag} class="game-event-row${sale?" game-event-row-link":""}"${link}>
    <span class="game-event-ico${sale?" sale":""}">${escHtml(ev.icon)}</span>
    <span class="game-event-main">
      <span class="game-event-title">${escHtml(ev.title)}</span>
      ${desc}
    </span>
    <span class="game-event-time">${escHtml(fmtCountdownMs(ev.end))}</span>
  </${tag}>`;
}
function activeGameEvents(){
  const active=(S.gameEvents||[]).filter(ev=>!ev.end || Number(ev.end)>Date.now());
  if(active.length!==S.gameEvents.length)S.gameEvents=active;
  return active;
}
function fmtShortTime(ts){
  return new Date(ts).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"});
}
function timeAgo(ts){
  if(!ts)return "-";
  const d=Math.round((Date.now()-ts)/1000);
  if(d<60)return `vor ${d}s`;
  if(d<3600)return `vor ${Math.floor(d/60)}m`;
  return `vor ${Math.floor(d/3600)}h`;
}
function setV(sel,val){
  const root=$("#lss7");
  const el=root.is(sel)?root:root.find(sel);if(!el.length)return;
  const v=String(val);
  if(el.text()!==v){
    el.text(v);
    el.removeClass("lflash");
    void el[0].offsetWidth;
    el.addClass("lflash");
  }
}
function setH(sel,html){const root=$("#lss7");(root.is(sel)?root:root.find(sel)).html(html);}
function spin(sel){const root=$("#lss7");(root.is(sel)?root:root.find(sel)).html(`<span class="lspin"></span>`);}
function htmlJoin(items,mapper){return (items||[]).map(mapper).join("");}

function shouldRecordApiIssue(url){
  return !/\/api\/v1\/aao_categories(?:\?|$)/.test(String(url||""));
}
function retryDelay(attempt){return Math.min(12000,650*Math.pow(2,Math.max(0,attempt-1))+Math.round(Math.random()*240));}
function shouldRetryStatus(status){return status===0||status===-1||status===408||status===429||status>=500||status==="timeout"||status==="network";}
function requestAllowedOrigins(){
  return new Set([
    location.origin,BASE,"https://raw.githubusercontent.com","https://github.com",
    "https://api.open-meteo.com","https://geocoding-api.open-meteo.com","https://api.zippopotam.us","https://www.dwd.de"
  ]);
}
function normalizeRequestUrl(url){
  const raw=String(url||"").trim();
  if(!raw || raw.length>2048 || /^(?:javascript|data|vbscript|file):/i.test(raw))throw new Error("Unsichere oder zu lange URL blockiert.");
  const u=new URL(raw,location.href);
  if(!/^https?:$/.test(u.protocol))throw new Error("Nicht unterstütztes URL-Protokoll blockiert.");
  if(!requestAllowedOrigins().has(u.origin))throw new Error(`Nicht erlaubte externe Quelle blockiert: ${u.origin}`);
  return u.href;
}
function scheduleRequestByOrigin(url,fn){
  let origin=location.origin;
  try{origin=new URL(url).origin;}catch{}
  const now=Date.now();
  const last=Number(SECURITY.lastRequestByOrigin.get(origin)||0);
  const wait=Math.max(0,SECURITY.minRequestGapMs-(now-last));
  SECURITY.lastRequestByOrigin.set(origin,now+wait);
  setTimeout(fn,wait);
}
function requestTextWithRetry(url,{timeout=12000,retries=2,record=true,label="request"}={},cb,onErr){
  let safeUrl="";
  try{safeUrl=normalizeRequestUrl(url);}
  catch(e){recordDiagnosticError(`${label}.blocked`,e,{url:String(url||"").slice(0,180)});onErr&&onErr("blocked");return;}
  const key=`GET ${safeUrl}`;
  if(SECURITY.pendingRequests.has(key)){
    SECURITY.pendingRequests.get(key).push({cb,onErr});
    return;
  }
  SECURITY.pendingRequests.set(key,[{cb,onErr}]);
  const finishOk=(txt,r)=>{
    const subscribers=SECURITY.pendingRequests.get(key)||[];
    SECURITY.pendingRequests.delete(key);
    subscribers.forEach(s=>{try{s.cb&&s.cb(txt,r);}catch(e){recordDiagnosticError(`${label}.callback`,e,{url:safeUrl});}});
  };
  const finishErr=(err)=>{
    const subscribers=SECURITY.pendingRequests.get(key)||[];
    SECURITY.pendingRequests.delete(key);
    subscribers.forEach(s=>{try{s.onErr&&s.onErr(err);}catch(e){recordDiagnosticError(`${label}.errorCallback`,e,{url:safeUrl});}});
  };
  let attempt=0;
  const run=()=>{
    attempt++;
    scheduleRequestByOrigin(safeUrl,()=>{
      try{
      GM_xmlhttpRequest({
        method:"GET",url:safeUrl,timeout,
        onload(r){
          if(r.status>=200&&r.status<300){finishOk(String(r.responseText||""),r);return;}
          if(attempt<=retries+1&&shouldRetryStatus(r.status)){
            logDebug(`${label} retry`,safeUrl,r.status,attempt);
            setTimeout(run,retryDelay(attempt));return;
          }
          if(record&&shouldRecordApiIssue(safeUrl))recordDiagnosticError(`${label}.http`,`HTTP ${r.status}`,{url:safeUrl,status:r.status,attempts:attempt});
          finishErr(r.status);
        },
        onerror(){
          if(attempt<=retries+1){setTimeout(run,retryDelay(attempt));return;}
          if(record&&shouldRecordApiIssue(safeUrl))recordDiagnosticError(`${label}.network`,"Netzwerkfehler",{url:safeUrl,attempts:attempt});
          finishErr(-1);
        },
        ontimeout(){
          if(attempt<=retries+1){setTimeout(run,retryDelay(attempt));return;}
          if(record&&shouldRecordApiIssue(safeUrl))recordDiagnosticError(`${label}.timeout`,"Zeitüberschreitung",{url:safeUrl,timeout,attempts:attempt});
          finishErr("timeout");
        }
      });
      }catch(e){
      if(attempt<=retries+1){setTimeout(run,retryDelay(attempt));return;}
      if(record&&shouldRecordApiIssue(safeUrl))recordDiagnosticError(`${label}.exception`,e,{url:safeUrl,attempts:attempt});
      finishErr("network");
      }
    });
  };
  run();
}
function apiGet(url,cb,onErr){
  requestTextWithRetry(url,{timeout:14000,retries:2,label:"api"},(txt,r)=>{
    const clean=String(txt||"").trim();
    if(!clean || /^</.test(clean)){ onErr&&onErr("parse"); if(shouldRecordApiIssue(url))recordDiagnosticError("api.empty",`Leere oder HTML-Antwort von ${url}`,{url,status:r?.status}); logDebug("api returned html/empty",url); return; }
    try{cb(JSON.parse(clean));}
    catch(e){onErr&&onErr("parse"); if(shouldRecordApiIssue(url))recordDiagnosticError("api.parse",e,{url,status:r?.status}); logDebug("api parse",url,e);}
  },onErr);
}
function pageGet(url,cb,onErr){
  const fallback=()=>fetchTextFallback(url,cb,onErr);
  requestTextWithRetry(url,{timeout:12000,retries:1,record:false,label:"page"},txt=>cb(txt||""),err=>{fallback();logDebug("page retry/fallback",url,err);});
}
function fetchTextFallback(url,cb,onErr){
  if(typeof fetch!=="function"){onErr&&onErr("network");return;}
  let safeUrl="";
  try{safeUrl=normalizeRequestUrl(url);}
  catch(e){recordDiagnosticError("fetch.blocked",e,{url:String(url||"").slice(0,180)});onErr&&onErr("blocked");return;}
  fetch(safeUrl,{cache:"no-store"}).then(r=>{
    if(!r.ok)throw new Error(String(r.status));
    return r.text();
  }).then(txt=>cb(txt||"")).catch(e=>{
    recordDiagnosticError("fetch.fallback",e,{url:safeUrl});
    logDebug("fetch fallback fail",safeUrl,e);
    onErr&&onErr(String(e?.message||"network"));
  });
}
function fetchJsonFallback(url,cb,onErr){
  fetchTextFallback(url,txt=>{
    try{cb(JSON.parse(txt||"{}"));}
    catch{onErr&&onErr("parse");}
  },onErr);
}
function jsonGet(url,cb,onErr){
  const fallback=()=>fetchJsonFallback(url,cb,onErr);
  requestTextWithRetry(url,{timeout:12000,retries:1,label:"json"},txt=>{
    try{cb(JSON.parse(txt||"{}"));}
    catch{fallback();}
  },()=>fallback());
}
function apiArray(data,...keys){
  if(Array.isArray(data))return data;
  for(const key of keys){
    if(Array.isArray(data?.[key]))return data[key];
  }
  if(Array.isArray(data?.result))return data.result;
  if(data&&typeof data==="object"){
    const vals=Object.values(data);
    if(vals.length&&vals.every(v=>v&&typeof v==="object"&&!Array.isArray(v)))return vals;
  }
  return [];
}
function apiGetPaged(url,cb,onErr,{limit=500,maxPages=30,keys=[]}={}){
  const all=[];
  let after="",page=0;
  const sep=url.includes("?")?"&":"?";
  const next=()=>{
    page++;
    const pageUrl=`${url}${sep}limit=${limit}${after?`&after=${encodeURIComponent(after)}`:""}`;
    apiGet(pageUrl,data=>{
      const arr=apiArray(data,...keys);
      all.push(...arr);
      const last=arr[arr.length-1];
      const nextAfter=last?.id??last?.building_id??last?.vehicle_id??"";
      if(arr.length>=limit && nextAfter && page<maxPages){
        after=String(nextAfter);
        next();
      }else cb(all);
    },err=>{
      if(all.length)cb(all);
      else onErr&&onErr(err);
    });
  };
  next();
}
function csvEscape(value){
  const s=String(value??"");
  return /[;"\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;
}
function toCsv(rows,headers){
  const cols=headers||Object.keys(rows[0]||{});
  return [cols.join(";"),...rows.map(row=>cols.map(col=>csvEscape(row[col])).join(";"))].join("\n");
}
function downloadTextFile(filename,text,type="text/csv;charset=utf-8"){
  const blob=new Blob(["\uFEFF",text],{type});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function backupPayload(){
  return {
    type:"lss-verband-statistik-pro-backup",
    version:V,
    createdAt:new Date().toISOString(),
    host:location.host,
    data:{
      playtime:S.playtime,lastTs:S.lastTs,lastAlliCreds:S.lastAlliCreds,dailyEarn:S.dailyEarn,lastDate:S.lastDate,
      creditHist:S.creditHist,allianceDaily:S.allianceDaily,allianceSnapshot:S.allianceSnapshot,playtimeDaily:S.playtimeDaily,
      playerDaily:S.playerDaily,playerRanking:S.playerRanking,playerRankHistory:S.playerRankHistory,
      allianceActivity:S.allianceActivity,diagnostics:S.diagnostics,settings:S.settings,weatherCache:S.weather?{loc:S.weatherLoc,ts:S.weatherTs,data:S.weather}:null
    }
  };
}
function exportFullBackup(){
  const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  downloadTextFile(`lss-verband-statistik-backup-${stamp}.json`,JSON.stringify(backupPayload(),null,2),"application/json;charset=utf-8");
  notify("Backup erstellt.");
}
function safeJsonClone(value,maxChars=8000){
  try{return JSON.parse(JSON.stringify(value,(k,v)=>typeof v==="string"?v.slice(0,maxChars):v));}
  catch{return null;}
}
function sanitizeBackupArray(value,max=750){
  return Array.isArray(value)?safeJsonClone(value.slice(-max))||[]:[];
}
function sanitizeBackupObject(value,fallback={}){
  return value&&typeof value==="object"&&!Array.isArray(value)?safeJsonClone(value)||fallback:fallback;
}
function sanitizeBackupSettings(value){
  const src=sanitizeBackupObject(value,{});
  const allowed=Object.keys(S.settings||{});
  const out={...S.settings};
  allowed.forEach(key=>{
    if(Object.prototype.hasOwnProperty.call(src,key))out[key]=src[key];
  });
  return out;
}
function validateBackupPayload(payload){
  if(!payload||typeof payload!=="object")throw new Error("Backup ist kein gültiges JSON-Objekt.");
  if(payload.type!=="lss-verband-statistik-pro-backup")throw new Error("Backup-Typ passt nicht zu diesem Skript.");
  if(!payload.data||typeof payload.data!=="object"||Array.isArray(payload.data))throw new Error("Backup enthält keinen gültigen Datenblock.");
  const allowedTop=new Set(["type","version","createdAt","host","data"]);
  Object.keys(payload).forEach(key=>{if(!allowedTop.has(key))throw new Error(`Unbekanntes Backup-Feld blockiert: ${key}`);});
  const created=Date.parse(payload.createdAt||"");
  if(payload.createdAt && !Number.isFinite(created))throw new Error("Backup-Datum ist ungültig.");
  if(payload.host && !GAME_HOSTS.has(String(payload.host)))throw new Error("Backup stammt nicht von einer unterstützten Spiel-Domain.");
  return payload.data;
}
function restoreBackupPayload(payload){
  const d=validateBackupPayload(payload);
  GM_setValue("v7_pt",Math.max(0,Number(d.playtime)||0));
  GM_setValue("v7_lts",Math.max(0,Number(d.lastTs)||Date.now()));
  GM_setValue("v7_lc",Number(d.lastAlliCreds)||0);
  GM_setValue("v7_de",Number(d.dailyEarn)||0);
  GM_setValue("v7_ld",/^\d{4}-\d{2}-\d{2}$/.test(String(d.lastDate||""))?String(d.lastDate):todayStr());
  GM_setValue("v7_ch",JSON.stringify(sanitizeBackupArray(d.creditHist,1200)));
  GM_setValue("v7_ad",JSON.stringify(sanitizeBackupArray(d.allianceDaily,90)));
  GM_setValue("v7_as",JSON.stringify(sanitizeBackupObject(d.allianceSnapshot,null)));
  GM_setValue("v7_pd",JSON.stringify(sanitizeBackupArray(d.playtimeDaily,90)));
  GM_setValue("v7_player_daily",JSON.stringify(sanitizeBackupArray(d.playerDaily,365)));
  GM_setValue("v7_player_rank",JSON.stringify(sanitizeBackupObject(d.playerRanking,{})));
  GM_setValue("v7_player_rank_hist",JSON.stringify(sanitizeBackupObject(d.playerRankHistory,{})));
  GM_setValue("v7_alliance_activity",JSON.stringify(sanitizeBackupObject(d.allianceActivity,{})));
  GM_setValue("v7_diag",JSON.stringify(sanitizeBackupObject(d.diagnostics,{})));
  GM_setValue("v7_set",JSON.stringify(sanitizeBackupSettings(d.settings)));
  if(d.weatherCache?.data)GM_setValue("v7_wx_cache",JSON.stringify(sanitizeBackupObject(d.weatherCache,{})));
  GM_setValue("v7_installed_version",V);
}
function importFullBackup(file){
  if(!file)return;
  if(file.size>SECURITY.maxBackupBytes){notify(`Backup ist zu groß (${Math.round(file.size/1024)} KB). Import blockiert.`,true);return;}
  if(!/\.json$/i.test(file.name||"") && file.type && !/json/i.test(file.type)){notify("Nur JSON-Backups können importiert werden.",true);return;}
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const payload=JSON.parse(String(reader.result||"{}"));
      restoreBackupPayload(payload);
      notify("Backup wiederhergestellt. Seite wird neu geladen.");
      setTimeout(()=>location.reload(),900);
    }catch(e){
      recordDiagnosticError("backup.restore",e,{name:file.name,size:file.size});
      notify(`Backup konnte nicht importiert werden: ${e.message||e}`,true);
    }
  };
  reader.onerror=()=>notify("Backup-Datei konnte nicht gelesen werden.",true);
  reader.readAsText(file);
}
function notify(msg,bad=false){
  const panel=$("#lss7");
  if(!panel.length){console[bad?"warn":"log"]("[LSS7]",msg);return;}
  let toast=panel.find(".lss7-toast");
  if(!toast.length)toast=$(`<div class="lss7-toast"></div>`).appendTo(panel);
  toast.toggleClass("bad",!!bad).text(String(msg||"")).addClass("show");
  clearTimeout(notify._t);
  notify._t=setTimeout(()=>toast.removeClass("show"),2600);
}
let creditBalanceReady=false;
let lastCreditBalance=0;
let creditObserver=null;
let creditObserverTimer=null;
let creditPollTimer=null;
function creditPopupTheme(){
  return ["dark","light","summer","summer-dark","lcars"].includes(S.settings.panelTheme)?S.settings.panelTheme:"dark";
}
function creditPopupContainer(){
  const position=S.settings.creditPopupPosition||"right-center";
  const size=S.settings.creditPopupSize||"medium";
  let box=document.getElementById("lss7-credit-popups");
  if(!box){
    box=document.createElement("div");
    box.id="lss7-credit-popups";
    document.body.appendChild(box);
  }
  box.className=`lss7-credit-popups pos-${position} size-${size}`;
  return box;
}
function playCreditSound(force=false){
  if(!force&&!S.settings.creditPopupSound)return;
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C)return;
    const ctx=new C();
    const rawVolume=Number(S.settings.creditPopupVolume);
    const volume=Math.max(0,Math.min(1,(Number.isFinite(rawVolume)?rawVolume:65)/100));
    if(volume<=0){ctx.close?.();return;}
    const profiles={
      kaching:{
        duration:.72,master:.13,
        notes:[
          {f:1318.5,t:0,d:.10,type:"sine",gain:.18},
          {f:1760,t:.08,d:.13,type:"triangle",gain:.17},
          {f:2637,t:.18,d:.22,type:"sine",gain:.15},
          {f:523.25,t:.02,d:.18,type:"triangle",gain:.28}
        ]
      },
      coins:{
        duration:.62,master:.12,
        notes:[
          {f:2093,t:0,d:.08,type:"square",gain:.09},
          {f:2637,t:.09,d:.08,type:"square",gain:.08},
          {f:3136,t:.18,d:.11,type:"triangle",gain:.12},
          {f:3520,t:.29,d:.15,type:"sine",gain:.14}
        ]
      },
      register:{
        duration:.78,master:.14,
        notes:[
          {f:196,t:0,d:.16,type:"sawtooth",gain:.18},
          {f:392,t:.04,d:.14,type:"square",gain:.12},
          {f:1568,t:.22,d:.09,type:"triangle",gain:.16},
          {f:2349,t:.31,d:.24,type:"sine",gain:.14}
        ]
      },
      success:{
        duration:.82,master:.12,
        notes:[
          {f:523.25,t:0,d:.18,type:"sine",gain:.18},
          {f:659.25,t:.13,d:.18,type:"sine",gain:.18},
          {f:783.99,t:.26,d:.18,type:"sine",gain:.18},
          {f:1046.5,t:.39,d:.30,type:"triangle",gain:.16}
        ]
      },
      soft:{
        duration:.92,master:.09,
        notes:[
          {f:440,t:0,d:.32,type:"sine",gain:.16},
          {f:554.37,t:.08,d:.36,type:"sine",gain:.14},
          {f:659.25,t:.18,d:.42,type:"sine",gain:.12},
          {f:880,t:.34,d:.38,type:"sine",gain:.10}
        ]
      },
      arcade:{
        duration:.64,master:.10,
        notes:[
          {f:659.25,t:0,d:.09,type:"square",gain:.10},
          {f:880,t:.09,d:.09,type:"square",gain:.10},
          {f:1174.66,t:.18,d:.09,type:"square",gain:.10},
          {f:1567.98,t:.27,d:.18,type:"square",gain:.09}
        ]
      }
    };
    const profile=profiles[S.settings.creditPopupSoundType]||profiles.kaching;
    const master=ctx.createGain();
    const compressor=ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18,ctx.currentTime);
    compressor.knee.setValueAtTime(18,ctx.currentTime);
    compressor.ratio.setValueAtTime(6,ctx.currentTime);
    compressor.attack.setValueAtTime(.003,ctx.currentTime);
    compressor.release.setValueAtTime(.20,ctx.currentTime);
    master.gain.setValueAtTime(.0001,ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(Math.max(.0002,Math.min(.9,profile.master*3.8*volume)),ctx.currentTime+.015);
    master.gain.exponentialRampToValueAtTime(.0001,ctx.currentTime+profile.duration);
    master.connect(compressor);compressor.connect(ctx.destination);
    profile.notes.forEach(note=>{
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      const start=ctx.currentTime+note.t;
      osc.type=note.type;osc.frequency.setValueAtTime(note.f,start);
      gain.gain.setValueAtTime(.0001,start);
      gain.gain.exponentialRampToValueAtTime(Math.max(.0002,Math.min(.85,(note.gain||.12)*2.2)),start+.008);
      gain.gain.exponentialRampToValueAtTime(.0001,start+note.d);
      osc.connect(gain);gain.connect(master);osc.start(start);osc.stop(start+note.d+.02);
    });
    setTimeout(()=>ctx.close?.(),Math.ceil((profile.duration+.25)*1000));
  }catch{}
}
function showCreditPopup(amount,{preview=false}={}){
  const value=Math.max(0,Math.round(Number(amount)||0));
  if(!preview && (!S.settings.creditPopupEnabled || value<S.settings.creditPopupMinimum))return;
  const box=creditPopupContainer();
  const item=document.createElement("article");
  const animation=S.settings.creditPopupAnimation||"slide";
  const duration=Math.max(2000,Number(S.settings.creditPopupDuration)||5000);
  const visibleDuration=preview?Math.min(duration,3500):duration;
  item.className=`lss7-credit-popup theme-${creditPopupTheme()} popup-${S.settings.creditPopupSize||"medium"} anim-${animation}`;
  item.innerHTML=`
    <span class="credit-popup-rail" aria-hidden="true"></span>
    <span class="credit-popup-icon" aria-hidden="true"><i>¢</i><em>+</em></span>
    <span class="credit-popup-content">
      <span class="credit-popup-head"><small>${preview?"Popup-Vorschau":"Credit-Eingang"}</small><span class="credit-popup-live"><i></i>${preview?"TEST":"GEBUCHT"}</span></span>
      <strong class="credit-popup-amount"><b>+</b>${escHtml(fmt(value))}<small>Credits</small></strong>
      <span class="credit-popup-details"><span><i>Tagesstand</i><b>${escHtml(fmtMoney(Math.max(0,Number(S.dailyEarn)||0)))}</b></span><span><i>Zeit</i><b>${escHtml(new Date().toLocaleTimeString(uiLocale(),{hour:"2-digit",minute:"2-digit"}))}</b></span></span>
    </span>
    <span class="credit-popup-spark" aria-hidden="true">✦</span>
    <span class="credit-popup-progress" aria-hidden="true" style="--credit-duration:${visibleDuration}ms"></span>`;
  box.prepend(item);
  while(box.children.length>4)box.lastElementChild?.remove();
  requestAnimationFrame(()=>item.classList.add("show"));
  if(S.settings.creditPopupSound)playCreditSound();
  setTimeout(()=>{
    item.classList.add("leaving");
    item.classList.remove("show");
    setTimeout(()=>item.remove(),650);
  },visibleDuration);
}
function handleCreditBalance(value){
  const current=Math.max(0,Math.round(Number(value)||0));
  if(!current)return;
  if(!creditBalanceReady){
    lastCreditBalance=current;
    creditBalanceReady=true;
    return;
  }
  if(current===lastCreditBalance)return;
  const delta=current-lastCreditBalance;
  lastCreditBalance=current;
  if(delta>0){
    S.dailyEarn=Math.max(0,Number(S.dailyEarn)||0)+delta;
    setV("#qs-daily",fmtMoney(S.dailyEarn));
    save();
    showCreditPopup(delta);
  }
}
function installCreditPopupObserver(){
  const bind=()=>{
    const node=document.querySelector("#navigation_top .credits-value");
    if(!node)return false;
    handleCreditBalance(parseCreditsValue(node.textContent));
    creditObserver?.disconnect();
    creditObserver=new MutationObserver(()=>{
      clearTimeout(creditObserverTimer);
      creditObserverTimer=setTimeout(()=>{
        const value=readOwnCreditsFromNavbar();
        if(value!==null){
          handleCreditBalance(value);
          S.userCredits=value;
          setV("#qs-credits",fmtMoney(value));
        }
      },180);
    });
    creditObserver.observe(node,{subtree:true,childList:true,characterData:true});
    return true;
  };
  if(!bind()){
    let attempts=0;
    const timer=setInterval(()=>{attempts++;if(bind()||attempts>80)clearInterval(timer);},500);
  }
  clearInterval(creditPollTimer);
  creditPollTimer=setInterval(()=>{
    const value=readOwnCreditsFromNavbar();
    if(value!==null)handleCreditBalance(value);
  },2000);
}
function diagnosticsSave(){
  try{GM_setValue("v7_diag",JSON.stringify(S.diagnostics));}catch{}
}
function diagnosticsErrorInfo(err){
  if(err instanceof Error)return {name:err.name||"Error",message:String(err.message||""),stack:String(err.stack||"").slice(0,3000)};
  let objectMessage="";
  if(err&&typeof err==="object"){
    try{objectMessage=JSON.stringify(err).slice(0,700);}catch{objectMessage=String(err);}
  }
  if(err&&typeof err==="object")return {
    name:String(err.name||err.type||"Error"),
    message:String(err.message||err.reason||objectMessage),
    stack:String(err.stack||"").slice(0,3000)
  };
  return {name:"Error",message:String(err||"Unbekannter Fehler"),stack:""};
}
function recordDiagnosticError(source,err,extra={}){
  const info=diagnosticsErrorInfo(err);
  S.diagnostics.errors=[
    {ts:Date.now(),time:new Date().toISOString(),source:String(source||"script"),...info,extra},
    ...(Array.isArray(S.diagnostics.errors)?S.diagnostics.errors:[])
  ].slice(0,40);
  diagnosticsSave();
  updateDiagnosticStatus();
}
function installDiagnosticsHooks(){
  if(installDiagnosticsHooks.done)return;
  installDiagnosticsHooks.done=true;
  window.addEventListener("error",event=>{
    recordDiagnosticError("window.error",event.error||event.message,{filename:event.filename||"",line:event.lineno||0,column:event.colno||0});
  });
  window.addEventListener("unhandledrejection",event=>{
    recordDiagnosticError("unhandledrejection",event.reason||"Promise rejected");
  });
}
function diagnosticCount(value){
  if(Array.isArray(value))return value.length;
  if(value&&typeof value==="object")return Object.keys(value).length;
  return Number(value)||0;
}
function diagnosticModelSnapshot(){
  const out={};
  try{
    const m=allianceForecastModel();
    out.allianceForecast={quality:m.qualityText,avg:m.avg,days:m.days,remaining:m.remaining,total7:m.total7,estimatedCount:m.estimatedCount};
  }catch(e){out.allianceForecastError=diagnosticsErrorInfo(e);}
  try{
    const p=playerForecastModel();
    out.playerForecast={rank:p.level?.rank||"",next:p.next?.rank||"",current:p.current,remaining:p.remaining,average:p.average,days:p.days,quality:p.qualityText,usedToday:p.usedToday};
  }catch(e){out.playerForecastError=diagnosticsErrorInfo(e);}
  return out;
}
function diagnosticStatusRank(status){
  return status==="error"?2:status==="warn"?1:0;
}
function diagnosticWorst(checks){
  return checks.reduce((worst,check)=>diagnosticStatusRank(check.status)>diagnosticStatusRank(worst)?check.status:worst,"ok");
}
function diagnosticCheck(status,title,message,details={}){
  return {status,title,message,details};
}
function runDiagnosticAnalysis(){
  const checks=[];
  const cache=S.dataCache||{};
  checks.push(diagnosticCheck("ok","Skript aktiv",`Version ${V} läuft im Browser.`,{version:V,manager:GM_info?.scriptHandler||""}));
  checks.push(diagnosticCheck(GAME_HOSTS.has(location.hostname)?"ok":"error","Spielseite",GAME_HOSTS.has(location.hostname)?"Unterstützte Leitstellenspiel-Domain erkannt.":"Diese Domain wird vom Skript nicht unterstützt.",{host:location.hostname,path:location.pathname}));
  checks.push(diagnosticCheck($("#lss7").length?"ok":"error","Dashboard-Oberfläche",$("#lss7").length?"Dashboard wurde im DOM gefunden.":"Dashboard-Container wurde nicht gefunden.",{panel:$("#lss7").length}));

  const allianceAge=S.lastApiTs?Date.now()-Number(S.lastApiTs):null;
  checks.push(diagnosticCheck(S.allianceId&&S.allianceName?"ok":S.lastApiTs?"warn":"error","Verbandsdaten",S.allianceId&&S.allianceName?`Verband erkannt: ${S.allianceName}.`:S.lastApiTs?"API wurde geladen, aber Verbands-ID oder Name fehlen.":"Verbandsdaten wurden noch nicht geladen.",{id:S.allianceId,name:S.allianceName,lastApiTs:S.lastApiTs,ageMs:allianceAge}));
  const playerKnown=!!(S.userId || (S.profile?.name&&S.profile.name!=="-") || Number(S.userCredits)>0 || Number(S.profile?.totalCredits)>0);
  checks.push(diagnosticCheck(playerKnown?"ok":"warn","Spielerdaten",S.userId?`Spieler-ID erkannt: ${S.userId}.`:"Spieler über Profilname oder Credits erkannt; ID wird beim nächsten Profilabruf nachgezogen.",{userId:S.userId,profileName:S.profile?.name,credits:S.userCredits||S.profile?.totalCredits}));

  const vehicleListCount=diagnosticCount(cache.vehicleList);
  const stateCount=diagnosticCount(cache.vehicles);
  checks.push(diagnosticCheck(vehicleListCount>0||stateCount>0?"ok":"warn","Fuhrparkdaten",vehicleListCount>0?`${fmt(vehicleListCount)} Fahrzeuge geladen.`:stateCount>0?`Statusverteilung vorhanden (${fmt(stateCount)} Statusgruppen); Fahrzeugliste wird bei Bedarf nachgeladen.`:"Noch keine Fuhrparkdaten im Cache.",{vehicleList:vehicleListCount,states:stateCount}));
  checks.push(diagnosticCheck(diagnosticCount(cache.buildings)>0?"ok":"warn","Gebäudedaten",diagnosticCount(cache.buildings)>0?`${fmt(diagnosticCount(cache.buildings))} Gebäude geladen.`:"Noch keine Gebäudedaten im Cache.",{buildings:diagnosticCount(cache.buildings)}));
  checks.push(diagnosticCheck(diagnosticCount(S.teamAdmin.users)>0?"ok":S.teamAdmin.error?"error":"warn","Mitgliederübersicht",diagnosticCount(S.teamAdmin.users)>0?`${fmt(diagnosticCount(S.teamAdmin.users))} Mitglieder im lokalen Überblick.`:(S.teamAdmin.error||"Mitgliederdaten wurden noch nicht geladen."),{users:diagnosticCount(S.teamAdmin.users),details:diagnosticCount(S.teamAdmin.details),error:S.teamAdmin.error}));

  let allianceForecastStatus="ok",allianceForecastMsg="Verbandsprognose berechnet.";
  try{
    const m=allianceForecastModel();
    if(!m.avg) {allianceForecastStatus="warn"; allianceForecastMsg="Verbandsprognose hat noch zu wenige Tageswerte.";}
    else allianceForecastMsg=`Verbandsprognose aktiv: ${m.qualityText}, Ø ${fmtMoney(m.avg)}.`;
    checks.push(diagnosticCheck(allianceForecastStatus,"Verbandsprognose",allianceForecastMsg,{quality:m.qualityText,avg:m.avg,days:m.days}));
  }catch(e){checks.push(diagnosticCheck("error","Verbandsprognose","Berechnung ist fehlgeschlagen.",diagnosticsErrorInfo(e)));}

  try{
    const p=playerForecastModel();
    const ok=p.current>0&&p.remaining>=0;
    const hasPace=p.average>0;
    checks.push(diagnosticCheck(ok&&hasPace?"ok":ok?"warn":"error","Spielerprognose",ok?(hasPace?`Spielerprognose aktiv: Ø ${fmtMoney(p.average)}.`:"Spielerprognose erkennt Rang/Restwert, aber noch keinen Tagesdurchschnitt."):"Spielerprognose hat keine verwertbaren Credits.",{current:p.current,remaining:p.remaining,average:p.average,quality:p.qualityText}));
  }catch(e){checks.push(diagnosticCheck("error","Spielerprognose","Berechnung ist fehlgeschlagen.",diagnosticsErrorInfo(e)));}

  if(S.settings.weatherMode==="off")checks.push(diagnosticCheck("ok","Wettermodul","Wetter ist deaktiviert.",{mode:S.settings.weatherMode}));
  else checks.push(diagnosticCheck(S.weather?.error?"warn":S.weather?"ok":"warn","Wettermodul",S.weather?.error||($(".weather-mini").length?"Wetteranzeige vorbereitet.":"Wetterdaten noch nicht geladen."),{mode:S.settings.weatherMode,location:S.settings.weatherLocation,error:S.weather?.error||""}));
  const activeEvents=activeGameEvents();
  checks.push(diagnosticCheck("ok","Leitstellenspiel-Events",activeEvents.length?`${fmt(activeEvents.length)} aktive Events erkannt.`:"Event-Erkennung bereit; aktuell kein Event sichtbar.",{events:diagnosticCount(activeEvents)}));

  const errCount=Array.isArray(S.diagnostics.errors)?S.diagnostics.errors.length:0;
  checks.push(diagnosticCheck(errCount?"warn":"ok","Gespeicherte Skriptfehler",errCount?`${fmt(errCount)} Fehler/Warnungen gespeichert.`:"Keine gespeicherten Skriptfehler.",{errors:errCount,last:S.diagnostics.errors?.[0]||null}));

  const summary=diagnosticWorst(checks);
  const result={ts:Date.now(),time:new Date().toISOString(),summary,checks};
  S.diagnostics.lastAnalysis=result;
  diagnosticsSave();
  renderDiagnosticResults(result);
  updateDiagnosticStatus();
  notify(summary==="error"?"Analyse abgeschlossen: Fehler gefunden.":summary==="warn"?"Analyse abgeschlossen: Hinweise gefunden.":"Analyse abgeschlossen: Systeme laufen.");
  return result;
}
function renderDiagnosticResults(result=S.diagnostics.lastAnalysis){
  const root=$("#sb-diagnostics-results");
  if(!root.length)return;
  if(!result?.checks?.length){
    root.html(`<div class="diagnostics-result warn"><i>!</i><div><b>Noch keine Analyse ausgeführt</b><span>Klicke auf „Analyse ausführen“, um die wichtigsten Systeme zu prüfen.</span></div><small>bereit</small></div>`);
    return;
  }
  const icon={ok:"✓",warn:"!",error:"x"};
  const label={ok:"OK",warn:"Hinweis",error:"Fehler"};
  root.html(result.checks.map(check=>`<div class="diagnostics-result ${escHtml(check.status)}"><i>${escHtml(icon[check.status]||"?")}</i><div><b>${escHtml(check.title)}</b><span>${escHtml(check.message)}</span></div><small>${escHtml(label[check.status]||check.status)}</small></div>`).join(""));
}
function privacyHash(value){
  const s=String(value||"");
  let h=2166136261;
  for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}
  return Math.abs(h>>>0).toString(36);
}
function redactUrl(value){
  try{
    const u=new URL(String(value||""),location.href);
    return `${u.origin}${u.pathname}`;
  }catch{return String(value||"").split("?")[0].slice(0,SECURITY.maxDiagnosticString);}
}
function redactText(value){
  const s=String(value??"");
  if(!s)return s;
  return s
    .replace(/https?:\/\/[^\s"'<>]+/gi,m=>redactUrl(m))
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,"[email]")
    .slice(0,SECURITY.maxDiagnosticString);
}
function sanitizeDiagnosticExport(value,depth=0){
  if(depth>5)return "[gekürzt]";
  if(value===null||value===undefined)return value;
  if(typeof value==="string")return redactText(value);
  if(typeof value==="number"||typeof value==="boolean")return value;
  if(Array.isArray(value))return value.slice(0,40).map(v=>sanitizeDiagnosticExport(v,depth+1));
  if(typeof value==="object"){
    const out={};
    Object.entries(value).slice(0,80).forEach(([key,val])=>{
      const k=String(key);
      if(/cookie|token|password|secret|auth|csrf/i.test(k)){out[k]="[entfernt]";return;}
      if(/name/i.test(k)&&typeof val==="string"){out[k]=`[redacted:${privacyHash(val)}]`;return;}
      if(/href|url/i.test(k)&&typeof val==="string"){out[k]=redactUrl(val);return;}
      out[k]=sanitizeDiagnosticExport(val,depth+1);
    });
    return out;
  }
  return String(value).slice(0,SECURITY.maxDiagnosticString);
}
function buildDiagnosticReport(userNote=""){
  const analysis=S.diagnostics.lastAnalysis||runDiagnosticAnalysis();
  const cache=S.dataCache||{};
  const diagnostics={
    generatedAt:new Date().toISOString(),
    script:{name:"LSS Verband Statistik Pro",version:V,manager:GM_info?.scriptHandler||"",managerVersion:GM_info?.version||""},
    page:{href:redactUrl(location.href),host:location.host,path:location.pathname,visible:document.visibilityState},
    browser:{userAgent:navigator.userAgent,language:navigator.language,platform:navigator.platform,cookies:"[nicht exportiert]"},
    userNote:redactText(String(userNote||"").slice(0,2500)),
    state:{
      alliance:{id:S.allianceId?`[id:${privacyHash(S.allianceId)}]`:"",name:S.allianceName?`[redacted:${privacyHash(S.allianceName)}]`:"",rank:S.allianceRank,credits:S.allianceCredits,lastApiTs:S.lastApiTs},
      player:{id:S.userId?`[id:${privacyHash(S.userId)}]`:"",name:S.profile?.name?`[redacted:${privacyHash(S.profile.name)}]`:"",rank:S.profile?.rank,progress:S.profile?.progressText,credits:S.profile?.totalCredits||S.userCredits,dailyEarn:S.dailyEarn},
      weather:{enabled:S.settings.weatherMode,location:S.settings.weatherLocation,country:S.settings.weatherCountry,error:S.weather?.error||"",cacheAgeMs:S.weatherTs?Date.now()-S.weatherTs:null},
      events:{active:diagnosticCount(activeGameEvents()),raw:diagnosticCount(S.gameEvents)},
      team:{loaded:diagnosticCount(S.teamAdmin.users),details:diagnosticCount(S.teamAdmin.details),detailsByName:diagnosticCount(S.teamAdmin.detailsByName),error:S.teamAdmin.error,lastTs:S.teamAdmin.lastTs},
      activity:{
        date:S.allianceActivity?.date||"",
        missions:Number(S.allianceActivity?.missions)||0,
        patients:Number(S.allianceActivity?.patients)||0,
        prisoners:Number(S.allianceActivity?.prisoners)||0,
        seenCount:Array.isArray(S.allianceActivity?.seen)?S.allianceActivity.seen.length:0
      },
      update:S.update
    },
    settings:sanitizeDiagnosticExport({...S.settings}),
    cache:{
      vehicleList:diagnosticCount(cache.vehicleList),
      vehicleStates:diagnosticCount(cache.vehicles),
      buildings:diagnosticCount(cache.buildings),
      schoolings:diagnosticCount(cache.schoolings),
      aaos:diagnosticCount(cache.aaos),
      aaoCategories:diagnosticCount(cache.aaoCategories),
      pois:diagnosticCount(cache.pois),
      missionTypes:cache.missionTypes?diagnosticCount(cache.missionTypes):0,
      missions:diagnosticCount(cache.missions),
      allianceEventTypes:diagnosticCount(cache.allianceEventTypes),
      lastMetaTs:cache.lastMetaTs
    },
    analysis:sanitizeDiagnosticExport(analysis),
    localData:{
      creditHist:diagnosticCount(S.creditHist),
      allianceDaily:S.allianceDaily,
      playerDaily:S.playerDaily,
      playerRanking:{rank:S.playerRanking?.rank,status:S.playerRanking?.status,rows:diagnosticCount(S.playerRanking?.rows),lastTs:S.playerRanking?.lastTs,loading:S.playerRanking?.loading},
      playerRankHistory:S.playerRankHistory
    },
    computed:diagnosticModelSnapshot(),
    recentErrors:sanitizeDiagnosticExport(Array.isArray(S.diagnostics.errors)?S.diagnostics.errors.slice(0,40):[])
  };
  return diagnostics;
}
function createDiagnosticReport(){
  if(!S.diagnostics.lastAnalysis)runDiagnosticAnalysis();
  const note=$("#sb-diagnostics-note").val()||"";
  const report=buildDiagnosticReport(note);
  S.diagnostics.created=(Number(S.diagnostics.created)||0)+1;
  S.diagnostics.lastReportTs=Date.now();
  diagnosticsSave();
  const stamp=new Date().toISOString().replace(/[:.]/g,"-");
  downloadTextFile(`lss-verband-statistik-support-analyse-${stamp}.json`,JSON.stringify(report,null,2),"application/json;charset=utf-8");
  notify("Supportdatei erstellt.");
  updateDiagnosticStatus();
}
function clearDiagnosticErrors(){
  S.diagnostics.errors=[];
  diagnosticsSave();
  updateDiagnosticStatus();
  notify("Fehlerliste geleert.");
}
function updateDiagnosticStatus(){
  const box=$("#sb-diagnostics-status");
  renderDiagnosticResults();
  if(!box.length)return;
  const count=Array.isArray(S.diagnostics.errors)?S.diagnostics.errors.length:0;
  const last=count?new Date(S.diagnostics.errors[0].ts).toLocaleString(uiLocale()):"kein Fehler gespeichert";
  const analysis=S.diagnostics.lastAnalysis;
  const analysisText=analysis?` · letzte Analyse: ${analysis.summary==="error"?"Fehler":analysis.summary==="warn"?"Hinweise":"OK"} (${new Date(analysis.ts).toLocaleString(uiLocale())})`:"";
  box.html(`<strong>Diagnose bereit</strong><span>${fmt(count)} gespeicherte Skriptfehler · letzter Eintrag: ${escHtml(last)}${escHtml(analysisText)}</span>`);
}
function exportDashboardData(kind){
  const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,"-");
  let rows=[],headers=[],name=`lss-verband-${kind}-${stamp}.csv`;
  if(kind==="fleet"){
    const list=Array.isArray(S.dataCache.vehicleList)?S.dataCache.vehicleList:[];
    rows=list.length?list.map(v=>({
      id:v.id??"",name:v.caption||v.name||"",typ:v.vehicle_type_caption||v.vehicle_type||v.vehicle_type_id||"",
      building_id:v.building_id??"",fms:v.fms_real??v.fms??v.state??"",updated:v.updated_iso||""
    })):Object.entries(S.dataCache.vehicles||{}).map(([status,count])=>({status,label:VSTATUS[status]?.l||status,count}));
    headers=rows.length?Object.keys(rows[0]):["info"];
  }else if(kind==="buildings"){
    rows=(S.dataCache.buildings||[]).map(b=>({
      id:b.id??"",name:b.caption||b.name||"",typ:BUILDING_TYPES[Number(b.building_type)||0]||b.building_type,
      personal:b.personal_count??"",personal_soll:b.personal_count_target??"",level:b.level??"",
      aktiv:b.enabled!==false?"ja":"nein",eigene_einsaetze:b.generate_own_missions===true?"ja":"nein",
      leitstelle:b.leitstelle_building_id??"",updated:b.updated_iso||""
    }));
    headers=["id","name","typ","personal","personal_soll","level","aktiv","eigene_einsaetze","leitstelle","updated"];
  }else if(kind==="schoolings"){
    rows=(S.dataCache.schoolings||[]).map(s=>({lehrgang:s.caption||s.name||"",plaetze:s.freeSeats||"",kosten:s.cost||"",fertig:s.finish||"",anbieter:s.owner||"",url:s.url||""}));
    headers=["lehrgang","plaetze","kosten","fertig","anbieter","url"];
  }else if(kind==="aaos"){
    rows=(S.dataCache.aaos||[]).map(a=>({id:a.id??"",name:a.caption||a.name||"",kategorie:a.aao_category_id||a.category_id||"",hotkey:a.hotkey||"",farbe:a.color||""}));
    headers=["id","name","kategorie","hotkey","farbe"];
  }else if(kind==="team"){
    rows=Object.values(S.teamAdmin.users||{}).map(entry=>{
      const u=entry.user||{},details=S.teamAdmin.details[String(u.id)]||{},info=entry.info||allianceRoleInfo(u);
      return {id:u.id||"",name:u.name||"",rolle:(info.all||[info.primary]).map(r=>r.label).join(", "),dienstgrad:details.rank||"",spielerrang:details.toplistRank||"",credits:details.credits||"",online:teamActivityInfo(u,details).hint};
    });
    headers=["id","name","rolle","dienstgrad","spielerrang","credits","online"];
  }else if(kind==="history"){
    rows=(S.creditHist||[]).map(p=>({zeit:new Date(p.ts).toLocaleString("de-DE"),timestamp:p.ts,credits:p.v}));
    headers=["zeit","timestamp","credits"];
  }
  if(!rows.length){notify("Keine Exportdaten vorhanden.",true);return;}
  downloadTextFile(name,toCsv(rows,headers));
  notify(`Export erstellt: ${name}`);
}
function parseDeNum(str){
  if(!str) return null;
  const s=String(str).replace(/\s+/g,"").replace(/\./g,"").replace(",",".");
  const n=Number(s);
  return Number.isFinite(n) ? n : null;
}
function parseCreditsValue(str){
  if(!str) return null;
  const cleaned=String(str).replace(/[^\d.,-]/g,"");
  return parseDeNum(cleaned);
}
function readOwnCreditsFromNavbar(){
  const t=$("#navigation_top .credits-value").first().text().trim();
  return parseCreditsValue(t);
}
function readOwnCoinsFromNavbar(){
  const root=$("#coins_top .coins-value").first();
  if(!root.length) return null;
  const t=root.clone().children().remove().end().text().trim();
  return parseCreditsValue(t);
}
function readOwnProfileFromDom(){
  const name=(
    $("#navbar_profile_link .navbar-text").first().text().trim() ||
    $("#navbar_profile_link").first().text().trim() ||
    $(".navbar .dropdown-toggle .hidden-xs").first().text().trim() ||
    ""
  );
  const avatar=(
    $("#navbar_profile_link img").first().attr("src") ||
    $(".navbar img.avatar").first().attr("src") ||
    ""
  );
  return {name,avatar};
}
function readOwnUserIdFromDom(){
  const href=(
    $("#navbar_profile_link").first().attr("href") ||
    $("a[href*='/profile/']").filter((_,el)=>/profile/i.test(el.id||el.className||"")).first().attr("href") ||
    ""
  );
  const m=String(href||"").match(/\/profile\/(\d+)/);
  return m?Number(m[1]):null;
}
function readAllianceIdFromDom(){
  const links=[
    "#navbar-main-collapse a[href*='/alliances/']",
    "a[href*='/alliances/'][id*='alliance']",
    "#sv-alliname a[href*='/alliances/']"
  ];
  for(const sel of links){
    const href=$(sel).first().attr("href")||"";
    const m=href.match(/\/alliances\/(\d+)/);
    if(m) return Number(m[1]);
  }
  return null;
}
function readAllianceRankFromDom(){
  const txt=$("#sv-rank").first().text().trim();
  const n=parseInt((txt||"").replace(/[^\d]/g,""),10);
  return Number.isFinite(n)&&n>0?n:null;
}
function todayDeStr(){
  return new Date().toLocaleDateString("de-DE",{day:"2-digit",month:"2-digit",year:"numeric"});
}
function weatherCodeToText(code){
  const maps={
    de:{0:"Klar",1:"Heiter",2:"Wolkig",3:"Bedeckt",45:"Nebel",48:"Raureif",51:"Niesel",53:"Niesel",55:"Niesel",61:"Regen",63:"Regen",65:"Starkregen",71:"Schnee",73:"Schnee",75:"Starkschnee",80:"Schauer",81:"Schauer",82:"Starkschauer",95:"Gewitter"},
    en:{0:"Clear",1:"Mostly clear",2:"Cloudy",3:"Overcast",45:"Fog",48:"Rime fog",51:"Drizzle",53:"Drizzle",55:"Drizzle",61:"Rain",63:"Rain",65:"Heavy rain",71:"Snow",73:"Snow",75:"Heavy snow",80:"Showers",81:"Showers",82:"Heavy showers",95:"Thunderstorm"},
    fr:{0:"Dégagé",1:"Peu nuageux",2:"Nuageux",3:"Couvert",45:"Brouillard",48:"Brouillard givrant",51:"Bruine",53:"Bruine",55:"Bruine",61:"Pluie",63:"Pluie",65:"Forte pluie",71:"Neige",73:"Neige",75:"Forte neige",80:"Averses",81:"Averses",82:"Fortes averses",95:"Orage"}
  };
  return maps[S.settings.language]?.[code]||maps.de[code]||tr("Wetter");
}
function weatherCodeToIcon(code){
  if(code===0) return "☀️";
  if([1,2].includes(code)) return "🌤️";
  if(code===3) return "☁️";
  if([45,48].includes(code)) return "🌫️";
  if([51,53,55,61,63,65,80,81,82].includes(code)) return "🌧️";
  if([71,73,75].includes(code)) return "❄️";
  if([95].includes(code)) return "⛈️";
  return "🌡️";
}
function compactWeatherPlace(place){
  const parts=String(place||"").split(",").map(x=>x.trim()).filter(Boolean);
  if(parts.length>=2)return `${parts[0]}, ${parts[1]}`;
  return parts[0]||"-";
}
function playWeatherTone(kind){
  try{
    const C=window.AudioContext||window.webkitAudioContext;
    if(!C) return;
    const a=new C();
    const osc=a.createOscillator(), g=a.createGain();
    osc.connect(g); g.connect(a.destination);
    const now=a.currentTime;
    const tones={beep:[880],alarm:[660,880,660],chime:[523,659,784]};
    const seq=tones[kind]||tones.beep;
    let t=now;
    seq.forEach((f)=>{
      osc.frequency.setValueAtTime(f,t);
      g.gain.setValueAtTime(0.0001,t);
      g.gain.exponentialRampToValueAtTime(0.08,t+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001,t+0.18);
      t+=0.22;
    });
    osc.start(now); osc.stop(t+0.02);
  }catch{}
}
function computeWeatherAlert(current,hourly){
  const cCode=Number(current?.weather_code||0);
  const cWind=Number(current?.wind_speed_10m||0);
  const times=hourly?.time||[];
  const nowTs=new Date(current?.time||Date.now()).getTime();
  const found=times.findIndex(t=>new Date(t).getTime()>=nowTs);
  const start=found>=0?found:0;
  const hCodes=(hourly?.weather_code||[]).slice(start,start+6).map(Number);
  const hWind=(hourly?.wind_speed_10m||[]).slice(start,start+6).map(Number);
  const severeCode=[65,75,82,95].includes(cCode)||hCodes.some(x=>[65,75,82,95].includes(x));
  const severeWind=cWind>=60||hWind.some(x=>x>=60);
  if(severeCode || severeWind){
    return severeWind ? "⚠️ Warnung: starke Böen möglich" : "⚠️ Warnung: Unwetter-/Starkniederschlag möglich";
  }
  return "";
}
function normalizeTxt(s){
  return String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
}
function parseDwdWarningsPayload(txt){
  if(!txt) return null;
  const t=String(txt).trim();
  const start=t.indexOf("{");
  const end=t.lastIndexOf("}");
  if(start<0 || end<=start) return null;
  try{return JSON.parse(t.slice(start,end+1));}catch{return null;}
}
function mapWarnLevel(level){
  const n=Number(level)||0;
  if(n>=5) return 5;
  if(n===4) return 4;
  if(n===3) return 3;
  if(n===2 || n===1) return 2;
  return 0;
}
function fetchDwdWarning(ctx,cb){
  pageGet(API.dwdWarnings,rawTxt=>{
    const data=parseDwdWarningsPayload(rawTxt);
    const warnings=data?.warnings||{};
    const all=Object.values(warnings).flat().filter(Boolean);
    const base=[ctx.place,ctx.admin1,ctx.zip].filter(Boolean).map(normalizeTxt);
    const extra=base.flatMap(v=>v.split(/[,/ -]+/g).filter(x=>x.length>=4));
    const tokens=Array.from(new Set([...base,...extra]));
    const hit=all.filter(w=>{
      const rg=normalizeTxt(w.regionName||"");
      return tokens.some(t=>t && (rg.includes(t) || t.includes(rg)));
    }).sort((a,b)=>(Number(b.level)||0)-(Number(a.level)||0))[0];
    if(!hit){
      cb({level:0,title:"Keine Warnung",desc:"Aktuell liegt keine DWD-Warnung für den Ort vor.",src:"DWD"});
      return;
    }
    cb({
      level:mapWarnLevel(hit.level),
      title:hit.event || "Wetterwarnung",
      desc:hit.description || hit.instruction || "Keine Detailbeschreibung verfügbar.",
      src:"DWD"
    });
  },()=>{
    cb({level:0,title:"Keine Warnung",desc:"DWD-Warnungen derzeit nicht erreichbar.",src:"DWD"});
  });
}
function renderWeather(){
  const mode=S.settings.weatherMode||"off";
  const board=$("#weather-board");
  board.toggle(mode==="overview");
  const elSet=$("#wx-settings-view");
  const elOv=$("#wx-overview-view");
  if(!S.weather){
    const pending=(S.settings.weatherLocation||"").trim();
    const h=pending
      ? `<span class="w-l">${tr("Wetterdaten werden geladen...")}</span><span class="w-r">${escHtml(pending)}</span>`
      : `<span class="w-l">${tr("Keine Wetterdaten")}</span><span class="w-r">${tr("Ort fehlt")}</span>`;
    elSet.html(h);
    elOv.html(h);
    return;
  }
  if(S.weather.error){
    const h=`<span class="w-l">${S.weather.error}</span><span class="w-r">-</span>`;
    elSet.html(h);elOv.html(h);return;
  }
  const icon=weatherCodeToIcon(S.weather.code);
  const place=escHtml(compactWeatherPlace(S.weather.place));
  const desc=escHtml(weatherCodeToText(S.weather.code));
  const fc=(S.weather.forecast||[]).map(x=>`<span class="wx-chip"><b>${escHtml(x.t)}</b><span>${weatherCodeToIcon(x.c)} ${escHtml(x.temp)}°</span>${Number.isFinite(Number(x.rain))?`<em>Regen ${escHtml(x.rain)}%</em>`:""}</span>`).join("");
  const trend=(S.weather.dailyTrend||[]).map((day,index)=>{
    const dt=new Date(`${day.date}T12:00:00`);
    const label=index===0?tr("Heute"):dt.toLocaleDateString(uiLocale(),{weekday:"short"});
    return `<div class="wx-day" title="${escHtml(weatherCodeToText(day.code))}">
      <span class="wx-day-name">${escHtml(label)}</span><span class="wx-day-icon">${weatherCodeToIcon(day.code)}</span>
      <span class="wx-day-temp">${escHtml(day.max)}° / ${escHtml(day.min)}°</span>
      <span class="wx-day-meta"><span>💧 ${escHtml(day.rain)}%</span><span>↗ ${escHtml(day.wind)} km/h</span></span>
    </div>`;
  }).join("");
  const warn=S.weather.warn||{level:0,title:tr("Keine Warnung"),desc:tr("Aktuell liegt keine DWD-Warnung für den Ort vor."),src:"DWD"};
  const details=[
    [tr("Gefühlt"),`${S.weather.feels ?? "-"}°C`],
    [tr("Feuchte"),`${S.weather.humidity ?? "-"}%`],
    [tr("Niederschlag"),`${S.weather.precip ?? 0} mm`],
    [tr("Wind"),`${S.weather.wind} km/h`],
  ].map(([k,v])=>`<div class="wx-detail"><span class="wx-detail-k">${k}</span><span class="wx-detail-v">${escHtml(v)}</span></div>`).join("");
  const alert=`<div class="wx-warn lvl${warn.level}">
    <b>${escHtml(warn.title)}</b><br>${escHtml(warn.desc)}
  </div>`;
  const provider=escHtml(S.weather.provider||(S.weather.country==="DE"?"DWD ICON via Open-Meteo":"Open-Meteo Best Match"));
  const full=`<div class="wx-card">
    <div class="weather-head">
      <div class="wx-place">
        <span class="wx-icon">${icon}</span>
        <span class="wx-place-main"><span class="wx-city">${place}</span><span class="wx-desc">${desc}</span></span>
      </div>
      <div class="wx-now"><span class="wx-temp">${escHtml(S.weather.temp)}°C</span><span class="wx-wind">${tr("Wind")} ${escHtml(S.weather.wind)} km/h</span></div>
    </div>
    <div class="wx-forecast-block"><div class="wx-section-title">Nächste 7 Stunden<span>${provider}</span></div><div class="weather-forecast">${fc}</div></div>
    ${trend?`<div class="wx-trend-block"><div class="wx-section-title">7-Tage-Ausblick<span>Tageswerte: Min / Max</span></div><div class="wx-trend">${trend}</div></div>`:""}
    <div class="wx-details">${details}</div>
    ${alert}
    <div class="wx-src">${S.weather.country==="DE"?`Wetter: ${provider} · Warnungen: Deutscher Wetterdienst (DWD)`:`Wetter: ${provider}`}</div>
  </div>`;
  elSet.html(full);elOv.html(full);
  applyTranslations(elSet.get(0));applyTranslations(elOv.get(0));
}
function fetchWeather(){
  const loc=(S.settings.weatherLocation||"").trim();
  const country=WEATHER_COUNTRIES[S.settings.weatherCountry] ? S.settings.weatherCountry : "DE";
  const countryCfg=WEATHER_COUNTRIES[country];
  const locKey=`${country}|${loc}`;
  if(!loc){ S.weather=null; S.weatherLoc=""; renderWeather(); return; }
  if(S.weather && S.weatherLoc===locKey) renderWeather();
  const zipMatch=loc.match(countryCfg.zip);
  const cleanCity=loc.replace(countryCfg.zip,"").split(/[,(]/)[0].trim();
  const geoQueries=Array.from(new Set([loc,cleanCity,loc.split(",")[0].trim()].filter(Boolean)));
  const loadByLatLon=(lat,lon,place,admin1="",zip="")=>{
    const modelParam=country==="DE"?"&models=icon_seamless":"";
    const provider=country==="DE"?"DWD ICON via Open-Meteo":"Open-Meteo Best Match";
    const url=`${API.wxForecast}?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation_probability&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&forecast_days=7&forecast_hours=24&timezone=auto${modelParam}`;
    jsonGet(url,w=>{
      const c=w?.current||{};
      const h=w?.hourly||{};
      const hTimes=(h.time||[]);
      const hCodes=(h.weather_code||[]);
      const hTemps=(h.temperature_2m||[]);
      const hRain=(h.precipitation_probability||[]);
      const daily=w?.daily||{};
      const nowTs=new Date(c.time||Date.now()).getTime();
      const idx=hTimes.findIndex(t=>new Date(t).getTime()>=nowTs);
      const start=idx>=0?idx:0;
      const fc=hTimes.slice(start,start+7).map((t,i)=>({
        t:(new Date(t)).toLocaleTimeString(uiLocale(),{hour:"2-digit",minute:"2-digit"}),
        c:Number(hCodes[start+i]||0),
        temp:Math.round(Number(hTemps[start+i]||0)),
        rain:Math.round(Number(hRain[start+i]||0))
      }));
      const dailyTrend=(daily.time||[]).slice(0,7).map((date,i)=>({
        date,
        code:Number(daily.weather_code?.[i]||0),
        max:Math.round(Number(daily.temperature_2m_max?.[i]||0)),
        min:Math.round(Number(daily.temperature_2m_min?.[i]||0)),
        rain:Math.round(Number(daily.precipitation_probability_max?.[i]||0)),
        wind:Math.round(Number(daily.wind_speed_10m_max?.[i]||0))
      }));
      const alert=computeWeatherAlert(c,h);
      const alertKey=`${place}|${alert}|${zip}`;
      S.weather={
        place,
        temp: Math.round(Number(c.temperature_2m)||0),
        feels: Math.round(Number(c.apparent_temperature)||Number(c.temperature_2m)||0),
        humidity: Math.round(Number(c.relative_humidity_2m)||0),
        precip: Number(c.precipitation||0).toLocaleString(uiLocale(),{maximumFractionDigits:1}),
        wind: Math.round(Number(c.wind_speed_10m)||0),
        code: Number(c.weather_code)||0,
        forecast:fc,
        dailyTrend,
        alert,
        country,
        provider,
        warn:country==="DE"
          ? {level:0,title:"DWD wird geprüft",desc:"Warnungen werden im Hintergrund geladen.",src:"DWD"}
          : {level:alert?2:0,title:alert?"Lokaler Wetterhinweis":"Keine amtliche Warnung",desc:alert||tr("Amtliche Warnungen sind derzeit nur für Deutschland angebunden."),src:"Open-Meteo"}
      };
      S.weatherLoc=locKey;
      saveWeatherCache();
      renderWeather();
      if(alert && S.settings.weatherSound && S.weatherAlertKey!==alertKey){
        playWeatherTone(S.settings.weatherTone||"beep");
      }
      S.weatherAlertKey=alertKey;
      if(country!=="DE")return;
      fetchDwdWarning({place,admin1,zip},warn=>{
        S.weather.warn=warn;
        saveWeatherCache();
        if(warn.level>=2 && S.settings.weatherSound){
          const wk=`${place}|${warn.level}|${warn.title}`;
          if(S.weatherAlertKey!==wk){ playWeatherTone(S.settings.weatherTone||"beep"); S.weatherAlertKey=wk; }
        }
        renderWeather();
      });
    },()=>{
      if(!(S.weather && S.weatherLoc===locKey)) S.weather={error:"Wetterdaten konnten nicht geladen werden"};
      renderWeather();
    });
  };
  const lookupByName=(queries,idx=0)=>{
    const qRaw=queries[idx];
    if(!qRaw){ if(!(S.weather && S.weatherLoc===locKey)) S.weather={error:"Ort/PLZ nicht gefunden"}; renderWeather(); return; }
    const q=encodeURIComponent(qRaw);
    jsonGet(`${API.wxGeo}?name=${q}&count=5&language=${encodeURIComponent(S.settings.language||countryCfg.language)}&countryCode=${country}&format=json`,g=>{
      const results=(g?.results||[]).filter(p=>Number.isFinite(Number(p.latitude))&&Number.isFinite(Number(p.longitude)));
      const p=results[0];
      if(!p){ lookupByName(queries,idx+1); return; }
      const place=[p.name,p.admin1,p.country].filter(Boolean).join(", ");
      loadByLatLon(p.latitude,p.longitude,place,p.admin1,zipMatch?.[0]||"");
    },()=>lookupByName(queries,idx+1));
  };
  if(zipMatch){
    const zip=zipMatch[0];
    jsonGet(`${API.zipGeo}/${country.toLowerCase()}/${encodeURIComponent(zip)}`,z=>{
      const p=z?.places?.[0];
      if(!p){ lookupByName(geoQueries); return; }
      const lat=Number(p.latitude),lon=Number(p.longitude);
      if(!Number.isFinite(lat)||!Number.isFinite(lon)){ lookupByName(geoQueries); return; }
      const place=[p["place name"],p.state,z.country].filter(Boolean).join(", ");
      loadByLatLon(lat,lon,place,p.state,zip);
    },()=>{
      lookupByName(geoQueries);
    });
    return;
  }
  lookupByName(geoQueries);
}

function headerGameEventInfo(ev){
  const title=String(ev?.title||"Leitstellenspiel Event").replace(/\s+/g," ").trim();
  const type=`${ev?.type||""} ${title}`.toLowerCase();
  if(isSaleGameEvent(ev))return {label:"Coin Sale Aktiv",cls:"event-sale",href:`${BASE}/coins`};
  if(type.includes("credit")){
    const factor=title.match(/x\s*[\d,.]+/i)?.[0]?.replace(/\s+/g,"")||"";
    return {label:`Doppelt Credits${factor?` ${factor}`:""}`,cls:"event-credit"};
  }
  if(type.includes("coin")||type.includes("rabatt"))return {label:title,cls:"event-coin"};
  return {label:title,cls:"event-live"};
}
function headerEventButtonHtml(item){
  if(item.href)return `<a class="hd-event-badge ${item.cls}" href="${item.href}" target="_blank" rel="noopener">${escHtml(item.label)}</a>`;
  return `<button class="hd-event-badge ${item.cls}" type="button" data-open-event="1">${escHtml(item.label)}</button>`;
}
function renderEventHeader(){
  const liveEvents=activeGameEvents();
  const items=liveEvents.map(headerGameEventInfo);
  const eventHtml=items.map(headerEventButtonHtml).join("");
  $("#lss7-header-events").html(eventHtml).toggle(items.length>0);
  $("#lss7-nav-events").html(items.map(item=>`<span class="lss7-nav-event">${escHtml(item.label)}</span>`).join(""));
  applyNavButtonStyle();
}
function renderGameEvents(){
  const liveEvents=activeGameEvents();
  const has=liveEvents.length>0;
  const full=has?liveEvents.map(ev=>gameEventRowHtml(ev,false)).join(""):"";
  const mini=has?`<div class="game-events-mini">${liveEvents.map(ev=>gameEventRowHtml(ev,true)).join("")}</div>`:"";
  const prof=$("#lss-profile-events");
  if(prof.length){
    if(has){
      const keys=liveEvents.map(ev=>String(ev.key||ev.title||"event")).join("|");
      prof.removeClass("idle").addClass("active").removeAttr("title");
      if(prof.attr("data-event-keys")!==keys){
        prof.attr("data-event-keys",keys);
        prof.html(liveEvents.map(profileGameEventRowHtml).join(""));
      }else{
        updateProfileGameEventTimes(prof,liveEvents);
      }
    }else{
      prof.removeClass("active").addClass("idle").removeAttr("title");
      if(prof.attr("data-event-keys")!=="__idle"){
        prof.attr("data-event-keys","__idle");
        prof.html(profileGameEventIdleHtml());
      }
    }
  }
  $("#lss-game-events-card").toggle(has);
  $("#lss-game-events-list").html(full);
  $("#lss-live-events-overview").toggle(has).html(mini);
  renderEventHeader();
}
function renderEventOverview(){
  const box=$("#event-board");
  if(!box.length)return;
  const show=(S.settings.eventMode||"overview")==="overview";
  box.toggle(show);
  if(!show)return;
  renderGameEvents();
  const has=activeGameEvents().length>0;
  $("#event-overview-view").html(has?`<div class="event-note">Aktive Leitstellenspiel-Events werden automatisch aus der Spielnavigation erkannt und im Header angezeigt.</div>`:`<div class="lss7-empty">Aktuell ist kein Leitstellenspiel-Event aktiv.</div>`);
}
function renderEventPage(){
  renderGameEvents();
  const liveEvents=activeGameEvents();
  const list=liveEvents.length?liveEvents.map(ev=>gameEventRowHtml(ev,false)).join(""):`<div class="lss7-empty">Aktuell ist kein Leitstellenspiel-Event aktiv. Sobald ein Event in der Spielnavigation erscheint, wird es hier automatisch angezeigt.</div>`;
  $("#event-live-list").html(list);
  $("#event-live-count").text(fmt(liveEvents.length));
  $("#event-source").text(`Quelle: Leitstellenspiel-Navigation · aktualisiert ${new Date().toLocaleTimeString(uiLocale(),{hour:"2-digit",minute:"2-digit",second:"2-digit"})}`);
  renderEventOverview();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  TIMER / CLOCK                                               â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function normalizePlaytimeDaily(){
  const map=new Map();
  (Array.isArray(S.playtimeDaily)?S.playtimeDaily:[]).forEach(x=>{
    if(!x||!x.date)return;
    const date=String(x.date);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    const seconds=Math.max(0,Number(x.seconds)||0);
    const old=map.get(date);
    map.set(date,{date,seconds:Math.max(old?.seconds||0,seconds)});
  });
  S.playtimeDaily=Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  return S.playtimeDaily;
}
function recordPlaytimeDay(date,seconds){
  if(!date)return;
  const arr=normalizePlaytimeDaily();
  let row=arr.find(x=>x.date===date);
  const sec=Math.max(0,Math.floor(Number(seconds)||0));
  if(!row){row={date,seconds:sec};arr.push(row);}
  else row.seconds=Math.max(row.seconds||0,sec);
  S.playtimeDaily=arr.sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
}
function setPlaytimeDay(date,seconds){
  if(!date)return;
  const arr=normalizePlaytimeDaily();
  let row=arr.find(x=>x.date===date);
  const sec=Math.max(0,Math.floor(Number(seconds)||0));
  if(!row){row={date,seconds:sec};arr.push(row);}
  else row.seconds=sec;
  S.playtimeDaily=arr.sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
}
function resetTodayPlaytime(){
  rollPlaytimeDay(Date.now());
  S.playtime=0;
  S.lastTs=Date.now();
  setPlaytimeDay(todayStr(),0);
  save();
  updatePlaytimeUi();
}
function playtimeRows(){
  recordPlaytimeDay(todayStr(),S.playtime);
  return normalizePlaytimeDaily().slice(-7).map(x=>({
    date:x.date,label:dayLabel(x.date),seconds:Math.max(0,Number(x.seconds)||0)
  }));
}
function renderPlaytimeStats(){
  const pop=$("#playtime-pop");
  if(!pop.length)return;
  const rows=playtimeRows();
  const max=Math.max(...rows.map(r=>r.seconds),1);
  const total=rows.reduce((s,r)=>s+r.seconds,0);
  const body=rows.length?rows.map(r=>{
    const pct=Math.max(2,Math.round((r.seconds/max)*100));
    return `<div class="pt-row">
      <span class="pt-day">${escHtml(r.label)}</span>
      <span class="pt-bar"><span class="pt-fill" style="width:${pct}%"></span></span>
      <span class="pt-time">${fmtHHMM(r.seconds)}</span>
    </div>`;
  }).join(""):`<div class="alli-earn-empty">Noch keine Spielzeitdaten.</div>`;
  pop.html(`<div class="pt-pop-h"><span class="pt-pop-t">Spielzeit 7 Tage</span><span class="pt-pop-s">Summe ${fmtHHMM(total)}</span></div>${body}`);
}
function updatePlaytimeUi(){
  const on=S.settings.playtimeEnabled!==false;
  $("#lss7-qs").toggleClass("no-playtime",!on);
  $("#qs-playtime-cell,#qs-playtime-div").toggle(on);
  $("#lss7-playtime").text(fmtHHMM(S.playtime));
  renderPlaytimeStats();
}
function updateCoinsUi(){
  const on=S.settings.coins!==false;
  $("#lss7-qs").toggleClass("no-coins",!on);
  $("#qs-coins-cell").toggle(on);
  $("#qs-coins-div").toggle(on);
  if(on)setV("#qs-coins",fmt(S.userCoins));
}
function ensureAllianceActivityDay(){
  const today=localDateKey();
  if(S.allianceActivity?.date===today)return false;
  S.allianceActivity={date:today,missions:0,patients:0,prisoners:0,seen:[]};
  S.allianceActivityLive={};
  renderAllianceActivity();
  return true;
}
function renderAllianceActivity(){
  if(!S.allianceActivity)return;
}
let missionEarningsRenderTimer=null;
let missionEarningsSignature="";
function rebuildMissionMetaIndex(){
  const byId={};
  const byName={};
  (Array.isArray(S.dataCache.missions)?S.dataCache.missions:[]).forEach(m=>{
    const id=String(m?.id??"");
    const name=normalizeTxt(m?.name);
    if(id)byId[id]=m;
    if(name&&!byName[name])byName[name]=m;
  });
  S.dataCache.missionMetaById=byId;
  S.dataCache.missionMetaByName=byName;
}
function missionMetaById(typeId,caption=""){
  const id=String(typeId??"");
  return (id&&S.dataCache.missionMetaById?.[id])||
    (caption&&S.dataCache.missionMetaByName?.[normalizeTxt(caption)])||null;
}
function scheduleMissionEarningsRender(immediate=false){
  clearTimeout(missionEarningsRenderTimer);
  if(immediate)return renderMissionEarnings();
  missionEarningsRenderTimer=setTimeout(renderMissionEarnings,180);
}
function rememberCurrentMission(data={},render=true){
  const id=String(data.id||data.mission_id||"");
  if(!id)return;
  const old=S.currentMissions[id]||{};
  const next={
    ...old,...data,id,
    typeId:String(data.typeId??data.mission_type_id??data.mission_type??old.typeId??""),
    caption:String(data.caption??data.name??old.caption??"Einsatz"),
    allianceId:Number(data.allianceId??data.alliance_id??old.allianceId)||0,
    patients:Math.max(Number(old.patients)||0,Number(data.patients??data.patients_count)||0),
    prisoners:Math.max(Number(old.prisoners)||0,Number(data.prisoners??data.prisoners_count)||0),
    patientIds:old.patientIds||{},
    prisonerIds:old.prisonerIds||{},
    averageCredits:Math.max(0,Number(data.averageCredits??data.average_credits??data.credits??old.averageCredits)||0)
  };
  const changed=!old.id||["typeId","caption","allianceId","patients","prisoners","averageCredits","sourceDom"].some(key=>old[key]!==next[key]);
  if(changed)S.currentMissions[id]={...next,ts:Date.now()};
  if(render&&changed)scheduleMissionEarningsRender();
}
function updateCurrentMissionPerson(type,data={}){
  const id=String(data.missionId||data.mission_id||"");
  if(!id)return;
  const row=S.currentMissions[id]||{id,caption:"Einsatz",patients:0,prisoners:0,patientIds:{},prisonerIds:{},ts:Date.now()};
  const previousPatients=Number(row.patients)||0;
  const previousPrisoners=Number(row.prisoners)||0;
  const previousPersonCount=type==="patient"?Object.keys(row.patientIds||{}).length:Object.keys(row.prisonerIds||{}).length;
  const personId=String(data.id||"");
  if(type==="patient"){
    row.patientIds=row.patientIds||{};
    if(personId)row.patientIds[personId]=1;
    row.patients=Math.max(Number(row.patients)||0,Number(data.count)||0,Object.keys(row.patientIds).length);
  }else{
    row.prisonerIds=row.prisonerIds||{};
    if(personId)row.prisonerIds[personId]=1;
    row.prisoners=Math.max(Number(row.prisoners)||0,Number(data.count)||0,Object.keys(row.prisonerIds).length);
  }
  const currentPersonCount=type==="patient"?Object.keys(row.patientIds||{}).length:Object.keys(row.prisonerIds||{}).length;
  const changed=previousPatients!==(Number(row.patients)||0)||
    previousPrisoners!==(Number(row.prisoners)||0)||
    previousPersonCount!==currentPersonCount||
    !S.currentMissions[id];
  S.currentMissions[id]=row;
  if(changed)scheduleMissionEarningsRender();
}
function removeCurrentMission(id){
  const key=String(id||"");
  if(!S.currentMissions[key])return;
  delete S.currentMissions[key];
  scheduleMissionEarningsRender();
}
function scanCurrentMissionsFromDom(){
  const nodes=Array.from(document.querySelectorAll(".missionSideBarEntry[id^='mission_'],.missionSideBarEntry[data-mission-id]"));
  const missionArea=document.querySelector("#missions,#mission_list,#mission_panel,.missions-panel,.missionSideBar");
  if(!nodes.length&&!missionArea)return;
  const seen=new Set();
  let changed=false;
  nodes.forEach(node=>{
    const id=String(node.getAttribute("data-mission-id")||(node.id.match(/mission_(\d+)/)?.[1])||"");
    if(!id)return;
    seen.add(id);
    const caption=(
      node.querySelector(".panel-heading a,.mission-title,.missionSideBarEntryTitle")?.textContent||
      node.querySelector(".panel-heading")?.textContent||
      "Einsatz"
    ).replace(/\s+/g," ").trim();
    const typeId=node.getAttribute("data-mission-type-id")||node.getAttribute("data-mission-type")||node.dataset?.missionTypeId||"";
    const allianceId=Number(node.getAttribute("data-alliance-id")||node.dataset?.allianceId)||(/verband|alliance/i.test(node.className)?1:0);
    const old=S.currentMissions[id];
    rememberCurrentMission({id,caption,typeId,allianceId,sourceDom:true},false);
    if(old!==S.currentMissions[id])changed=true;
  });
  Object.entries(S.currentMissions).forEach(([id,row])=>{
    if(row?.sourceDom&&!seen.has(id)){delete S.currentMissions[id];changed=true;}
  });
  if(changed)scheduleMissionEarningsRender();
}
function missionEarningsModel(){
  const rows=Object.values(S.currentMissions||{}).map(m=>{
    const meta=missionMetaById(m.typeId,m.caption)||{};
    const base=Math.max(0,Number(m.averageCredits)||Number(meta.average_credits)||0);
    const currentPatients=Math.max(0,Number(m.patients)||0);
    const possiblePatients=Math.max(currentPatients,Number(meta?.additional?.possible_patient)||0);
    const transportChance=Math.max(0,Math.min(100,Number(meta?.chances?.patient_transport)||0));
    const patientCount=currentPatients||possiblePatients;
    const treatment=patientCount*250;
    const transport=Math.round(patientCount*(transportChance/100)*500);
    return {
      id:m.id,name:m.caption||meta.name||"Einsatz",alliance:!!m.allianceId,
      base,patients:patientCount,currentPatients,possiblePatients,transportChance,
      treatment,transport,total:base+treatment+transport
    };
  }).filter(row=>row.base>0||row.patients>0);
  return {
    rows,
    missions:rows.length,
    alliance:rows.filter(r=>r.alliance).length,
    patients:rows.reduce((s,r)=>s+r.patients,0),
    base:rows.reduce((s,r)=>s+r.base,0),
    treatment:rows.reduce((s,r)=>s+r.treatment,0),
    transport:rows.reduce((s,r)=>s+r.transport,0),
    total:rows.reduce((s,r)=>s+r.total,0)
  };
}
function renderMissionEarnings(){
  const totalEl=$("#mission-earn-total");
  if(!totalEl.length)return;
  const model=missionEarningsModel();
  const signature=[model.missions,model.alliance,model.patients,model.base,model.treatment,model.transport,model.total].join("|");
  const totalText=fmtMoney(model.total);
  const noteText=model.missions?`${fmt(model.missions)} offene Einsätze berücksichtigt`:"Noch keine offenen Einsätze erkannt";
  if(signature===missionEarningsSignature&&totalEl.text()===totalText&&$("#mission-earn-note").text()===noteText)return;
  missionEarningsSignature=signature;
  totalEl.text(totalText);
  $("#mission-earn-note").text(noteText);
}
function rememberAllianceMission(data={}){
  rememberCurrentMission({...data,sourceDom:false});
  const id=String(data.id||data.mission_id||"");
  const allianceId=Number(data.allianceId??data.alliance_id);
  if(!id||!Number.isFinite(allianceId)||allianceId<=0)return;
  const old=S.allianceActivityLive[id]||{patients:0,prisoners:0,patientIds:{},prisonerIds:{}};
  old.patients=Math.max(old.patients||0,Number(data.patients??data.patients_count)||0);
  old.prisoners=Math.max(old.prisoners||0,Number(data.prisoners??data.prisoners_count)||0);
  S.allianceActivityLive[id]=old;
}
function updateAllianceMissionPerson(type,data={}){
  updateCurrentMissionPerson(type,data);
  const id=String(data.missionId||data.mission_id||"");
  const row=S.allianceActivityLive[id];
  if(!row)return;
  const count=Math.max(0,Number(data.count)||0);
  const personId=String(data.id||"");
  if(type==="patient"){
    if(personId)row.patientIds[personId]=1;
    row.patients=Math.max(row.patients||0,count,Object.keys(row.patientIds).length);
  }else{
    if(personId)row.prisonerIds[personId]=1;
    row.prisoners=Math.max(row.prisoners||0,count,Object.keys(row.prisonerIds).length);
  }
}
function finishAllianceMission(id){
  removeCurrentMission(id);
  ensureAllianceActivityDay();
  const key=String(id||"");
  const row=S.allianceActivityLive[key];
  if(!key||!row)return;
  if(!S.allianceActivity.seen.includes(key)){
    S.allianceActivity.missions++;
    S.allianceActivity.patients+=Math.max(0,Number(row.patients)||0);
    S.allianceActivity.prisoners+=Math.max(0,Number(row.prisoners)||0);
    S.allianceActivity.seen.push(key);
    S.allianceActivity.seen=S.allianceActivity.seen.slice(-500);
  }
  delete S.allianceActivityLive[key];
  renderAllianceActivity();
  save();
}
function installAllianceActivityHooks(){
  const parseDetail=event=>{try{return JSON.parse(String(event.detail||"{}"));}catch{return {};}};
  window.addEventListener("lss7-mission-add",event=>rememberAllianceMission(parseDetail(event)));
  window.addEventListener("lss7-patient-add",event=>updateAllianceMissionPerson("patient",parseDetail(event)));
  window.addEventListener("lss7-prisoner-add",event=>updateAllianceMissionPerson("prisoner",parseDetail(event)));
  window.addEventListener("lss7-mission-delete",event=>finishAllianceMission(parseDetail(event).id));
  const script=document.createElement("script");
  script.textContent=`(()=>{if(window.__lss7AllianceActivityHooks)return;window.__lss7AllianceActivityHooks=true;
    const send=(name,data)=>window.dispatchEvent(new CustomEvent(name,{detail:JSON.stringify(data||{})}));
    const wrapped=new Set();
    const hook=(name,before)=>{const fn=window[name];if(typeof fn!=="function"||fn.__lss7ActivityWrapped)return false;
      const next=function(...args){try{before(...args)}catch(e){}return fn.apply(this,args)};
      Object.defineProperty(next,"__lss7ActivityWrapped",{value:true});window[name]=next;wrapped.add(name);return true};
    const bind=()=>{
      hook("missionMarkerAdd",m=>send("lss7-mission-add",{
        id:m?.id,allianceId:m?.alliance_id,typeId:m?.mission_type_id??m?.mission_type?.id??m?.mission_type,
        caption:m?.caption??m?.name??m?.mission_type?.caption,averageCredits:m?.average_credits??m?.credits,
        patients:m?.patients_count,prisoners:m?.prisoners_count
      }));
      hook("patientMarkerAdd",p=>send("lss7-patient-add",{id:p?.id,missionId:p?.mission_id,count:1}));
      hook("patientMarkerAddCombined",p=>send("lss7-patient-add",{missionId:p?.mission_id,count:p?.count}));
      hook("prisonerMarkerAdd",p=>send("lss7-prisoner-add",{id:p?.id,missionId:p?.mission_id,count:1}));
      hook("missionDelete",id=>send("lss7-mission-delete",{id}));
      return wrapped.has("missionMarkerAdd")&&wrapped.has("missionDelete")};
    if(!bind()){let tries=0;const timer=setInterval(()=>{tries++;if(bind()||tries>120)clearInterval(timer)},500)}
  })();`;
  (document.head||document.documentElement).appendChild(script);
  script.remove();
}
function rollPlaytimeDay(now=Date.now()){
  const today=localDateKey(new Date(now));
  if(today===S.lastDate)return false;
  if(S.lastDate)recordPlaytimeDay(S.lastDate,S.playtime);
  S.playtime=0;
  S.dailyEarn=0;
  S.lastDate=today;
  S.lastTs=now;
  setPlaytimeDay(today,0);
  ensureAllianceActivityDay();
  return true;
}
function tickTimer(){
  const now=Date.now();
  const changedDay=rollPlaytimeDay(now);
  const el=changedDay?0:Math.floor((now-S.lastTs)/1000);
  S.lastTs=now;
  if(el>0){
    const active=document.visibilityState==="visible" && S.settings.playtimeEnabled!==false;
    if(active){
      S.playtime+=Math.min(el,5);
      recordPlaytimeDay(todayStr(),S.playtime);
    }
  }
  if(changedDay){
    setV("#sv-alliance-daily",fmtMoney(0));
    setV("#qs-daily",fmtMoney(0));
  }
  updatePlaytimeUi();save();
}
function tickClock(){renderClock();}
function tickEventCountdown(){
  renderGameEvents();
}
function checkMidnight(){
  if(rollPlaytimeDay(Date.now())){
    save();
    updatePlaytimeUi();
    setV("#sv-alliance-daily",fmtMoney(0));
    setV("#qs-daily",fmtMoney(0));
  }
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  CREDIT HISTORY                                              â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function normalizeAllianceDaily(){
  const map=new Map();
  (Array.isArray(S.allianceDaily)?S.allianceDaily:[]).forEach(x=>{
    if(!x||!x.date)return;
    const date=String(x.date);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return;
    const start=Number.isFinite(Number(x.start))?Number(x.start):0;
    const end=Number.isFinite(Number(x.end))?Number(x.end):0;
    const earned=Number.isFinite(Number(x.earned))?Math.max(0,Number(x.earned)):Math.max(0,end-start);
    const old=map.get(date);
    if(old){
      if(start>0)old.start=old.start>0?Math.min(old.start,start):start;
      old.end=Math.max(old.end,end);
      old.earned=Math.max(old.earned||0,earned);
      old.estimated=!!(old.estimated||x.estimated);
    }else{
      map.set(date,{date,start,end,earned,estimated:!!x.estimated});
    }
  });
  S.allianceDaily=Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
  return S.allianceDaily;
}

function allianceDateSegments(fromTs,toTs){
  const start=Math.max(0,Number(fromTs)||0),end=Math.max(start,Number(toTs)||Date.now());
  if(!start || end<=start)return [{date:localDateKey(),ms:1}];
  const parts=[];
  let cursor=start,guard=0;
  while(cursor<end && guard<16){
    const d=new Date(cursor);
    const next=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1).getTime();
    const stop=Math.min(end,next);
    parts.push({date:localDateKey(d),ms:Math.max(1,stop-cursor)});
    cursor=stop;guard++;
  }
  if(cursor<end)parts.push({date:localDateKey(),ms:Math.max(1,end-cursor)});
  return parts;
}
function addAllianceEarn(date,amount,estimated=false,endCredits=0){
  const value=Math.max(0,Math.round(Number(amount)||0));
  const arr=normalizeAllianceDaily();
  let row=arr.find(x=>x.date===date);
  if(!row){row={date,start:0,end:0,earned:0,estimated:false};arr.push(row);}
  row.earned=Math.max(0,Number(row.earned)||0)+value;
  row.estimated=!!(row.estimated||estimated);
  if(endCredits>0){
    row.end=Math.max(Number(row.end)||0,endCredits);
    if(!(Number(row.start)>0))row.start=Math.max(0,endCredits-row.earned);
  }
  S.allianceDaily=arr.sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
}
function trackAllianceDailyCredits(total){
  const val=Number(total)||0;
  if(val<=0)return;
  const now=Date.now();
  const prev=S.allianceSnapshot;
  if(!prev || !(Number(prev.credits)>0) || !(Number(prev.ts)>0)){
    addAllianceEarn(localDateKey(),0,false,val);
    S.allianceSnapshot={credits:val,ts:now,date:localDateKey()};
    S.lastAlliCreds=val;
    return;
  }
  const before=Number(prev.credits)||0;
  const delta=val-before;
  if(delta>0){
    const segments=allianceDateSegments(prev.ts,now);
    const totalMs=segments.reduce((s,x)=>s+x.ms,0)||1;
    const estimated=segments.length>1 || now-Number(prev.ts)>900000;
    let assigned=0;
    segments.forEach((seg,i)=>{
      const share=i===segments.length-1?delta-assigned:Math.round(delta*(seg.ms/totalMs));
      assigned+=share;
      addAllianceEarn(seg.date,share,estimated,seg.date===localDateKey()?val:0);
    });
  }else{
    addAllianceEarn(localDateKey(),0,false,val);
  }
  S.allianceSnapshot={credits:val,ts:now,date:localDateKey()};
  S.lastAlliCreds=val;
}
function resetAllianceDailyCredits(){
  const current=Math.max(0,Number(S.allianceCredits)||Number(S.allianceSnapshot?.credits)||Number(S.lastAlliCreds)||0);
  S.allianceDaily=[];
  S.allianceSnapshot=current?{credits:current,ts:Date.now(),date:localDateKey()}:null;
  S.lastAlliCreds=current;
  save();
  renderAllianceDailyBoard();
  renderForecast();
}

function allianceDailyRows(limit=7){
  return normalizeAllianceDaily().slice(-Math.max(1,Number(limit)||7)).map(x=>({
    date:x.date,
    label:dayLabel(x.date),
    earn:Math.max(0,Number(x.earned)||((Number(x.end)||0)-(Number(x.start)||0))),
    estimated:!!x.estimated,
  }));
}

function allianceEarnToday(){
  const today=localDateKey();
  const row=normalizeAllianceDaily().find(x=>x.date===today);
  if(!row)return 0;
  return Math.max(0,Number(row.earned)||((Number(row.end)||0)-(Number(row.start)||0)));
}

function renderAllianceDailyBoard(){
  const list=$("#alliance-earn-list");
  setV("#sv-alliance-daily",fmtMoney(allianceEarnToday()));
  if(!list.length)return;
  const rows=allianceDailyRows();
  if(!rows.length){
    $("#alliance-earn-note").text("Startet ab jetzt");
    list.html(`<div class="alli-earn-empty">Noch keine Tagesdaten. Der erste Stand wird beim naechsten Refresh gespeichert.</div>`);
    return;
  }
  const max=Math.max(...rows.map(r=>r.earn),1);
  const sum=rows.reduce((s,r)=>s+r.earn,0);
  const avg=rows.length?Math.round(sum/rows.length):0;
  $("#alliance-earn-note").text(rows.length<7?`${rows.length}/7 Tage gesammelt`:`Ø ${fmtMoney(avg)}`);
  list.html(rows.map(r=>{
    const pct=r.earn>0?Math.max(10,Math.round((r.earn/max)*100)):100;
    const today=r.date===localDateKey();
    const fill=r.earn>0
      ? `width:${pct}%;display:block;height:100%;background:linear-gradient(90deg,#15803d,#22c55e,#86efac);`
      : `width:100%;display:block;height:100%;background:linear-gradient(90deg,rgba(96,165,250,.18),rgba(34,197,94,.10));`;
    return `<div class="alli-earn-row${today?" today":""}${r.earn>0?"":" zero"}">
      <span class="alli-earn-day" title="${r.estimated?"Geschätzter Offline-Anteil":"Gemessener Tageswert"}">${r.estimated?"~ ":""}${escHtml(r.label)}</span>
      <span class="alli-earn-bar"><span class="alli-earn-fill" style="${fill}"></span></span>
      <span class="alli-earn-val">${fmtMoney(r.earn)}</span>
    </div>`;
  }).join(""));
}

function robustDailyAverage(values){
  const vals=values.map(Number).filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);
  if(!vals.length)return 0;
  const trimmed=vals.length>=5?vals.slice(1,-1):vals;
  const avg=trimmed.reduce((s,x)=>s+x,0)/trimmed.length;
  const mid=Math.floor(vals.length/2);
  const median=vals.length%2?vals[mid]:(vals[mid-1]+vals[mid])/2;
  return Math.round((avg+median)/2);
}
function allianceForecastModel(){
  const current=Math.max(0,Number(S.allianceCredits)||Number(S.allianceSnapshot?.credits)||0);
  const target=Math.max(1,Number(S.settings.forecastTarget)||30000000000);
  const remaining=Math.max(0,target-current);
  const rows=allianceDailyRows(14);
  const today=localDateKey();
  const completed=rows.filter(r=>r.date!==today&&r.earn>0).slice(-7);
  let samples=completed.map(r=>r.earn);
  let usedToday=false;
  const todayRow=rows.find(r=>r.date===today);
  const elapsed=(Date.now()-new Date(new Date().setHours(0,0,0,0)).getTime())/86400000;
  const todayProjected=todayRow?.earn>0&&elapsed>=0.08?Math.round(todayRow.earn/Math.min(1,elapsed)):0;
  if(!samples.length){
    if(todayProjected>0){samples=[todayProjected];usedToday=true;}
  }
  const avg=robustDailyAverage(samples);
  const days=remaining===0?0:(avg>0?Math.ceil(remaining/avg):null);
  const predicted=days===null?null:new Date(Date.now()+days*86400000);
  let status="Noch zu wenig Daten",statusClass="warn";
  if(remaining===0){status="Meilenstein erreicht";statusClass="good";}
  else if(avg>0){status="Prognose aktiv";statusClass="good";}
  const progress=Math.max(0,Math.min(100,(current/target)*100));
  const estimatedCount=completed.filter(r=>r.estimated).length;
  const sampleCount=Math.min(samples.length,7);
  const qualityScore=Math.max(0,Math.min(100,Math.round((sampleCount/7)*100)));
  const qualityText=`${fmt(sampleCount)}/7 Tage`;
  const qualityDetail=`${qualityText}${estimatedCount?` · ${fmt(estimatedCount)} geschätzt`:""}${usedToday?" · heute hochgerechnet":""}`;
  const quality=samples.length>=7?"Starke lokale Datenbasis":samples.length>=3?"Solide Tendenz":"Frühe Schätzung";
  const sampleRows=completed.length?completed:(todayProjected?[{date:today,label:"Heute",earn:todayProjected,estimated:true}]:[]);
  const total7=completed.reduce((sum,row)=>sum+row.earn,0);
  const bestDay=sampleRows.length?[...sampleRows].sort((a,b)=>b.earn-a.earn)[0]:null;
  const weakDay=sampleRows.length?[...sampleRows].sort((a,b)=>a.earn-b.earn)[0]:null;
  const recent3=samples.slice(-3);
  const previous3=samples.slice(-6,-3);
  const avgRecent=recent3.length?Math.round(recent3.reduce((s,x)=>s+x,0)/recent3.length):0;
  const avgPrevious=previous3.length?Math.round(previous3.reduce((s,x)=>s+x,0)/previous3.length):0;
  const trendAbs=avgRecent&&avgPrevious?avgRecent-avgPrevious:0;
  const trendPct=avgRecent&&avgPrevious?Math.round((trendAbs/avgPrevious)*100):0;
  const trendLabel=!avgRecent||!avgPrevious?"Trend sammelt Daten":trendAbs>0?`+${fmtMoney(Math.abs(trendAbs))}/Tag`:trendAbs<0?`-${fmtMoney(Math.abs(trendAbs))}/Tag`:"Stabiles Tempo";
  const trendClass=trendAbs>0?"green":trendAbs<0?"red":"";
  const weeklyPace=avg?avg*7:0;
  const monthlyPace=avg?avg*30:0;
  const horizonDaily=days=>remaining>0?Math.ceil(remaining/days):0;
  return {current,target,remaining,rows,samples,avg,days,predicted,status,statusClass,progress,estimatedCount,quality,qualityScore,qualityText,qualityDetail,usedToday,todayEarn:todayRow?.earn||0,todayProjected,total7,bestDay,weakDay,avgRecent,avgPrevious,trendAbs,trendPct,trendLabel,trendClass,weeklyPace,monthlyPace,horizonDaily};
}
function formatForecastDate(d){
  return d?d.toLocaleDateString("de-DE",{weekday:"short",day:"2-digit",month:"2-digit",year:"numeric"}):"-";
}
function forecastDaysText(days){
  return days===null?"Noch offen":days===0?"Erreicht":`${fmt(days)} Tage`;
}
function forecastHorizonHtml(m){
  return [7,14,30].map(days=>`<div class="forecast-horizon-card"><span>Ziel in ${days} Tagen</span><b>${fmtMoney(m.horizonDaily(days))}/Tag</b></div>`).join("");
}
function forecastOverviewHtml(m){
  const eta=forecastDaysText(m.days);
  const predicted=m.predicted?formatForecastDate(m.predicted):"Sobald genügend Daten vorliegen";
  return `<div class="forecast-mini pro">
    <div class="forecast-beta"><b>LIVE</b><span>${escHtml(m.quality)} · ${escHtml(m.qualityText)} Datenbasis · ${m.usedToday?"heutiges Tempo hochgerechnet":"vollständige Tage bevorzugt"}</span></div>
    <div class="forecast-mini-card">
      <div class="forecast-mini-hero">
        <span class="forecast-mini-label">Voraussichtlich erreicht in</span>
        <strong class="forecast-mini-time">${escHtml(eta)}</strong>
        <span class="forecast-mini-date">${escHtml(predicted)}</span>
      </div>
      <div class="forecast-mini-data">
        <div class="forecast-mini-stat"><span>Aktueller Stand</span><b>${fmtMoney(m.current)}</b></div>
        <div class="forecast-mini-stat"><span>Ø Tagesverdienst</span><b class="green">${m.avg?fmtMoney(m.avg):"Wird ermittelt"}</b></div>
        <div class="forecast-mini-stat"><span>7 Tage Summe</span><b class="blue">${m.total7?fmtMoney(m.total7):"Sammelt Daten"}</b></div>
        <div class="forecast-mini-stat"><span>Noch benötigt</span><b class="amber">${fmtMoney(m.remaining)}</b></div>
        <div class="forecast-mini-stat"><span>Tempo/Woche</span><b>${m.weeklyPace?fmtMoney(m.weeklyPace):"-"}</b></div>
        <div class="forecast-mini-stat"><span>Trend</span><b class="${m.trendClass}">${escHtml(m.trendLabel)}</b></div>
      </div>
    </div>
    <div class="forecast-mini-progress"><span style="width:${m.progress.toFixed(2)}%"></span></div>
    <div class="forecast-mini-foot"><span>${m.progress.toFixed(2).replace(".",",")}% des Ziels erreicht</span><span>Datenbasis ${escHtml(m.qualityText)}</span></div>
  </div>`;
}
function forecastFullHtml(m){
  const eta=m.days===null?"Nicht berechenbar":m.days===0?"Bereits erreicht":`${fmt(m.days)} Tage`;
  const predicted=m.predicted?formatForecastDate(m.predicted):"Noch offen";
  const etaState=m.days===0?"reached":m.predicted?"active":"waiting";
  const note=`${m.quality}${m.estimatedCount?` · ${m.estimatedCount} geschätzte Offline-Tage`:""}${m.usedToday?" · heutiges Tempo hochgerechnet":""}`;
  return `<div class="forecast-wrap forecast-pro">
    <div class="forecast-beta"><b>LIVE-LAGE</b><span>Die Hochrechnung basiert auf den lokal gespeicherten Verbandsständen. Vollständige Tage zählen stärker als heutige Zwischenstände; Events, Offline-Zeiten und Aktivitätsspitzen können das Ergebnis verschieben.</span></div>
    <div class="forecast-head"><div><div class="forecast-title">Verbandsprognose</div><div class="forecast-sub">Der Meilenstein lässt sich oben oder in den Einstellungen ändern. Resttage und Erreichungsdatum werden automatisch berechnet.<br>${escHtml(note)}</div></div><span class="forecast-status ${m.statusClass}">${escHtml(m.status)}</span></div>
    <div class="forecast-target-hero ${etaState}">
      <div class="forecast-target-date">
        <span>Voraussichtliches Erreichungsdatum</span>
        <strong>${escHtml(predicted)}</strong>
        <b>${escHtml(eta)}</b>
      </div>
      <div class="forecast-target-summary">
        <span><small>Aktueller Stand</small><b>${fmtMoney(m.current)}</b></span>
        <span><small>Meilenstein</small><b>${fmtMoney(m.target)}</b></span>
        <span><small>Noch benötigt</small><b>${fmtMoney(m.remaining)}</b></span>
        <span><small>Ø pro Tag</small><b>${m.avg?fmtMoney(m.avg):"Wird ermittelt"}</b></span>
      </div>
    </div>
    <div class="forecast-kpis">
      <div class="forecast-kpi"><span class="forecast-k">7 Tage Summe</span><span class="forecast-v blue">${m.total7?fmtMoney(m.total7):"-"}</span><small>letzte vollständige Tage</small></div>
      <div class="forecast-kpi"><span class="forecast-k">Tempo/Woche</span><span class="forecast-v green">${m.weeklyPace?fmtMoney(m.weeklyPace):"-"}</span><small>bei aktuellem Durchschnitt</small></div>
      <div class="forecast-kpi"><span class="forecast-k">Tempo/30 Tage</span><span class="forecast-v blue">${m.monthlyPace?fmtMoney(m.monthlyPace):"-"}</span><small>theoretische Monatsleistung</small></div>
      <div class="forecast-kpi"><span class="forecast-k">Trendtempo</span><span class="forecast-v ${m.trendClass}">${escHtml(m.trendLabel)}</span><small>${m.trendPct?`${m.trendPct>0?"+":""}${fmt(m.trendPct)}% gegenüber vorher`: "noch keine Vergleichsbasis"}</small></div>
      <div class="forecast-kpi"><span class="forecast-k">Datenbasis</span><span class="forecast-v">${escHtml(m.qualityText)}</span><small>${escHtml(m.qualityDetail)}</small></div>
    </div>
    <div><div class="forecast-progress"><div class="forecast-progress-fill" style="width:${m.progress.toFixed(2)}%"></div></div><div class="forecast-progress-meta"><span>${m.progress.toFixed(2).replace(".",",")}% erreicht</span><span>${fmtMoney(m.remaining)} verbleibend</span></div><div class="forecast-color-legend"><span class="l-blue"><i></i>Fortschritt</span><span class="l-green"><i></i>Zieltempo gut</span><span class="l-amber"><i></i>Hinweis / prüfen</span></div></div>
    <div class="forecast-details">
      <div class="forecast-panel">
        <div class="forecast-panel-title">Zieltempo<span>benötigter Tagesverdienst</span></div>
        <div class="forecast-horizon">${forecastHorizonHtml(m)}</div>
      </div>
      <div class="forecast-panel">
        <div class="forecast-panel-title">Datenlage<span>lokal gemessen</span></div>
        <div class="forecast-insights">
          <div class="forecast-insight"><span>Bester Tag</span><b>${m.bestDay?`${escHtml(m.bestDay.label)} · ${fmtMoney(m.bestDay.earn)}`:"-"}</b></div>
          <div class="forecast-insight"><span>Schwächster Tag</span><b>${m.weakDay?`${escHtml(m.weakDay.label)} · ${fmtMoney(m.weakDay.earn)}`:"-"}</b></div>
          <div class="forecast-insight"><span>Heutiger Stand</span><b>${m.todayEarn?fmtMoney(m.todayEarn):"-"}${m.todayProjected?` / ~${fmtMoney(m.todayProjected)}`:""}</b></div>
          <div class="forecast-quality" title="${escHtml(m.qualityDetail)}"><span style="width:${m.qualityScore}%"></span></div>
        </div>
      </div>
    </div>
    <div class="forecast-chart-box"><div class="forecast-chart-head"><span>Credit-Verlauf und Hochrechnung</span><span>Ist / Prognose / Ziel</span></div><canvas id="forecast-chart-full" class="forecast-canvas"></canvas></div>
  </div>`;
}
function drawForecastChart(id,m){
  const canvas=document.getElementById(id);if(!canvas)return;
  const W=canvas.offsetWidth||700,H=canvas.offsetHeight||150,dpr=Math.min(2,window.devicePixelRatio||1);
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
  const p={l:12,r:12,t:12,b:22},cw=W-p.l-p.r,ch=H-p.t-p.b;
  const rows=m.rows.filter(r=>r.earn>0);
  const totalEarn=rows.reduce((s,r)=>s+r.earn,0);
  let cumulative=Math.max(0,m.current-totalEarn);
  const actual=[cumulative];rows.forEach(r=>{cumulative+=r.earn;actual.push(cumulative);});
  const min=Math.min(...actual,m.current),max=Math.max(m.target,m.current,min+1),range=max-min||1;
  const xActual=i=>p.l+(cw*.68)*(actual.length<=1?1:i/(actual.length-1));
  const y=v=>p.t+ch-((v-min)/range)*ch;
  ctx.strokeStyle="rgba(255,255,255,.07)";ctx.lineWidth=1;
  for(let i=0;i<4;i++){const gy=p.t+(ch/3)*i;ctx.beginPath();ctx.moveTo(p.l,gy);ctx.lineTo(W-p.r,gy);ctx.stroke();}
  ctx.strokeStyle="#60a5fa";ctx.lineWidth=2;ctx.beginPath();actual.forEach((v,i)=>{const x=xActual(i),yy=y(v);i?ctx.lineTo(x,yy):ctx.moveTo(x,yy);});ctx.stroke();
  ctx.fillStyle="#60a5fa";actual.forEach((v,i)=>{ctx.beginPath();ctx.arc(xActual(i),y(v),2.5,0,Math.PI*2);ctx.fill();});
  if(m.avg>0 && m.remaining>0){ctx.save();ctx.setLineDash([6,5]);ctx.strokeStyle="#fbbf24";ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(xActual(actual.length-1),y(m.current));ctx.lineTo(W-p.r,y(m.target));ctx.stroke();ctx.restore();}
  ctx.strokeStyle="rgba(134,239,172,.75)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(p.l,y(m.target));ctx.lineTo(W-p.r,y(m.target));ctx.stroke();
  ctx.font="9px Inter,sans-serif";ctx.fillStyle="rgba(216,225,236,.65)";ctx.textAlign="left";ctx.fillText("Ist",p.l,H-6);ctx.fillStyle="#fbbf24";ctx.textAlign="center";ctx.fillText("Prognose",W*.78,H-6);ctx.fillStyle="#86efac";ctx.textAlign="right";ctx.fillText("Ziel",W-p.r,H-6);
}
function updateOverviewForecastSummary(m){
  if(!$("#overview-forecast-eta").length)return;
  const eta=forecastDaysText(m.days);
  const date=m.predicted?formatForecastDate(m.predicted):m.days===0?"Bereits erreicht":"Noch nicht berechenbar";
  $("#overview-forecast-eta").text(eta);
  $("#overview-forecast-date").text(date);
  $("#overview-forecast-progress").text(`${m.progress.toFixed(1).replace(".",",")}%`);
  $("#overview-forecast-avg").text(m.avg?fmtMoney(m.avg):"Sammelt Daten");
  $("#overview-today-earn").text(fmtMoney(allianceEarnToday()));
  $("#overview-quality").text(`${m.qualityText} Datenbasis`);
}
function renderForecast(){
  const m=allianceForecastModel();
  $("#forecast-board").toggle(S.settings.forecastEnabled!==false);
  $("#forecast-overview-view").html(forecastOverviewHtml(m));
  $("#forecast-full-view").html(forecastFullHtml(m));
  $("#sb-forecast-target,#forecast-target-main").val(S.settings.forecastTarget);
  updateOverviewForecastSummary(m);
  setTimeout(()=>drawForecastChart("forecast-chart-full",m),40);
}
function applyForecastSettings(target){
  S.settings.forecastTarget=Math.max(1,Math.round(Number(target)||30000000000));
  save();renderForecast();
}

function pushHist(val){
  const now=Date.now(),h=S.creditHist;
  if(!h.length||now-h[h.length-1].ts>290000){
    h.push({ts:now,v:val});
    if(h.length>48)h.shift();
    save();drawChart();renderHistTab();
  }
}

function drawChart(){
  const canvas=document.getElementById("lss7-chart");
  if(!canvas)return;
  const h=S.creditHist;
  const W=canvas.offsetWidth||460,H=96;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,W,H);

  if(h.length<2){
    ctx.fillStyle="rgba(255,255,255,.03)";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,.12)";
    ctx.font="11px Inter,sans-serif";ctx.textAlign="center";
    ctx.fillText("Daten werden gesammelt...",W/2,H/2+4);
    return;
  }

  const vals=h.map(p=>p.v),mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
  const p={l:4,r:4,t:10,b:10};
  const cw=W-p.l-p.r,ch=H-p.t-p.b;
  const pts=h.map((x,i)=>({
    x:p.l+(i/(h.length-1))*cw,
    y:p.t+(1-(x.v-mn)/rng)*ch
  }));

  // subtle grid
  ctx.strokeStyle="rgba(255,255,255,.04)";ctx.lineWidth=1;
  [.25,.5,.75].forEach(f=>{
    const y=p.t+f*ch;
    ctx.beginPath();ctx.moveTo(p.l,y);ctx.lineTo(W-p.r,y);ctx.stroke();
  });

  // gradient fill
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,"rgba(59,130,246,.30)");
  g.addColorStop(1,"rgba(59,130,246,.01)");
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++){
    const cx=(pts[i-1].x+pts[i].x)/2;
    ctx.bezierCurveTo(cx,pts[i-1].y,cx,pts[i].y,pts[i].x,pts[i].y);
  }
  ctx.lineTo(pts[pts.length-1].x,H);
  ctx.lineTo(pts[0].x,H);ctx.closePath();
  ctx.fillStyle=g;ctx.fill();

  // line
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  for(let i=1;i<pts.length;i++){
    const cx=(pts[i-1].x+pts[i].x)/2;
    ctx.bezierCurveTo(cx,pts[i-1].y,cx,pts[i].y,pts[i].x,pts[i].y);
  }
  ctx.strokeStyle="#3b82f6";ctx.lineWidth=1.8;ctx.stroke();

  // last dot
  const lp=pts[pts.length-1];
  ctx.beginPath();ctx.arc(lp.x,lp.y,3.5,0,Math.PI*2);
  ctx.fillStyle="#60a5fa";ctx.fill();

  // meta
  const diff=h.length>=2?h[h.length-1].v-h[h.length-2].v:0;
  const col=diff>=0?"#22c55e":"#ef4444";
  setH("#cv-meta",`<span style="color:${col};font-weight:700">${diff>=0?"+":""}${fmt(diff)} ¢</span> letzte Aenderung`);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  DONUT CHART                                                 â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function drawDonut(data){
  const el=document.getElementById("lss7-donut");
  if(!el)return;
  const total=Object.values(data).reduce((s,v)=>s+(v||0),0);
  if(!total){el.innerHTML="";return;}

  const keys=Object.keys(VSTATUS).map(Number).filter(k=>(data[k]||0)>0);
  const cx=44,cy=44,r=37,thick=11;
  let ang=-Math.PI/2, paths="";
  keys.forEach(k=>{
    const pct=(data[k]||0)/total;
    const sw=pct*2*Math.PI;
    const x1=cx+r*Math.cos(ang),y1=cy+r*Math.sin(ang);
    const x2=cx+r*Math.cos(ang+sw),y2=cy+r*Math.sin(ang+sw);
    const lg=sw>Math.PI?1:0;
    const col=VSTATUS[k]?.c||"#4a5568";
    paths+=`<path d="M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}"
      fill="none" stroke="${col}" stroke-width="${thick}" stroke-linecap="butt"/>`;
    ang+=sw;
  });

  el.innerHTML=`<svg viewBox="0 0 88 88" xmlns="http://www.w3.org/2000/svg">
    <circle cx="44" cy="44" r="37" fill="none" stroke="rgba(255,255,255,.05)" stroke-width="11"/>
    ${paths}
    <text class="donut-total" x="44" y="41" text-anchor="middle" font-size="14" font-weight="700" font-family="JetBrains Mono">${total}</text>
    <text class="donut-label" x="44" y="54" text-anchor="middle" font-size="7.5" font-family="Inter">Fahrzeuge</text>
  </svg>`;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  API â€” FETCH FUNCTIONS                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function allianceRoleInfo(user){
  const assigned=Array.isArray(user?.roles)?user.roles.map(String).filter(Boolean):[];
  let all=mergeProfileRoles(assigned.map(roleFromLabel).filter(Boolean));
  // Alte API-Versionen liefern teils keine Rollenliste. In diesem Fall werden
  // nur die drei eindeutigen Leitungsrollen aus den Flags abgeleitet. Flags wie
  // finance oder schooling sind Berechtigungen und keine vergebenen Rollen.
  if(!all.length){
    const flags=user?.role_flags||{};
    const enabled=value=>value===true||value===1||value==="1";
    const fallback=enabled(flags.owner)?"owner":enabled(flags.admin)?"admin":enabled(flags.coadmin)?"coadmin":"";
    if(fallback)all=[ALLIANCE_ROLE_DEFS.find(role=>role.id===fallback)].filter(Boolean);
  }
  const keys=assigned.map(normalizeTxt);
  const primary=all[0]||{id:"member",label:"Mitglied",color:"#64748b",text:"#ffffff"};
  const lead=all.some(role=>["owner","admin","coadmin"].includes(role.id));
  return {keys,all,primary,lead,special:all.length>0&&!lead};
}
function roleFromLabel(label){
  const raw=String(label||"").replace(/\s+/g," ").trim();
  const normalized=normalizeTxt(raw).replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"");
  const direct=ALLIANCE_ROLE_DEFS.find(role=>role.aliases.includes(normalized) ||
    normalizeTxt(role.label).replace(/[^a-z0-9]+/g,"_")===normalized) ||
    [...ALLIANCE_ROLE_DEFS].sort((a,b)=>Math.max(...b.aliases.map(x=>x.length))-Math.max(...a.aliases.map(x=>x.length)))
      .find(role=>role.aliases.some(alias=>alias.length>=5&&normalized.includes(alias)));
  if(direct)return direct;
  if(!raw || !/[A-Za-zÀ-ÿ0-9]/.test(raw))return null;
  return {id:"other",label:raw,color:"#0891b2",text:"#ffffff",aliases:[normalized]};
}
function mergeProfileRoles(...groups){
  const seen=new Set(),roles=[];
  groups.flat().filter(Boolean).forEach(role=>{
    const key=`${role.id}|${normalizeTxt(role.label)}`;
    if(seen.has(key))return;
    seen.add(key);roles.push(role);
  });
  return roles;
}
function updateProfileRolesFromAlliance(users){
  const list=Array.isArray(users)?users:[];
  const navName=normalizeTxt(readOwnProfileFromDom().name||S.profile.name);
  const own=list.find(user=>Number(S.userId)>0&&Number(user.id)===Number(S.userId)) ||
    list.find(user=>navName&&normalizeTxt(user.name)===navName);
  if(!own)return;
  const roles=allianceRoleInfo(own).all;
  S.profile.roles=roles;
  renderProfileQuick();
}

function fetchAlliance(){
  apiGet(API.alliance,d=>{
    const apiAllianceId=Number(d.id)||null;
    const domAllianceId=readAllianceIdFromDom();
    S.allianceId=apiAllianceId || domAllianceId || S.allianceId || null;
    S.lastApiTs=Date.now();
    const tot=d.credits_total||0;
    trackAllianceDailyCredits(tot);
    S.lastAlliCreds=tot;save();
    pushHist(tot);
    renderOverview(d);
    loadRankContext();
    updateProfileRolesFromAlliance(d.users||[]);
    renderTeam(d.users||[]);
    updateFooter();
  });
}
function fetchDailyEarnFromOverview(){
  pageGet(API.creditsOverview, html => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const rows = Array.from(doc.querySelectorAll("table.table tbody tr"));
    if(!rows.length) return;

    const today = todayDeStr();
    let found = null;
    const daily=[];
    rows.forEach(row => {
      const tds = row.querySelectorAll("td");
      if(tds.length < 4) return;
      const dateTxt = (tds[3].textContent||"").trim();
      const earnTxt = (tds[2].textContent||"").trim();
      const earnVal = parseCreditsValue(earnTxt);
      const dm=dateTxt.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if(dm&&earnVal!==null)daily.push({date:`${dm[3]}-${String(dm[2]).padStart(2,"0")}-${String(dm[1]).padStart(2,"0")}`,earn:Math.max(0,earnVal)});
      if(dateTxt !== today) return;
      if(earnVal !== null) found = earnVal;
    });

    if(daily.length){
      const map=new Map((S.playerDaily||[]).map(row=>[row.date,row]));
      daily.forEach(row=>map.set(row.date,row));
      S.playerDaily=Array.from(map.values()).sort((a,b)=>a.date.localeCompare(b.date)).slice(-14);
    }

    if(found === null) return;
    S.dailyEarn = found;
    save();
    setV("#qs-daily", fmtMoney(S.dailyEarn));
    renderPlayerForecast();
  });
}

function playerForecastModel(){
  const profileCredits=parseCreditsValue(S.profile.totalCredits);
  const creditCurrent=Math.max(0,(profileCredits!==null?profileCredits:Number(S.profile.totalCredits))||Number(S.userCredits)||0);
  let index=0;
  LEVELS.forEach((level,i)=>{if(creditCurrent>=level.need)index=i;});
  const rankIndex=LEVELS.findIndex(level=>normalizeTxt(level.rank)===normalizeTxt(S.profile.rank));
  if(rankIndex>=0)index=rankIndex;
  const level=LEVELS[index]||LEVELS[0];
  const next=LEVELS[index+1]||null;
  const start=Number(level.need)||0;
  const target=Number(next?.need)||creditCurrent;
  const remainingFromText=parseCreditsValue(S.profile.needText);
  const current=next&&remainingFromText!==null?Math.max(0,target-remainingFromText):creditCurrent;
  const remaining=next?(remainingFromText!==null?Math.max(0,remainingFromText):Math.max(0,target-current)):0;
  const span=Math.max(1,target-start);
  const progress=next?Math.max(0,Math.min(100,(current-start)/span*100)):100;
  const today=localDateKey();
  const completed=(S.playerDaily||[]).filter(row=>row.date!==today&&Number(row.earn)>0).slice(-7);
  let samples=completed.map(row=>Number(row.earn));
  const todayEarn=Math.max(0,Number(S.dailyEarn)||0);
  const usedToday=todayEarn>0&&samples.length<3;
  if(usedToday)samples=[...samples,todayEarn].slice(-7);
  const average=robustDailyAverage(samples);
  const days=next&&average>0?Math.ceil(remaining/average):null;
  const eta=days!==null?new Date(Date.now()+days*86400000):null;
  const dailyRows=playerDailyRows(7).filter(row=>Number(row.earn)>0);
  const total7=dailyRows.reduce((sum,row)=>sum+Number(row.earn||0),0);
  const bestDay=dailyRows.length?[...dailyRows].sort((a,b)=>b.earn-a.earn)[0]:null;
  const weakDay=dailyRows.length?[...dailyRows].sort((a,b)=>a.earn-b.earn)[0]:null;
  const sampleCount=samples.length;
  const qualityScore=Math.max(8,Math.min(100,Math.round((Math.min(sampleCount,7)/7)*100)));
  const qualityText=`${fmt(Math.min(sampleCount,7))}/7 Tage`;
  const weeklyPace=average?average*7:0;
  return {current,level,next,target,remaining,progress,average,days,eta,samples:sampleCount,dailyRows,total7,bestDay,weakDay,qualityScore,qualityText,weeklyPace,usedToday};
}

function playerDailyRows(limit=7){
  const map=new Map();
  (Array.isArray(S.playerDaily)?S.playerDaily:[]).forEach(row=>{
    if(!row?.date||!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date)))return;
    map.set(String(row.date),Math.max(0,Number(row.earn)||0));
  });
  if(Number(S.dailyEarn)>0)map.set(localDateKey(),Math.max(Number(map.get(localDateKey()))||0,Number(S.dailyEarn)||0));
  return Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0])).slice(-Math.max(1,Number(limit)||7)).map(([date,earn])=>({date,earn,label:dayLabel(date)}));
}

function playerDailyBoardHtml(){
  const rows=playerDailyRows(7);
  if(!rows.length)return `<div class="player-daily-panel"><div class="player-daily-head"><b>Persönlicher Verdienst · 7 Tage</b><span>Datensammlung startet</span></div><div class="lss7-empty">Noch keine persönlichen Tageswerte gespeichert.</div></div>`;
  const max=Math.max(...rows.map(row=>row.earn),1);
  const avg=Math.round(rows.reduce((sum,row)=>sum+row.earn,0)/rows.length);
  return `<div class="player-daily-panel"><div class="player-daily-head"><b>Persönlicher Verdienst · 7 Tage</b><span>${rows.length}/7 Tage · Ø ${fmtMoney(avg)}</span></div>${rows.map(row=>{
    const pct=row.earn>0?Math.max(5,Math.round(row.earn/max*100)):0;
    return `<div class="player-daily-row"><span class="player-daily-day">${escHtml(row.label)}</span><span class="player-daily-bar"><i style="width:${pct}%"></i></span><span class="player-daily-val">${fmtMoney(row.earn)}</span></div>`;
  }).join("")}</div>`;
}
function playerRecordsHtml(model){
  const rows=playerDailyRows(14).filter(row=>row.earn>0);
  const bestDay=rows.length?[...rows].sort((a,b)=>b.earn-a.earn)[0]:null;
  const total=rows.reduce((sum,row)=>sum+row.earn,0);
  const avg=rows.length?Math.round(total/rows.length):0;
  let streak=0;
  const dates=new Set(rows.map(row=>row.date));
  const cursor=new Date();
  for(let i=0;i<14;i++){
    const key=localDateKey(cursor);
    if(!dates.has(key))break;
    streak++;
    cursor.setDate(cursor.getDate()-1);
  }
  const rank=Number(S.playerRanking?.rank)||0;
  const bestRankValues=[rank,Number(S.playerRankHistory?.bestRank)||0].filter(Boolean);
  const bestRank=bestRankValues.length?Math.min(...bestRankValues):0;
  const reached=LEVELS.filter(level=>model.current>=Number(level.need||0));
  const recentMilestones=LEVELS.map((level,index)=>({level,index,reached:model.current>=Number(level.need||0)}))
    .filter(item=>item.reached||item.index===reached.length)
    .slice(Math.max(0,reached.length-3),reached.length+1);
  return `<section class="player-records">
    <div class="player-records-head"><div><b>Persönliche Rekorde & Meilensteine</b><span>Aus deinen lokal gespeicherten Werten</span></div><em>${fmt(reached.length)}/${fmt(LEVELS.length)} Ränge erreicht</em></div>
    <div class="player-record-grid">
      <div class="player-record-card best"><span>Bester Tag</span><b>${bestDay?fmtMoney(bestDay.earn):"-"}</b><small>${bestDay?escHtml(bestDay.label):"Noch keine Tageswerte"}</small></div>
      <div class="player-record-card"><span>Ø der letzten Tage</span><b>${avg?fmtMoney(avg):"-"}</b><small>${fmt(rows.length)} gespeicherte Tage</small></div>
      <div class="player-record-card streak"><span>Aktive Verdienstserie</span><b>${fmt(streak)} ${streak===1?"Tag":"Tage"}</b><small>Tage mit erfasstem Verdienst</small></div>
      <div class="player-record-card rank"><span>Beste Platzierung heute</span><b>${bestRank?`#${fmt(bestRank)}`:"-"}</b><small>${rank?`Aktuell #${fmt(rank)}`:"Topliste wird geladen"}</small></div>
    </div>
    <div class="player-milestones">${recentMilestones.map(item=>{
      const next=!item.reached;
      return `<div class="player-milestone${item.reached?" reached":" next"}"><span class="player-milestone-dot">${item.reached?"✓":"→"}</span><div><b>${escHtml(item.level.rank)}</b><small>${fmtMoney(item.level.need)}${next&&model.remaining?` · noch ${fmtMoney(model.remaining)}`:""}</small></div></div>`;
    }).join("")}</div>
  </section>`;
}

function normalizePlayerRankHistory(){
  const today=localDateKey();
  const h=S.playerRankHistory||{};
  if(h.date!==today){
    S.playerRankHistory={date:today,startRank:null,lastRank:null,bestRank:null,worstRank:null,updates:0,lastTs:0};
    return;
  }
  S.playerRankHistory={
    date:today,
    startRank:Number(h.startRank)||null,
    lastRank:Number(h.lastRank)||null,
    bestRank:Number(h.bestRank)||null,
    worstRank:Number(h.worstRank)||null,
    updates:Number(h.updates)||0,
    lastTs:Number(h.lastTs)||0
  };
}
function recordPlayerRank(rank){
  rank=Number(rank)||0;
  if(!rank)return;
  normalizePlayerRankHistory();
  const h=S.playerRankHistory;
  if(!h.startRank)h.startRank=rank;
  h.lastRank=rank;
  h.bestRank=h.bestRank?Math.min(h.bestRank,rank):rank;
  h.worstRank=h.worstRank?Math.max(h.worstRank,rank):rank;
  h.updates=(Number(h.updates)||0)+1;
  h.lastTs=Date.now();
}
function playerRankDelta(){
  normalizePlayerRankHistory();
  const h=S.playerRankHistory||{};
  if(!h.startRank||!h.lastRank)return {delta:0,cls:"neutral",icon:"▬",label:"Tageshistorie startet",short:"-",compact:"-"};
  const delta=Number(h.startRank)-Number(h.lastRank);
  if(delta>0)return {delta,cls:"up",icon:"▲",label:`${fmt(delta)} Plätze heute aufgestiegen`,short:`+${fmt(delta)} Plätze`,compact:`+${fmt(delta)}`};
  if(delta<0)return {delta,cls:"down",icon:"▼",label:`${fmt(Math.abs(delta))} Plätze heute abgestiegen`,short:`-${fmt(Math.abs(delta))} Plätze`,compact:`-${fmt(Math.abs(delta))}`};
  return {delta:0,cls:"neutral",icon:"▬",label:"Heute unverändert",short:"0 Plätze",compact:"0"};
}
function rankTrendHtml(delta,mode="long"){
  const info=delta||playerRankDelta();
  const text=mode==="compact"?info.compact:(mode==="short"?info.short:info.label);
  return `<span class="rank-trend-icon" aria-hidden="true" title="${escHtml(info.label)}">${escHtml(info.icon||"▬")}</span><span class="rank-trend-label">${escHtml(text)}</span>`;
}
function playerProfileLink(row){
  const id=Number(row?.id)||0;
  return id?`${BASE}/profile/${encodeURIComponent(id)}`:"";
}

function openPlayerForecastPanel(forceFetch=false){
  const panel=$("#lss7");
  S.settings.panelCollapsed=false;
  applyPanelMode();
  panel.find(".prof-view-btn").removeClass("active");
  panel.find('.prof-view-btn[data-prof-view="forecast"]').addClass("active");
  $("#prof-forecast-panel").addClass("open");
  renderPlayerForecast();
  fetchPlayerRanking(!!forceFetch);
  document.getElementById("prof-forecast-panel")?.scrollIntoView({behavior:"smooth",block:"nearest"});
}

function renderPlayerForecast(){
  const roots=$("#player-forecast-view,#player-profile-forecast-view");
  const model=playerForecastModel();
  const rank=S.playerRanking?.rank;
  const delta=playerRankDelta();
  $("#prof-placement")
    .attr("title",`Spielerprognose und Platzierungsumfeld öffnen · ${delta.label}`)
    .html(`<span class="prof-placement-kicker">Spielerplatzierung</span><span class="prof-placement-main"><strong>${rank?`#${fmt(rank)}`:"Wird ermittelt"}</strong><small class="prof-placement-history ${delta.cls}">${rankTrendHtml(delta,"compact")}</small></span><span class="prof-placement-caption">${escHtml(delta.label)}</span>`);
  if(!roots.length)return;
  const eta=model.next
    ?(model.eta?model.eta.toLocaleDateString(uiLocale(),{weekday:"long",day:"2-digit",month:"long",year:"numeric"}):"Noch nicht berechenbar")
    :"Höchster Rang erreicht";
  const etaShort=model.next
    ?(model.days!==null?`${fmt(model.days)} ${model.days===1?"Tag":"Tage"}`:"Tempo wird ermittelt")
    :"Ziel erreicht";
  const etaState=model.next?(model.eta?"active":"waiting"):"reached";
  const rows=(S.playerRanking?.rows||[]).map(row=>{
    const href=playerProfileLink(row);
    const nameHtml=href?`<a href="${href}" target="_blank" rel="noopener">${escHtml(row.name)}</a>`:`<b>${escHtml(row.name)}</b>`;
    return `<div class="player-rank-row${row.me?" me":""}"><span>#${fmt(row.rank)}</span>${nameHtml}<span>${fmtMoney(row.credits)}</span></div>`;
  }).join("");
  const progressMeta=model.next?`${model.progress.toFixed(2).replace(".",",")}% im aktuellen Dienstgrad`:"Höchster Rang erreicht";
  const html=`<div class="player-forecast pro">
    <div class="player-forecast-head"><div><div class="player-forecast-title">Spielerprognose</div><div class="player-forecast-sub">Prognose bis zur nächsten Beförderung auf Basis deiner lokal erfassten Tagesverdienste. Ab 3 bis 7 vollständigen Tagen wird die Schätzung belastbarer.</div></div></div>
    <div class="player-forecast-hero">
      <div class="player-forecast-hero-main">
        <span class="player-forecast-eyebrow">Nächste Beförderung</span>
        <strong class="player-forecast-hero-rank">${escHtml(model.next?.rank||"Höchster Rang")}</strong>
        <span class="player-forecast-hero-meta">${model.next?`${fmtMoney(model.remaining)} fehlen noch · ${progressMeta}`:"Alle bekannten Beförderungen sind erreicht."}</span>
      </div>
      <div class="player-forecast-eta ${etaState}">
        <span class="player-forecast-eta-label">Voraussichtliches Erreichungsdatum</span>
        <strong>${escHtml(eta)}</strong>
        <span class="player-forecast-eta-days">${escHtml(etaShort)}</span>
        <small>Berechnet aus deinem durchschnittlichen persönlichen Tagesverdienst</small>
      </div>
      <div class="player-forecast-hero-grid">
        <span class="player-forecast-hero-stat"><span>Ø pro Tag</span><b>${model.average?fmtMoney(model.average):"Sammelt Daten"}</b></span>
        <span class="player-forecast-hero-stat"><span>Tempo/Woche</span><b>${model.weeklyPace?fmtMoney(model.weeklyPace):"-"}</b></span>
        <span class="player-forecast-hero-stat"><span>Datenbasis</span><b>${escHtml(model.qualityText)}</b></span>
      </div>
    </div>
    <div class="player-forecast-progress-block">
      <div class="player-forecast-progress-meta"><span>Fortschritt zu ${escHtml(model.next?.rank||"deinem Ziel")}</span><b>${model.progress.toFixed(2).replace(".",",")}%</b></div>
      <div class="player-forecast-progress"><div class="player-forecast-fill" style="width:${model.progress.toFixed(2)}%"></div></div>
      <div class="player-forecast-progress-meta foot"><span>${model.next?fmtMoney(model.current):"Abgeschlossen"}</span><span>${model.next?`${fmtMoney(model.remaining)} fehlen noch`:"Alle bekannten Ränge erreicht"}</span></div>
    </div>
    <div class="player-forecast-grid">
      <div class="player-forecast-kpi"><span>Aktueller Dienstgrad</span><b>${escHtml(model.level.rank)}</b></div>
      <div class="player-forecast-kpi"><span>Nächste Beförderung</span><b>${escHtml(model.next?.rank||"Höchster Rang")}</b></div>
      <div class="player-forecast-kpi progress"><span>Noch benötigt</span><b>${model.next?fmtMoney(model.remaining):"Erreicht"}</b></div>
      <div class="player-forecast-kpi rank"><span>Spielerplatzierung</span><b>${rank?`#${fmt(rank)}`:escHtml(S.playerRanking?.status||"Wird geladen")}</b></div>
      <div class="player-forecast-kpi rank"><span>Platzänderung heute</span><b class="rank-delta ${delta.cls}">${rankTrendHtml(delta,"short")}</b></div>
      <div class="player-forecast-kpi progress"><span>Aktueller Creditstand</span><b>${fmtMoney(model.current)}</b></div>
      <div class="player-forecast-kpi progress"><span>Zielwert Beförderung</span><b>${model.next?fmtMoney(model.target):"Erreicht"}</b></div>
      <div class="player-forecast-kpi data"><span>7 Tage Summe</span><b>${model.total7?fmtMoney(model.total7):"-"}</b></div>
      <div class="player-forecast-kpi data"><span>Bester Tag</span><b>${model.bestDay?`${escHtml(model.bestDay.label)} · ${fmtMoney(model.bestDay.earn)}`:"-"}</b></div>
      <div class="player-forecast-kpi data"><span>Datenbasis</span><b>${escHtml(model.qualityText)}</b></div>
    </div>
    ${playerRecordsHtml(model)}
    ${playerDailyBoardHtml()}
    <div class="set-note">Offline-Zeiten, Events und schwankende Tagesverdienste können zu Abweichungen führen. Die Werte werden nur in diesem Browser gespeichert.</div>
    <div class="player-rank-context">${rows||`<div class="lss7-empty">${escHtml(S.playerRanking?.status||"Spielerplatzierung wird geladen...")}</div>`}</div>
  </div>`;
  roots.html(html);
  roots.each((_,node)=>applyTranslations(node));
}

function parseToplistHtml(html,page){
  const doc=new DOMParser().parseFromString(html||"","text/html");
  const rows=Array.from(doc.querySelectorAll("table tbody tr")).map((tr,index)=>{
    const cells=tr.querySelectorAll("td");
    if(cells.length<3)return null;
    const profile=cells[2].querySelector("a[href*='/profile/']")||tr.querySelector("a[href*='/profile/']");
    const href=profile?.getAttribute("href")||"";
    const id=Number(href.match(/\/profile\/(\d+)/)?.[1])||null;
    const credits=parseCreditsValue(cells[1]?.textContent||"");
    const name=(profile?.textContent||cells[2]?.textContent||"").replace(/\s+/g," ").trim();
    if(credits===null||!name)return null;
    return {id,name,credits,rank:(Math.max(1,page)-1)*20+index+1};
  }).filter(Boolean);
  let lastPage=1;
  doc.querySelectorAll("a[href*='page=']").forEach(link=>{
    const n=Number((link.getAttribute("href")||"").match(/[?&]page=(\d+)/)?.[1]);
    if(n>lastPage)lastPage=n;
  });
  const pageSummary=(doc.body?.textContent||"").replace(/\s+/g," ");
  const totalPagesText=pageSummary.match(/von\s+insg\.\s*([\d.]+)\s+Seiten/i)?.[1];
  const totalPages=totalPagesText?Number(totalPagesText.replace(/\./g,"")):0;
  if(Number.isFinite(totalPages)&&totalPages>lastPage)lastPage=totalPages;
  return {rows,lastPage};
}

function toplistPage(page){
  return new Promise((resolve,reject)=>pageGet(`${API.toplist}?page=${Math.max(1,page)}`,html=>resolve(parseToplistHtml(html,Math.max(1,page))),reject));
}

function playerRowMatches(row){
  if(Number(S.userId)>0&&Number(row.id)===Number(S.userId))return true;
  return normalizeTxt(row.name)===normalizeTxt(S.profile.name);
}

async function fetchPlayerRanking(force=false){
  const ranking=S.playerRanking;
  if(ranking.loading)return;
  if(!force&&ranking.rank&&Date.now()-Number(ranking.lastTs||0)<1800000){renderPlayerForecast();return;}
  const target=Math.max(0,Number(S.profile.totalCredits)||Number(S.userCredits)||0);
  if(!target||(!S.userId&&!S.profile.name)){ranking.status="Profil wird geladen";renderPlayerForecast();return;}
  ranking.loading=true;ranking.status="Topliste wird durchsucht";renderPlayerForecast();
  try{
    const first=await toplistPage(1);
    let found=first.rows.find(playerRowMatches),candidate=1;
    let low=1,high=Math.max(1,first.lastPage||1),guard=0;
    while(!found&&low<=high&&guard++<20){
      const page=Math.floor((low+high)/2);
      const data=page===1?first:await toplistPage(page);
      if(!data.rows.length)break;
      found=data.rows.find(playerRowMatches);
      if(found){candidate=page;break;}
      const highest=data.rows[0].credits,lowest=data.rows[data.rows.length-1].credits;
      if(target>highest)high=page-1;
      else if(target<lowest)low=page+1;
      else{candidate=page;break;}
      candidate=Math.max(1,Math.min(high||1,low));
    }
    const pages=Array.from(new Set([candidate-2,candidate-1,candidate,candidate+1,candidate+2].filter(page=>page>=1&&page<=Math.max(1,first.lastPage||1))));
    const dataPages=await Promise.all(pages.map(page=>page===1?Promise.resolve(first):toplistPage(page)));
    const combined=dataPages.flatMap(data=>data.rows).sort((a,b)=>a.rank-b.rank);
    found=found||combined.find(playerRowMatches);
    if(found){
      const idx=combined.findIndex(row=>row.rank===found.rank);
      ranking.rank=found.rank;
      ranking.rows=combined.slice(Math.max(0,idx-2),idx+3).map(row=>({...row,me:row.rank===found.rank}));
      ranking.status="Aktuell";
      recordPlayerRank(found.rank);
    }else{
      const closest=[...combined].sort((a,b)=>Math.abs(a.credits-target)-Math.abs(b.credits-target))[0];
      ranking.rank=closest?.rank||null;
      ranking.rows=closest?[{...closest,me:false}]:[];
      ranking.status=closest?"Näherungswert":"Nicht gefunden";
    }
    ranking.lastTs=Date.now();
  }catch(e){
    ranking.status="Topliste derzeit nicht erreichbar";
    logDebug("player ranking",e);
  }finally{
    ranking.loading=false;save();renderPlayerForecast();
  }
}

function fetchUserinfo(){
  apiGet(API.userinfo,d=>{
    const oldId=S.userId;
    S.userId=Number(d.id||d.user_id||d.userId)||readOwnUserIdFromDom()||S.userId||null;
    const domCredits=readOwnCreditsFromNavbar();
    const domCoins=readOwnCoinsFromNavbar();
    const currentCredits=(domCredits!==null?domCredits:(d.credits||0));
    handleCreditBalance(currentCredits);
    S.userCredits=currentCredits;
    S.userCoins=(domCoins!==null?domCoins:(d.coins||0));
    setV("#qs-credits",fmtMoney(S.userCredits));
    setV("#qs-coins",fmt(S.userCoins));
    if(S.userId && (!oldId || S.profile.name==="-" || !S.profile.avatar)){
      setTimeout(fetchProfileCard,80);
    }
  });
}

function renderProfileQuick(){
  $("#prof-name").text(S.profile.name||"-");
  $("#prof-rank").text(S.profile.rank||"-");
  const roles=Array.isArray(S.profile.roles)?S.profile.roles:[];
  $("#prof-roles").html(roles.map(role=>
    `<span class="prof-role" style="--role-color:${escHtml(role.color||"#2563eb")};--role-text:${escHtml(role.text||"#ffffff")}">${escHtml(role.label||"Mitglied")}</span>`
  ).join("")).toggle(roles.length>0);
  if(S.profile.reward){
    $("#prof-reward").text(`Beförderungs-Belohnung: ${S.profile.reward}`).show();
  }else{
    $("#prof-reward").hide().text("");
  }
  if(S.profile.needText){
    $("#prof-next").text(S.profile.needText).show();
  }else{
    $("#prof-next").hide().text("");
  }
  const pct=Math.max(0,Math.min(100,Number(S.profile.progress)||0));
  $("#prof-progress").text(`${S.profile.progressText||"-"} (${Math.round(pct)}%)`);
  $("#prof-fill").css("width",`${pct}%`);
  if(S.profile.avatar){
    const src=String(S.profile.avatar);
    const abs=src.startsWith("http")?src:(src.startsWith("/")?`${BASE}${src}`:src);
    $("#prof-av").attr("src",abs);
  }
}

function profileFieldFromText(text,label){
  const t=String(text||"").replace(/\s+/g," ").trim();
  const rx=new RegExp(`${label}\\s*:?\\s*(.+?)(?=\\s+(?:Dienstgrad|Anmeldedatum|verdiente Credits|Verband|$))`,"i");
  const m=t.match(rx);
  return m&&m[1]?m[1].trim():"";
}
function pickLevelByCredits(credits){
  let current=LEVELS[0];
  for(const lv of LEVELS){
    if(credits>=lv.need) current=lv;
    else break;
  }
  return current;
}

function fetchProfileCard(){
  const nav=readOwnProfileFromDom();
  if(nav.name) S.profile.name=nav.name;
  if(nav.avatar) S.profile.avatar=nav.avatar;
  renderProfileQuick();

  if(S.userId) pageGet(`${BASE}/profile/${S.userId}`, html=>{
    const doc=new DOMParser().parseFromString(html,"text/html");
    const name=(doc.querySelector(".user_name, .profile-header h1, h1, .navbar-profile-name, .username")?.textContent||"").trim() || S.profile.name || "-";
    const avatarDom=(
      doc.querySelector(".profile-image, .profile-avatar img, .user_image img, img.img-rounded, .panel img, .navbar-avatar img, .avatar img")?.getAttribute("src") ||
      doc.querySelector(".profile-image, .profile-avatar img, .user_image img, img.img-rounded, .panel img, .navbar-avatar img, .avatar img")?.getAttribute("data-src") ||
      ""
    ).trim();
    const mAvatar=html.match(/<img[^>]*class=["'][^"']*profile-image[^"']*["'][^>]*src=["']([^"']+)["']/i);
    const avatar=((mAvatar&&mAvatar[1])||avatarDom||"").trim();
    const pageRoles=Array.from(doc.querySelectorAll(".alliance-roles li"))
      .map(el=>roleFromLabel((el.textContent||"").replace(/\s+/g," ").trim()))
      .filter(Boolean);
    let since=S.profile.since||"-";
    let grade=S.profile.rank||"-";
    const infoWell=Array.from(doc.querySelectorAll(".well div, .well li, .profile-info div, .well"));
    infoWell.forEach(div=>{
      const label=(div.querySelector("b")?.textContent||"").trim().toLowerCase();
      const txt=(div.textContent||"").replace(/\s+/g," ").trim();
      if(label.includes("anmeldedatum")){
        const v=txt.split(":").slice(1).join(":").trim();
        if(v) since=v;
      }
      if(label.includes("dienstgrad")){
        const v=txt.split(":").slice(1).join(":").trim();
        if(v) grade=v;
      }
    });
    // Robust fallback: b-label + sibling text
    doc.querySelectorAll("b").forEach(b=>{
      const label=(b.textContent||"").toLowerCase().trim();
      const block=((b.parentElement?.textContent)||"").replace(/\s+/g," ").trim();
      if((!grade || grade==="-" || grade==="Level") && label.includes("dienstgrad")){
        const v=block.split(":").slice(1).join(":").trim();
        if(v) grade=v;
      }
      if((!since || since==="-" ) && label.includes("anmeldedatum")){
        const v=block.split(":").slice(1).join(":").trim();
        if(v) since=v;
      }
    });
    const plain=(doc.body?.innerText||doc.body?.textContent||"").replace(/\s+/g," ").trim();
    if(since==="-" || !since){
      const mSince=plain.match(/Anmeldedatum\s*:\s*(.+?)(?=\s+(?:verdiente\s+Credits|Verband|Dienstgrad|Spielerprofil)\b|$)/i);
      if(mSince && mSince[1]) since=mSince[1].trim();
    }
    if(grade==="-" || !grade){
      const mGrade=plain.match(/Dienstgrad\s*:\s*(.+?)(?=\s+(?:Anmeldedatum|verdiente\s+Credits|Verband|Spielerprofil)\b|$)/i);
      if(mGrade && mGrade[1]) grade=mGrade[1].trim();
    }
    if(since==="-" || !since){
      const s2=profileFieldFromText((doc.body?.innerText||doc.body?.textContent||""),"Anmeldedatum");
      if(s2) since=s2;
    }
    if(grade==="-" || !grade){
      const g2=profileFieldFromText((doc.body?.innerText||doc.body?.textContent||""),"Dienstgrad");
      if(g2) grade=g2;
    }
    if((!avatar || avatar==="") && nav.avatar) S.profile.avatar=nav.avatar;
    S.profile.name=name;
    S.profile.since=since;
    S.profile.rank=grade||S.profile.rank;
    if(pageRoles.length)S.profile.roles=pageRoles;
    if(avatar) S.profile.avatar=avatar;
    renderProfileQuick();
  },()=>renderProfileQuick());

  pageGet(`${BASE}/level`, html=>{
    const doc=new DOMParser().parseFromString(html,"text/html");
    const rank=(doc.querySelector(".page-header h1, h2, h3, .panel-title")?.textContent||"").replace(/\s+/g," ").trim() || S.profile.rank || "-";
    const bar=doc.querySelector(".progress-bar");
    const style=bar?.getAttribute("style")||"";
    const mPct=style.match(/width:\s*([\d.]+)%/i);
    const ariaNow=bar?.getAttribute("aria-valuenow");
    const pctText=(doc.querySelector(".progress-bar-rank-percentage")?.textContent||"").replace(/\s+/g," ").trim();
    const txt=(bar?.textContent||doc.body?.textContent||"").replace(/\s+/g," ").trim();
    const mTxtPct=txt.match(/(\d{1,3}(?:[.,]\d+)?)\s*%/);
    const mAbs=`${pctText} ${txt}`.match(/([\d.,]+)\s*(?:\/|\\)\s*([\d.,]+)/);
    const curAbs=mAbs?parseDeNum(mAbs[1]):null;
    const maxAbs=mAbs?parseDeNum(mAbs[2]):null;
    const calcAbs=(curAbs!==null && maxAbs && maxAbs>0)?(curAbs/maxAbs*100):null;
    const progress=Math.max(0,Math.min(100,
      Number((mPct&&mPct[1])||(mTxtPct&&mTxtPct[1].replace(",", "."))||calcAbs||ariaNow||0)
    ));
    const progressText=(mAbs&&`${mAbs[1]} / ${mAbs[2]}`) || (mTxtPct&&`${mTxtPct[1]}%`) || (Number.isFinite(progress)?`${Math.round(progress)}%`:"-");
    const rewardNode=doc.querySelector(".alert.alert-success, .level_reward, .reward, .panel-success .panel-body");
    const rewardTxt=(rewardNode?.textContent||"").replace(/\s+/g," ").trim();
    const mReward=rewardTxt.match(/(?:Belohnung|Reward|Level.?Up)\s*:?\s*(.+)$/i);
    const reward=(mReward&&mReward[1]?mReward[1].trim():(rewardTxt.length>0 && rewardTxt.length<120 ? rewardTxt : ""));
    const needNode=Array.from(doc.querySelectorAll(".alert")).find(el=>/benötigst\s+noch|benoetigst\s+noch|Beförderung|Befoerderung/i.test(el.textContent||""));
    const needRaw=(needNode?.textContent||"").replace(/\s+/g," ").trim();
    const mNeed=needRaw.match(/ben(?:ö|oe)tigst\s+noch\s+([\d.,]+)/i);
    const needText=mNeed?`Noch ${mNeed[1]} Credits bis zur Beförderung`:needRaw;
    const creditsFromLevel=curAbs!==null?curAbs:null;
    if(creditsFromLevel!==null){
      S.profile.totalCredits=creditsFromLevel;
      const lv=pickLevelByCredits(creditsFromLevel);
      if(!S.profile.rank || S.profile.rank==="-" || /^(level|rang)$/i.test(S.profile.rank)) S.profile.rank=lv.rank;
      S.profile.reward=lv.reward;
    } else if(rank && !/^(level|rang)$/i.test(rank)) {
      S.profile.rank=rank;
    }
    S.profile.progress=progress;
    S.profile.progressText=progressText;
    if(!S.profile.reward) S.profile.reward=reward||"";
    S.profile.needText=needText||"";
    renderProfileQuick();
    renderPlayerForecast();
    fetchPlayerRanking();
  },()=>renderProfileQuick());
}

function fetchVehicleStates(){
  apiGet(API.vStates,d=>{ S.dataCache.vehicles=d||{}; renderVehicles(d||{}); });
}

function fetchFleetVehicles(){
  apiGetPaged(API.vehicles,list=>{
    S.dataCache.vehicleList=list;
    renderFleetInsights();
  },()=>renderFleetInsights());
}

function fetchBuildings(){
  apiGetPaged(API.buildings,list=>{
    S.dataCache.buildings=list;
    renderBuildings(list);
  });
}

function fetchSchoolings(){
  apiGet(API.schoolings,data=>{
    const raw=Array.isArray(data)?data:Array.isArray(data?.result)?data.result:null;
    if(raw===null){fetchSchoolingsFromPage();return;}
    const list=raw.map(normalizeApiSchooling).filter(Boolean);
    S.dataCache.schoolings=list;
    renderSchoolings(list);
  },fetchSchoolingsFromPage);
}

function normalizeApiSchooling(item){
  if(!item||typeof item!=="object")return null;
  const id=Number(item.id)||0;
  const finishRaw=item.finish_time??item.end_time??item.finish??0;
  const finishTs=normalizeSchoolingTs(finishRaw);
  const schooling={
    id,
    caption:String(item.education_title||item.caption||item.name||"Lehrgang").trim(),
    freeSeats:String(item.open_spaces??item.free_spaces??item.available_spaces??"-"),
    cost:String(item.price??item.cost??"-"),
    finish:finishTs?formatSchoolingRemaining(finishTs):"-",
    owner:String(item.owner_name||item.user_name||item.owner||"Verband").trim(),
    url:id?`${BASE}/schoolings/${id}`:"",
    finishTs,
    dismissed:item.dismissed===true||item.finished===true||item.completed===true||item.closed===true,
    fromHtml:true,
    fromApi:true
  };
  return isActiveSchooling(schooling)?schooling:null;
}

function normalizeSchoolingTs(value){
  if(value===null||value===undefined||value==="")return 0;
  const n=Number(value);
  if(Number.isFinite(n)&&n>0)return n<1000000000000?n*1000:n;
  const parsed=Date.parse(String(value));
  return Number.isFinite(parsed)?parsed:0;
}

function isActiveSchooling(s){
  if(!s)return false;
  if(s.dismissed||s.finished||s.completed||s.closed)return false;
  const finish=String(s.finish||"").trim();
  if(/^(fertig|beendet|abgeschlossen|abgelaufen)$/i.test(finish))return false;
  if(/fertig|beendet|abgeschlossen|abgelaufen/i.test(finish)&&!/\d/.test(finish))return false;
  const finishTs=Number(s.finishTs)||0;
  if(finishTs&&finishTs<=Date.now())return false;
  return true;
}

function cleanSchoolingCellText(cell){
  if(!cell)return "";
  const clone=cell.cloneNode(true);
  clone.querySelectorAll("script,style,svg").forEach(n=>n.remove());
  return (clone.textContent||"").replace(/\s+/g," ").trim();
}

function formatSchoolingRemaining(ts){
  let end=Number(ts)||0;
  if(!end)return "";
  if(end<1000000000000)end*=1000;
  const diff=end-Date.now();
  if(diff<=0)return "Fertig";
  const d=Math.floor(diff/86400000);
  const h=Math.floor((diff%86400000)/3600000);
  const m=Math.floor((diff%3600000)/60000);
  const s=Math.floor((diff%60000)/1000);
  const p=n=>String(n).padStart(2,"0");
  const clock=`${p(h)}:${p(m)}:${p(s)}`;
  return d>0?`${d} Tage - ${clock}`:clock;
}

function readSchoolingFinish(cell,rowHtml){
  return readSchoolingFinishInfo(cell,rowHtml).finish;
}

function readSchoolingFinishInfo(cell,rowHtml){
  const visible=cleanSchoolingCellText(cell);
  const html=`${cell?.innerHTML||""} ${rowHtml||""}`;
  const m=html.match(/registerEducationTimer\(\s*["'][^"']+["']\s*,\s*["'][^"']+["']\s*,\s*(\d{10,})\s*\)/i);
  const finishTs=m?normalizeSchoolingTs(m[1]):0;
  if(finishTs)return {finish:formatSchoolingRemaining(finishTs),finishTs};
  if(visible && !/registerEducationTimer/i.test(visible))return {finish:visible,finishTs:0};
  return {finish:"-",finishTs:0};
}

function parseSchoolingsHtml(html){
  const doc=new DOMParser().parseFromString(html||"","text/html");
  const rows=Array.from(doc.querySelectorAll("tr.schooling_opened_table_searchable, table.table-striped tbody tr"));
  return rows.map(tr=>{
    const tds=Array.from(tr.querySelectorAll("td"));
    if(tds.length<4)return null;
    const link=tds[0].querySelector("a[href*='/schoolings/']");
    const caption=(cleanSchoolingCellText(link)||cleanSchoolingCellText(tds[0]));
    const href=link?.getAttribute("href")||"";
    const owner=cleanSchoolingCellText(tds[4]);
    const finishInfo=readSchoolingFinishInfo(tds[3],tr.innerHTML);
    return {
      caption,
      freeSeats:cleanSchoolingCellText(tds[1]),
      cost:cleanSchoolingCellText(tds[2]),
      finish:finishInfo.finish,
      finishTs:finishInfo.finishTs,
      owner,
      url:href?`${BASE}${href}`:"",
      fromHtml:true
    };
  }).filter(s=>s&&s.caption&&isActiveSchooling(s));
}

function fetchSchoolingsFromPage(){
  pageGet(API.schoolingsPage,html=>{
    const list=parseSchoolingsHtml(html);
    S.dataCache.schoolings=list;
    renderSchoolings(list);
  },()=>{S.dataCache.schoolings=[];renderSchoolings([]);});
}

function fetchVehicleDistances(){
  apiGet(API.vDistances,d=>{
    const arr=(d&&d.result)?d.result:[];
    renderDistances(arr);
  });
}

function fetchAAOs(){
  apiGet(API.aaos,list=>{ S.dataCache.aaos=Array.isArray(list)?list:apiArray(list,"aaos"); renderAAOs(S.dataCache.aaos); });
}

function fetchAnalysisMeta(){
  apiGet(API.aaoCategories,data=>{S.dataCache.aaoCategories=apiArray(data,"aao_categories","categories");renderAAOs(S.dataCache.aaos||[]);},()=>{});
  apiGetPaged(API.pois,list=>{S.dataCache.pois=list;renderFleetInsights();},()=>renderFleetInsights(),{keys:["pois"]});
  apiGet(API.missionTypes,data=>{S.dataCache.missionTypes=data||null;renderFleetInsights();},()=>renderFleetInsights());
  jsonGet(API.missionsJson,data=>{S.dataCache.missions=apiArray(data,"missions","result");rebuildMissionMetaIndex();renderFleetInsights();scheduleMissionEarningsRender(true);},()=>{renderFleetInsights();scheduleMissionEarningsRender(true);});
  jsonGet(API.allianceEventTypes,data=>{S.dataCache.allianceEventTypes=apiArray(data,"alliance_event_types","events","result");renderFleetInsights();},()=>renderFleetInsights());
  S.dataCache.lastMetaTs=Date.now();
}

function fetchAllData(){
  fetchAlliance(); fetchUserinfo(); fetchVehicleStates(); fetchBuildings(); fetchFleetVehicles();
  fetchSchoolings(); fetchAAOs(); fetchAnalysisMeta();
  fetchDailyEarnFromOverview();
  fetchWeather();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” OVERVIEW TAB                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderOverview(d){
  const domAllianceId=readAllianceIdFromDom();
  const apiAllianceId=Number(d.id)||null;
  const finalAllianceId=apiAllianceId || domAllianceId || null;
  const name=d.name||"Unbekannt";
  S.allianceId=finalAllianceId;
  S.allianceName=String(name||"").trim();
  S.allianceRank=d.rank||null;
  S.allianceCredits=d.credits_total||0;
  const allianceHref=finalAllianceId?`${BASE}/alliances/${encodeURIComponent(finalAllianceId)}`:`${BASE}/alliances`;
  const link=`<a href="${allianceHref}" target="_blank" rel="noopener">${escHtml(name)}</a>`;
  if($("#sv-alliname").length)setH("#sv-alliname",link);
  setV("#sv-total",   fmtMoney(d.credits_total||0));
  setV("#sv-kasse",   fmtMoney(d.credits_current||0));
  setV("#sv-members", d.user_count||0);
  setV("#sv-rank",    d.rank||"-");
  setV("#sv-alliance-daily",fmtMoney(allianceEarnToday()));
  setH("#overview-command-title",`${link}<span class="overview-title-suffix">im Überblick</span>`);
  $("#overview-command-sub").text(`Platz ${d.rank||"-"} · ${fmt(d.user_count||0)} Mitglieder · ${fmtMoney(d.credits_total||0)} Gesamtcredits · ${fmtMoney(d.credits_current||0)} in der Verbandskasse`);
  renderAllianceDailyBoard();
  renderForecast();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” VEHICLES TAB                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderVehicles(data){
  const total=Object.values(data).reduce((s,v)=>s+(v||0),0);
  S.vehicleTotal=total;
  renderVehicleAssetSummary();
  drawDonut(data);
  const leg=$("#donut-leg").empty();
  const bars=$("#lss7-vbars").empty();
  if(!total){leg.html(`<div class="lss7-empty">Keine Fahrzeugdaten.</div>`);return;}

  const ready=(data[2]||0)+(data[1]||0)+(data[7]||0);
  const active=(data[4]||0)+(data[3]||0)+(data[9]||0);
  const attention=(data[5]||0)+(data[6]||0);
  const coverage=total?Math.round(ready/total*100):0;
  $("#fleet-status-kpis").html(`
    <div class="fleet-status-kpi ready"><b>${fmt(ready)}</b><span>Einsatzbereit</span></div>
    <div class="fleet-status-kpi active"><b>${fmt(active)}</b><span>Gebunden / im Einsatz</span></div>
    <div class="fleet-status-kpi attention"><b>${fmt(attention)}</b><span>Prüfung erforderlich</span></div>
    <div class="fleet-status-kpi coverage"><b>${coverage}%</b><span>Bereitschaftsquote</span></div>`);

  const keys=VSTATUS_ORDER.filter(k=>Object.prototype.hasOwnProperty.call(VSTATUS,k));

  keys.forEach(k=>{
    const {l,c}=VSTATUS[k],cnt=data[k]||0,pct=Math.round(cnt/total*100);
    leg.append(`<div class="dl-row">
      <div class="dl-dot" style="background:${c}"></div>
      <span class="dl-lbl">${l}</span>
      <span class="dl-pct">${pct}%</span>
      <span class="dl-val">${cnt}</span></div>`);
    bars.append(`<div class="vb-row${VSTATUS_ORDER.indexOf(k)<4?" primary":""}">
      <div class="vb-dot" style="background:${c}"></div>
      <span class="vb-lbl">${l}</span>
      <div class="vb-bg"><div class="vb-fill${cnt?"":" is-zero"}" style="width:${cnt?pct:0}%;background:${c}"></div></div>
      <span class="vb-num">${fmt(cnt)} · ${pct}%</span></div>`);
  });

  bars.append(`<div class="vb-total">
    <span>Fahrzeuge gesamt</span>
    <span class="vb-tv">${total}</span></div>`);
  renderFleetInsights();
}

function renderVehicleAssetSummary(){
  setV("#veh-total-count",fmt(S.vehicleTotal||0));
  setV("#veh-building-count",fmt(S.buildingTotal||0));
  setV("#veh-building-types",fmt(S.buildingTypes||0));
  const ratio=S.buildingTotal>0?(S.vehicleTotal/S.buildingTotal).toFixed(1).replace(".",","):"-";
  setV("#veh-per-building",ratio);
}

function renderFleetInsights(){
  const board=$("#fleet-quality-board");
  if(!board.length)return;
  const buildings=Array.isArray(S.dataCache.buildings)?S.dataCache.buildings:[];
  const vehicles=Array.isArray(S.dataCache.vehicleList)?S.dataCache.vehicleList:[];
  const vehicleByBuilding={};
  vehicles.forEach(v=>{
    const bid=String(v?.building_id??v?.buildingId??"");
    if(bid)vehicleByBuilding[bid]=(vehicleByBuilding[bid]||0)+1;
  });
  const operationalBuildings=buildings.filter(b=>b?.enabled!==false);
  const ignoredEmptyTypes=new Set([1,3,4,7,8,10]);
  const noVehicles=vehicles.length?operationalBuildings.filter(b=>!ignoredEmptyTypes.has(Number(b?.building_type)||0)&&!(vehicleByBuilding[String(b?.id)]||0)).length:null;
  const noPersonnel=buildings.filter(b=>Number(b?.personal_count||0)<=0&&!ignoredEmptyTypes.has(Number(b?.building_type)||0)).length;
  const understaffed=buildings.filter(b=>Number(b?.personal_count_target||0)>0&&Number(b?.personal_count||0)<Number(b?.personal_count_target||0)).length;
  const disabled=buildings.filter(b=>b?.enabled===false).length;
  const pendingExt=buildings.reduce((sum,b)=>sum+(Array.isArray(b?.extensions)?b.extensions.filter(e=>e?.available===false).length:0),0);
  const disabledExt=buildings.reduce((sum,b)=>sum+(Array.isArray(b?.extensions)?b.extensions.filter(e=>e?.available===true&&e?.enabled===false).length:0),0);
  const checks=[
    {label:"Standorte ohne Fahrzeug",value:noVehicles===null?"lade...":fmt(noVehicles),level:noVehicles>0?"warn":"good",note:"ohne Schulen, Krankenhaeuser und Leitstellen"},
    {label:"Standorte ohne Personal",value:fmt(noPersonnel),level:noPersonnel>0?"warn":"good",note:"operativer Personalcheck"},
    {label:"Unter Personal-Soll",value:fmt(understaffed),level:understaffed>0?"warn":"good",note:"personal_count < personal_count_target"},
    {label:"Deaktivierte Standorte",value:fmt(disabled),level:disabled>0?"warn":"good",note:"enabled=false"},
    {label:"Ausbauten im Bau",value:fmt(pendingExt),level:pendingExt>0?"info":"good",note:"noch nicht verfuegbar"},
    {label:"Ausbauten deaktiviert",value:fmt(disabledExt),level:disabledExt>0?"warn":"good",note:"gebaut, aber nicht aktiv"}
  ];
  board.html(checks.map(c=>`<div class="quality-card ${c.level}"><span class="quality-label">${escHtml(c.label)}</span><b>${escHtml(c.value)}</b><span class="quality-note">${escHtml(c.note)}</span></div>`).join(""));

  const typeBoard=$("#fleet-type-board").empty();
  if(vehicles.length){
    const types={};
    vehicles.forEach(v=>{
      const type=String(v?.vehicle_type_caption||v?.caption||v?.vehicle_type||v?.vehicle_type_id||"Unbekannt");
      types[type]=(types[type]||0)+1;
    });
    const top=Object.entries(types).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"de")).slice(0,12);
    const max=Math.max(...top.map(x=>x[1]),1);
    typeBoard.html(top.map(([name,count])=>`<div class="fleet-type-row"><span>${escHtml(name)}</span><i><em style="width:${Math.max(5,Math.round(count/max*100))}%"></em></i><b>${fmt(count)}</b></div>`).join(""));
  }else{
    typeBoard.html(`<div class="lss7-empty">Fahrzeugtypen werden geladen...</div>`);
  }

  const missionCount=Array.isArray(S.dataCache.missions)?S.dataCache.missions.length:0;
  const missionTypeCount=S.dataCache.missionTypes&&typeof S.dataCache.missionTypes==="object"?Object.keys(S.dataCache.missionTypes).length:0;
  const apiCards=[
    ["POIs",Array.isArray(S.dataCache.pois)?S.dataCache.pois.length:0,"/api/v2/pois"],
    ["Einsatzdaten",missionTypeCount||missionCount,"mission_type_data / einsaetze.json"],
    ["Verbandsevents",Array.isArray(S.dataCache.allianceEventTypes)?S.dataCache.allianceEventTypes.length:0,"alliance_event_types.json"],
    ["AAO-Kategorien",Array.isArray(S.dataCache.aaoCategories)?S.dataCache.aaoCategories.length:0,"/api/v1/aao_categories"]
  ];
  $("#fleet-api-board").html(apiCards.map(([label,value,note])=>`<div class="quality-card info"><span class="quality-label">${escHtml(label)}</span><b>${fmt(value)}</b><span class="quality-note">${escHtml(note)}</span></div>`).join(""));
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” BUILDINGS TAB                                      â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderBuildings(list){
  const cont=$("#lss7-bld").empty();
  S.buildingTotal=list.length;
  S.buildingTypes=new Set(list.map(b=>Number(b?.building_type)||0)).size;
  renderVehicleAssetSummary();
  setV("#sv-bld-total", list.length);
  if(!cont.length)return;
  if(!list.length){cont.html(`<div class="lss7-empty">Keine Gebäudedaten.</div>`);return;}

  const groups={};
  const extensions={};
  let personnel=0,personnelTarget=0,cells=0,builtExtensions=0,enabledExtensions=0,pendingExtensions=0,storageUpgrades=0;
  let enabledLocations=0,missionGenerators=0,automaticHiring=0,activeSpecializations=0,sharedLocations=0,dispatchAssigned=0,smallLocations=0,totalLevels=0;
  const dispatchCenters=new Set();

  list.forEach(b=>{
    const type=Number(b?.building_type)||0;
    const extList=Array.isArray(b?.extensions)?b.extensions:[];
    const storage=Array.isArray(b?.storage_upgrades)?b.storage_upgrades:[];
    const built=extList.filter(e=>e?.available===true);
    const enabled=built.filter(e=>e?.enabled!==false);
    const pending=extList.filter(e=>e?.available===false);
    const typeCells=(type===16?1:0)+built.reduce((sum,e)=>{
      const caption=String(e?.caption||"").toLowerCase();
      if(caption.includes("großgewahrsam"))return sum+10;
      if(caption.includes("zelle"))return sum+1;
      return sum;
    },0);

    if(!groups[type])groups[type]={
      type,name:BUILDING_TYPES[type]||`Gebäudetyp ${type}`,count:0,personnel:0,levels:0,
      target:0,built:0,enabled:0,pending:0,cells:0,operational:0,missions:0,specializations:0
    };
    const g=groups[type];
    const personal=Number(b?.personal_count)||0;
    const target=Math.max(0,Number(b?.personal_count_target)||0);
    const level=Math.max(0,Number(b?.level)||0);
    const operational=b?.enabled!==false;
    const ownMissions=b?.generate_own_missions===true;
    const hiringAuto=b?.hiring_automatic===true;
    const specialization=b?.specialization?.active===true;
    const dispatchId=Number(b?.leitstelle_building_id)||0;
    g.count++;
    g.personnel+=personal;
    g.target+=target;
    g.levels+=level;
    g.built+=built.length;
    g.enabled+=enabled.length;
    g.pending+=pending.length;
    g.cells+=typeCells;
    if(operational)g.operational++;
    if(ownMissions)g.missions++;
    if(specialization)g.specializations++;

    personnel+=personal;
    personnelTarget+=target;
    totalLevels+=level;
    cells+=typeCells;
    builtExtensions+=built.length;
    enabledExtensions+=enabled.length;
    pendingExtensions+=pending.length;
    storageUpgrades+=storage.filter(s=>s?.available===true).length;
    if(operational)enabledLocations++;
    if(ownMissions)missionGenerators++;
    if(hiringAuto)automaticHiring++;
    if(specialization)activeSpecializations++;
    if(b?.is_alliance_shared===true)sharedLocations++;
    if(b?.small_building===true)smallLocations++;
    if(dispatchId>0){dispatchAssigned++;dispatchCenters.add(dispatchId);}

    extList.forEach(e=>{
      const name=String(e?.caption||"Unbenannter Ausbau").trim()||"Unbenannter Ausbau";
      if(!extensions[name])extensions[name]={name,total:0,built:0,enabled:0,pending:0};
      const x=extensions[name];
      x.total++;
      if(e?.available===true){x.built++;if(e?.enabled!==false)x.enabled++;}
      else x.pending++;
    });
  });

  const sorted=Object.values(groups).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name,"de"));
  const maxCategory=Math.max(...BUILDING_CATEGORIES.map(category=>category.types.reduce((sum,type)=>sum+(groups[type]?.count||0),0)),1);
  const categoryCards=BUILDING_CATEGORIES.map(category=>{
    const count=category.types.reduce((sum,type)=>sum+(groups[type]?.count||0),0);
    return count?`<div class="building-category-card" style="--cat:${category.color}">
      <span class="building-category-name">${category.name}</span><span class="building-category-count">${fmt(count)}</span><span class="building-category-bar"><i style="width:${Math.max(5,Math.round(count/maxCategory*100))}%"></i></span>
    </div>`:"";
  }).join("");
  const knownTypes=new Set(BUILDING_CATEGORIES.flatMap(category=>category.types));
  const otherCount=sorted.filter(g=>!knownTypes.has(g.type)).reduce((sum,g)=>sum+g.count,0);
  const personnelCoverage=personnelTarget>0?Math.round(personnel/personnelTarget*100):null;
  const operationalRate=list.length?Math.round(enabledLocations/list.length*100):0;

  cont.append(`<div class="asset-subhead"><span>Standortbetrieb</span><span>${fmt(list.length)} Standorte · ${operationalRate}% aktiv</span></div>`);
  cont.append(`<div class="asset-kpis asset-kpis-pro">
    <div class="asset-kpi pro"><span class="asset-kpi-label">Personal</span><span class="asset-kpi-value">${fmt(personnel)}</span><span class="asset-kpi-note">Soll: ${personnelTarget?fmt(personnelTarget):"nicht hinterlegt"}${personnelCoverage!==null?` · ${personnelCoverage}%`:""}</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Aktive Standorte</span><span class="asset-kpi-value">${fmt(enabledLocations)}</span><span class="asset-kpi-note">${operationalRate}% des Bestands</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Eigene Einsätze</span><span class="asset-kpi-value">${fmt(missionGenerators)}</span><span class="asset-kpi-note">Standorte mit Einsatzgenerierung</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Automatische Werbung</span><span class="asset-kpi-value">${fmt(automaticHiring)}</span><span class="asset-kpi-note">Personalgewinnung aktiv</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Spezialisierungen</span><span class="asset-kpi-value">${fmt(activeSpecializations)}</span><span class="asset-kpi-note">Aktive Fachausrichtungen</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Leitstellenbindung</span><span class="asset-kpi-value">${fmt(dispatchAssigned)}</span><span class="asset-kpi-note">an ${fmt(dispatchCenters.size)} Leitstellen zugeordnet</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Ausbauten</span><span class="asset-kpi-value">${fmt(enabledExtensions)} / ${fmt(builtExtensions)}</span><span class="asset-kpi-note">aktiv / gebaut · ${fmt(pendingExtensions)} im Bau</span></div>
    <div class="asset-kpi pro"><span class="asset-kpi-label">Weitere Kapazitäten</span><span class="asset-kpi-value">${fmt(cells)} Zellen</span><span class="asset-kpi-note">${fmt(storageUpgrades)} Lager · ${fmt(smallLocations)} Kleinwachen · ${fmt(sharedLocations)} geteilt</span></div>
  </div>`);
  cont.append(`<div class="asset-subhead"><span>Organisationen</span><span>Ø Ausbaustufe ${(totalLevels/list.length).toFixed(1).replace(".",",")}</span></div>`);
  cont.append(`<div class="building-category-grid">${categoryCards}${otherCount?`<div class="building-category-card" style="--cat:#94a3b8"><span class="building-category-name">Weitere</span><span class="building-category-count">${fmt(otherCount)}</span><span class="building-category-bar"><i style="width:${Math.max(5,Math.round(otherCount/maxCategory*100))}%"></i></span></div>`:""}</div>`);
  cont.append(`<div class="asset-subhead"><span>Standorte nach Typ</span><span>${sorted.length} Typen · Betriebs- und Personalstatus</span></div>`);

  const cellTypes=new Set([6,16,19,29]);
  const typeRows=sorted.map(g=>{
    const coverage=g.target>0?`${Math.round(g.personnel/g.target*100)}%`:"-";
    return `<div class="building-detail-row">
    <span class="building-detail-name" title="${escHtml(g.name)}">${escHtml(g.name)}</span>
    <span class="building-detail-stat"><small>Standorte</small>${fmt(g.count)}</span>
    <span class="building-detail-stat"><small>Personal</small>${fmt(g.personnel)}</span>
    <span class="building-detail-stat"><small>Abdeckung</small>${coverage}</span>
    <span class="building-detail-stat"><small>Ausbau</small>${fmt(g.enabled)} / ${fmt(g.built)}</span>
    <span class="building-detail-stat"><small>${cellTypes.has(g.type)?"Zellen":"Betrieb"}</small>${cellTypes.has(g.type)?fmt(g.cells):`${fmt(g.operational)}/${fmt(g.count)}`}</span>
  </div>`;
  }).join("");
  cont.append(`<div>${typeRows}</div>`);

  const extensionRows=Object.values(extensions)
    .sort((a,b)=>b.built-a.built||b.total-a.total||a.name.localeCompare(b.name,"de"))
    .map(x=>`<div class="extension-row" title="${x.pending?`${x.pending} Ausbau/Ausbauten im Bau`:""}">
      <span class="extension-name">${escHtml(x.name)}</span>
      <span class="extension-count"><em>${fmt(x.enabled)} aktiv</em> / ${fmt(x.built)} gebaut${x.pending?` / ${fmt(x.pending)} im Bau`:""}</span>
      <span class="extension-progress"><i style="width:${x.total?Math.round(x.enabled/x.total*100):0}%"></i></span>
    </div>`).join("");
  cont.append(`<div class="asset-subhead"><span>Ausbauten im Detail</span><span>${Object.keys(extensions).length} Arten</span></div>`);
  cont.append(extensionRows?`<div class="extension-list">${extensionRows}</div>`:`<div class="lss7-empty">Keine Ausbauten vorhanden.</div>`);
  renderFleetInsights();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” SCHOOLINGS TAB                                     â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderSchoolings(list){
  const cont=$("#lss7-sch").empty();
  const running=list.filter(isActiveSchooling);
  if(!running.length){cont.html(`<div class="lss7-empty">Keine laufenden Lehrgänge.</div>`);return;}

  const grp={};
  running.forEach(s=>{const k=s.caption||s.name||"Unbekannter Lehrgang";grp[k]=(grp[k]||0)+1;});

  const sg=$(`<div class="sg sg2" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">Aktive Lehrgänge</span><span class="sv c-cy">${running.length}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Lehrgangsarten</span><span class="sv">${Object.keys(grp).length}</span></div>`);
  cont.append(sg);
  cont.append(`<div class="schooling-toolbar">
    <input id="schooling-search" class="lss7-select" type="search" placeholder="${tr("Lehrgänge durchsuchen...")}">
    <select id="schooling-filter" class="lss7-select"><option value="all">${tr("Alle Lehrgänge")}</option><option value="free">${tr("Freie Plätze")}</option></select>
    <button id="schooling-refresh" class="lbtn prime" type="button">Aktualisieren</button>
  </div>`);

  const listDiv=$(`<div></div>`);
  if(running.some(s=>s.fromHtml)){
    listDiv.append(`<div class="sort-hdr" style="grid-template-columns:minmax(0,1fr) 58px 92px 96px 72px">
      <span>${tr("Lehrgang")}</span><span style="text-align:right">${tr("Plätze")}</span><span style="text-align:right">${tr("Kosten")}</span><span style="text-align:right">${tr("Fertig")}</span><span></span>
    </div>`);
    running.forEach(s=>{
      const rawName=String(s.caption||"Unbekannter Lehrgang");
      const name=escHtml(rawName);
      const owner=escHtml(s.owner||"");
      const cost=escHtml((s.cost||"-").replace(/\s*\(Tag\/Teilnehmer\)/i,""));
      const seatsNumber=Number(String(s.freeSeats||"").match(/\d+/)?.[0]||0);
      const action=s.url?`<a class="sch-open" href="${escHtml(s.url)}" target="_blank" rel="noopener">${tr("Öffnen")}</a>`:`<span></span>`;
      listDiv.append(`<div class="sch-row" data-name="${escHtml(rawName.toLowerCase())}" data-free="${seatsNumber>0?"1":"0"}">
        <span class="sch-name">${name}${owner?`<span class="sch-sub">${owner}</span>`:""}</span>
        <span class="sch-seats">${escHtml(s.freeSeats||"-")}</span>
        <span class="sch-cost">${cost}</span>
        <span class="sch-finish">${escHtml(s.finish||"-")}</span>
        ${action}
      </div>`);
    });
  }else{
    Object.entries(grp).sort((a,b)=>b[1]-a[1]).forEach(([name,cnt])=>{
      listDiv.append(`<div class="lrow sch-row" data-name="${escHtml(name.toLowerCase())}" data-free="0">
        <span class="lrow-icon">Lg</span>
        <span class="lrow-name">${escHtml(name)}</span>
        <span class="lrow-val">${cnt}x</span></div>`);
    });
  }
  cont.append(listDiv).append(`<div class="lss7-empty schooling-empty-filter" style="display:none">Keine passenden Lehrgänge gefunden.</div>`);
  applyTranslations(cont.get(0));
}

function filterSchoolingRows(){
  const q=String($("#schooling-search").val()||"").trim().toLowerCase();
  const filter=String($("#schooling-filter").val()||"all");
  let visible=0;
  $("#lss7-sch .sch-row").each(function(){
    const row=$(this);
    const show=(!q||String(row.data("name")||"").includes(q))&&(filter!=="free"||String(row.data("free"))==="1");
    row.toggleClass("is-hidden",!show);if(show)visible++;
  });
  $("#lss7-sch .schooling-empty-filter").toggle(visible===0);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” DISTANCES TAB                                      â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderDistances(arr){
  const cont=$("#lss7-km").empty();
  if(!arr.length){cont.html(`<div class="lss7-empty">Keine Kilometerdaten.</div>`);return;}

  const sorted=[...arr].sort((a,b)=>(b.distance_km||0)-(a.distance_km||0));
  const totalKm=sorted.reduce((s,v)=>s+(v.distance_km||0),0);
  const total30=sorted.reduce((s,v)=>s+(v.distance_km_30d||0),0);

  const sg=$(`<div class="sg sg2" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">Gesamte Kilometer</span><span class="sv c-gr">${fmtKm(totalKm)}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Letzte 30 Tage</span><span class="sv c-bl">${fmtKm(total30)}</span></div>`);
  cont.append(sg);

  const hdr=$(`<div class="sort-hdr" style="grid-template-columns:1fr 80px 70px">
    <span>Fahrzeug</span><span style="text-align:right">Gesamt</span><span style="text-align:right">30 Tage</span>
  </div>`);
  cont.append(hdr);

  const listDiv=$(`<div></div>`);
  sorted.slice(0,30).forEach(v=>{
    listDiv.append(`<div class="km-row">
      <span class="km-name">Fzg. #${v.vehicle_id}</span>
      <span class="km-total">${fmtKm(v.distance_km||0)}</span>
      <span class="km-30d">${fmtKm(v.distance_km_30d||0)}</span>
    </div>`);
  });
  if(sorted.length>30) listDiv.append(`<div class="lss7-empty" style="padding:8px 14px">+${sorted.length-30} weitere Fahrzeuge</div>`);
  cont.append(listDiv);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” AAO TAB                                            â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderAAOs(list){
  const cont=$("#lss7-aao").empty();
  if(!list.length){cont.html(`<div class="lss7-empty">Keine AAOs gefunden.</div>`);return;}

  S.dataCache.aaos=list;
  const categories=Array.isArray(S.dataCache.aaoCategories)?S.dataCache.aaoCategories:[];
  const catMap=Object.fromEntries(categories.map(c=>[String(c.id??c.aao_category_id??""),String(c.caption||c.name||`Kategorie ${c.id}`)]));
  const sg=$(`<div class="sg sg2" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">AAOs gesamt</span><span class="sv c-pu">${list.length}</span></div>`);
  const withHk=list.filter(a=>a.hotkey).length;
  sg.append(`<div class="sc"><span class="sl">Mit Hotkey</span><span class="sv">${withHk}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Ohne Hotkey</span><span class="sv c-am">${list.length-withHk}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Kategorien</span><span class="sv c-bl">${categories.length||new Set(list.map(a=>a.aao_category_id||a.category_id||"")).size}</span></div>`);
  cont.append(sg);

  const byCat={};
  list.forEach(a=>{
    const cid=String(a.aao_category_id||a.category_id||"");
    const label=catMap[cid]||cid||"Ohne Kategorie";
    byCat[label]=(byCat[label]||0)+1;
  });
  const catRows=Object.entries(byCat).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],"de"));
  cont.append(`<div class="asset-subhead"><span>AAO-Kategorien</span><span>${catRows.length} Gruppen</span></div>`);
  cont.append(`<div class="fleet-type-board aao-category-board">${catRows.slice(0,12).map(([name,count])=>`<div class="fleet-type-row"><span>${escHtml(name)}</span><i><em style="width:${Math.max(5,Math.round(count/list.length*100))}%"></em></i><b>${fmt(count)}</b></div>`).join("")}</div>`);
  cont.append(`<div class="asset-subhead"><span>AAO-Liste</span><span>sortiert nach Kategorie und Name</span></div>`);
  const sorted=[...list].sort((a,b)=>(a.column||0)-(b.column||0)||(a.caption||"").localeCompare(b.caption||""));
  sorted.forEach(a=>{
    const col=a.color||"#6b7280";
    const hk=a.hotkey?`<span class="arr-hk">${a.hotkey}</span>`:"";
    cont.append(`<div class="arr-row">
      <div class="arr-color" style="background:${col}"></div>
      <span class="arr-name">${a.caption||"-"}<small>${escHtml(catMap[String(a.aao_category_id||a.category_id||"")]||"")}</small></span>
      ${hk}
    </div>`);
  });
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” HISTORY TAB                                        â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderHistTab(){
  const cont=$("#lss7-hist").empty();
  setV("#sv-hist-cnt",S.creditHist.length);
  if(!S.creditHist.length){cont.html(`<div class="lss7-empty">Noch keine Verlaufsdaten.</div>`);applyTranslations(cont.get(0));return;}

  const h=[...S.creditHist].reverse();

  const hdr=$(`<div class="sort-hdr" style="grid-template-columns:54px 1fr 80px">
    <span>Zeit</span><span>Credits</span><span style="text-align:right">Aenderung</span>
  </div>`);
  cont.append(hdr);

  h.forEach((p,i)=>{
    const prev=h[i+1];
    const diff=prev?p.v-prev.v:0;
    const sign=diff>0?"+":"";
    const col=diff>0?"var(--green)":diff<0?"var(--red)":"var(--t4)";
    cont.append(`<div class="hist-row">
      <span class="hist-t">${fmtShortTime(p.ts)}</span>
      <span class="hist-v">${fmt(p.v)} Cr</span>
      <span class="hist-d" style="color:${col}">${diff!==0?sign+fmt(diff):""}</span>
    </div>`);
  });
  applyTranslations(cont.get(0));
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” TEAM TAB                                           â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function parseTeamMemberPageDetails(html){
  const doc=new DOMParser().parseFromString(html||"","text/html");
  const details={};
  const detailsByName={};
  doc.querySelectorAll("img.online_icon,.online_icon").forEach(icon=>{
    const activity=parseTeamOnlineIcon(icon);
    const rawName=(icon.getAttribute("title")||icon.getAttribute("alt")||"").match(/^(.+?)\s+ist\s+/i)?.[1]||"";
    const key=normalizeTxt(rawName);
    if(key&&activity)detailsByName[key]={name:rawName,activity,lastOnlineRaw:activity.hint||"",online:activity.cls==="online",ts:Date.now()};
  });
  doc.querySelectorAll("tr").forEach(row=>{
    const link=row.querySelector("a[href*='/profile/']");
    const href=link?.getAttribute("href")||"";
    const rightsBox=row.querySelector('[id^="rights_"]');
    const id=String(
      href.match(/\/profile\/(\d+)/)?.[1] ||
      row.querySelector("[user_id]")?.getAttribute("user_id") ||
      rightsBox?.id?.match(/rights_(\d+)/)?.[1] ||
      ""
    );
    if(!id)return;
    const onlineIcon=row.querySelector("img.online_icon,.online_icon");
    const activity=parseTeamOnlineIcon(onlineIcon);
    const cells=Array.from(row.querySelectorAll("td")).map(td=>(td.textContent||"").replace(/\s+/g," ").trim()).filter(Boolean);
    const iconName=(onlineIcon?.getAttribute("title")||onlineIcon?.getAttribute("alt")||"").match(/^(.+?)\s+ist\s+/i)?.[1]||"";
    const name=(link?.textContent||iconName||cells[0]||"").replace(/\s+/g," ").trim();
    const creditsCell=cells.find(txt=>/verdiente Credits|Credits/i.test(txt)&&/[\d.]/.test(txt));
    const credits=parseCreditsValue(creditsCell);
    const gradeCell=cells.find(txt=>LEVELS.some(lv=>txt.includes(lv.rank)))||"";
    const toplistCell=cells.find(txt=>/^#?\d+$/.test(txt));
    details[id]={name};
    if(activity){
      details[id].activity=activity;
      details[id].lastOnlineRaw=activity.hint||"";
      details[id].online=activity.cls==="online";
    }
    if(credits!==null)details[id].credits=credits;
    if(gradeCell)details[id].rank=gradeCell.replace(/\s+/g," ").trim();
    if(toplistCell)details[id].toplistRank=parseInt(toplistCell.replace(/[^\d]/g,""),10)||null;
  });
  Object.entries(details).forEach(([id,detail])=>{
    S.teamAdmin.details[id]={...(S.teamAdmin.details[id]||{}),...detail,ts:Date.now()};
  });
  S.teamAdmin.detailsByName={...(S.teamAdmin.detailsByName||{}),...detailsByName};
}
function teamCreditsFromUser(user){
  const keys=["credits_earned","credits","earned_credits","creditsTotal","credits_total"];
  for(const key of keys){
    const n=parseCreditsValue(user?.[key]);
    if(n!==null)return n;
  }
  return null;
}
function parseTeamDate(raw){
  if(!raw)return null;
  if(typeof raw==="number"&&raw>0)return raw<1000000000000?raw*1000:raw;
  const text=String(raw).trim();
  if(!text)return null;
  const iso=Date.parse(text);
  if(Number.isFinite(iso))return iso;
  const rel=text.match(/(\d+)\s*(Minute|Minuten|Stunde|Stunden|Tag|Tage|Woche|Wochen|Monat|Monate)/i);
  if(rel){
    const n=Number(rel[1])||0;
    const unit=rel[2].toLowerCase();
    const mult=unit.startsWith("minute")?60000:unit.startsWith("stunde")?3600000:unit.startsWith("tag")?86400000:unit.startsWith("woche")?604800000:2592000000;
    return Date.now()-n*mult;
  }
  return null;
}
function parseTeamOnlineIcon(icon){
  if(!icon)return null;
  const src=String(icon.getAttribute("src")||"").toLowerCase();
  const title=String(icon.getAttribute("title")||icon.getAttribute("alt")||"").replace(/\s+/g," ").trim();
  const online=/ist online|online/i.test(title)&&!/offline/i.test(title);
  if(online||src.includes("user_green"))return {cls:"online",dot:"",label:title||"Online",hint:"Online",days:0};
  const lt=title.match(/offline\s*:\s*(?:<|&lt;)\s*(\d+)\s*Tage/i);
  const days=lt?Number(lt[1]):null;
  let cls="unknown",dot="",label=title||"Zuletzt online unbekannt";
  if(src.includes("user_blue"))cls="week";
  else if(src.includes("user_yellow"))cls="two-weeks";
  else if(src.includes("user_red"))cls="month";
  else if(src.includes("user_gray")||src.includes("user_grey"))cls="recent";
  if(days!==null){
    label=`${title||`Offline: < ${days} Tage`}`;
    return {cls,dot,label,hint:`Offline: < ${days} Tage`,days};
  }
  const short=title.replace(/^.*offline\s*:\s*/i,"").trim();
  return {cls,dot,label,hint:short?`Offline: ${short}`:"nicht verfügbar",days:null};
}
function teamActivityInfo(user,details){
  if(details?.activity)return details.activity;
  const online=user?.online===true||user?.online==="true"||user?.online_status==="online"||details?.online===true;
  const raw=details?.lastOnlineRaw||user?.last_online_at||user?.last_online||user?.last_seen_at||user?.last_seen||user?.online_at||"";
  if(online)return {cls:"online",dot:"",label:"Online",hint:"Online",days:0};
  const ts=parseTeamDate(raw);
  if(!ts)return {cls:"unknown",dot:"",label:"Zuletzt online unbekannt",hint:"nicht verfügbar",days:null};
  const days=Math.max(0,Math.floor((Date.now()-ts)/86400000));
  if(days<7)return {cls:"recent",dot:"",label:"Weniger als 7 Tage offline",hint:days===0?"heute":`Offline: ${days} Tage`,days};
  if(days<14)return {cls:"week",dot:"",label:"Mehr als 7 Tage offline",hint:`Offline: ${days} Tage`,days};
  if(days<30)return {cls:"two-weeks",dot:"",label:"Mehr als 14 Tage offline",hint:`Offline: ${days} Tage`,days};
  return {cls:"month",dot:"",label:"Mehr als 30 Tage offline",hint:`Offline: ${days} Tage`,days};
}
function fetchTeamMemberDetails(users,force=false){
  const admin=S.teamAdmin;
  if(admin.loading)return;
  if(!force&&admin.lastTs&&Date.now()-admin.lastTs<300000)return;
  admin.loading=true;admin.error="";
  pageGet(`${BASE}/verband/mitglieder`,html=>{
    admin.loading=false;admin.lastTs=Date.now();parseTeamMemberPageDetails(html);
    renderTeam(users||[]);
  },()=>{admin.loading=false;admin.error="Mitgliederstatus konnte nicht geladen werden.";});
}
function fetchTeamProfileDetails(id,force=false){
  const key=String(id||"");if(!key)return;
  const current=S.teamAdmin.details[key];
  if(!force&&current?.ts&&Date.now()-current.ts<43200000&&(current.rank||current.credits!==undefined))return;
  if(S.teamAdmin.detailLoading?.[key])return;
  S.teamAdmin.detailLoading={...(S.teamAdmin.detailLoading||{}),[key]:true};
  return new Promise(resolve=>pageGet(`${BASE}/profile/${encodeURIComponent(key)}`,html=>{
    delete S.teamAdmin.detailLoading[key];
    const doc=new DOMParser().parseFromString(html||"","text/html");
    const details=parseTeamProfileDetails(doc,html);
    S.teamAdmin.details[key]={...(S.teamAdmin.details[key]||{}),...details,ts:Date.now()};
    updateTeamCardDetails(key);
    resolve();
  },()=>{delete S.teamAdmin.detailLoading[key];resolve();}));
}
function hydrateTeamProfileDetails(users){
  const queue=(Array.isArray(users)?users:[])
    .map(user=>String(user.id||""))
    .filter(id=>{
      const d=S.teamAdmin.details[id];
      return id && (!d?.ts || Date.now()-d.ts>43200000 || (!d.rank&&d.credits===undefined));
    })
    .slice(0,160);
  if(!queue.length)return;
  let i=0,active=0;
  const next=()=>{
    while(active<2&&i<queue.length){
      const id=queue[i++];active++;
      Promise.resolve(fetchTeamProfileDetails(id)).finally(()=>setTimeout(()=>{active--;next();},180));
    }
  };
  setTimeout(next,800);
}
function parseTeamProfileDetails(doc,html){
  const text=(doc.body?.innerText||doc.body?.textContent||"").replace(/\s+/g," ").trim();
  const userInfo=doc.querySelector("#userinfo");
  const name=(userInfo?.querySelector("h1")?.textContent||"").replace(/\s+/g," ").replace(/^\s*[^\wÄÖÜäöüß]+/,"").trim();
  const rank=(text.match(/Dienstgrad:\s*(.+?)(?=\s+[\d.]+(?:,\d+)?\s+verdiente Credits|\s+Verband:|$)/i)?.[1]||"").trim();
  const credits=parseCreditsValue(userInfo?.getAttribute("data-credits-earned")) ?? parseCreditsValue(text.match(/([\d.]+)\s+verdiente Credits/i)?.[1]);
  const toplistRank=parseInt((text.match(/(?:Spielerplatzierung|Topliste|Platzierung)\s*:?\s*#?\s*([\d.]+)/i)?.[1]||"").replace(/\./g,""),10)||null;
  const onlineIcon=userInfo?.querySelector(".online_icon");
  const onlineTitle=onlineIcon?.getAttribute("title")||onlineIcon?.getAttribute("alt")||"";
  const online=/ist online|online/i.test(onlineTitle)&&!/offline/i.test(onlineTitle);
  const lastOnlineRaw=(text.match(/Zuletzt online:\s*(.+?)(?=\s+Dienstgrad:|\s+Verband:|$)/i)?.[1]||"").trim();
  return {name,rank,credits,toplistRank,online,lastOnlineRaw};
}
function updateTeamCardDetails(id){
  const card=$("#lss7-team .team-card").filter((_,el)=>String(el.getAttribute("data-user-id")||"")===String(id));
  if(!card.length)return;
  const stored=S.teamAdmin.users?.[String(id)]?.user||{};
  const byName=S.teamAdmin.detailsByName?.[normalizeTxt(stored.name||"")]||{};
  const details={...byName,...(S.teamAdmin.details[String(id)]||{})};
  if(details.rank)card.find(".team-grade").text(details.rank);
  if(details.credits!==null&&details.credits!==undefined){
    const lv=pickLevelByCredits(Number(details.credits)||0);
    if(!details.rank)card.find(".team-grade").text(lv.rank||"-");
    card.find(".team-credits").text(fmtMoney(details.credits));
  }
  if(details.toplistRank)card.find(".team-rank").text(`#${fmt(details.toplistRank)}`);
  const activity=teamActivityInfo(stored,details);
  card.find(".team-activity-dot").attr("class",`team-activity-dot ${activity.cls}`).text(activity.dot).attr("title",activity.label);
  card.find(".team-last-online").attr("class",`team-last-online ${activity.cls}`).text(activity.hint).attr("title",activity.label);
  if(activity.days!==null&&activity.days!==undefined)card.attr("data-offline-days",activity.days);
}
function renderTeam(users){
  const cont=$("#lss7-team").empty();
  if(!users.length){cont.html(`<div class="lss7-empty">Keine Mitgliederdaten.</div>`);return;}
  const roles=ALLIANCE_ROLE_DEFS;
  const rolePriority=Object.fromEntries(roles.map((role,index)=>[role.id,index]));
  rolePriority.other=roles.length;rolePriority.member=roles.length+1;
  const enriched=users.map(u=>({u,info:allianceRoleInfo(u)})).sort((a,b)=>(rolePriority[a.info.primary.id]??99)-(rolePriority[b.info.primary.id]??99)||String(a.u.name||"").localeCompare(String(b.u.name||""),uiLocale()));
  S.teamAdmin.users=Object.fromEntries(enriched.map(({u,info})=>[String(u.id),{user:u,info}]));
  const leadership=enriched.filter(x=>x.info.lead).length;
  const special=enriched.filter(x=>x.info.special).length;
  const regular=enriched.length-leadership-special;
  const onlineCount=enriched.filter(({u})=>{
    const details={...(S.teamAdmin.detailsByName?.[normalizeTxt(u.name||"")]||{}),...(S.teamAdmin.details[String(u.id)]||{})};
    return teamActivityInfo(u,details).cls==="online";
  }).length;
  cont.append(`<div class="team-command">
    <div class="team-command-copy">
      <span class="team-command-eyebrow">Mitgliederlage</span>
      <span class="team-command-title">${fmt(users.length)} Mitglieder im Verband</span>
      <span class="team-command-sub">Rollen, Aktivität, Dienstgrade, Credits und Profilzugriffe werden zu einer kompakten Mitgliederübersicht verdichtet.</span>
    </div>
    <div class="team-command-stats">
      <span><b>${fmt(onlineCount)}</b><small>online</small></span>
      <span><b>${fmt(leadership)}</b><small>Leitung</small></span>
      <span><b>${fmt(special)}</b><small>Sonderrollen</small></span>
    </div>
  </div>`);
  cont.append(`<div class="team-summary">
    <div class="team-summary-card total"><span>${tr("Mitglieder gesamt")}</span><b>${fmt(users.length)}</b></div>
    <div class="team-summary-card online"><span>Aktuell online</span><b>${fmt(onlineCount)}</b></div>
    <div class="team-summary-card lead"><span>${tr("Leitungsteam")}</span><b>${fmt(leadership)}</b></div>
    <div class="team-summary-card special"><span>${tr("Sonderrollen")}</span><b>${fmt(special)}</b></div>
    <div class="team-summary-card regular"><span>${tr("Mitglieder ohne Leitungsrolle")}</span><b>${fmt(regular)}</b></div>
  </div>`);
  cont.append(`<div class="team-toolbar">
    <input id="team-search" class="lss7-select" type="search" placeholder="${tr("Mitglied suchen...")}">
    <select id="team-filter" class="lss7-select">
      <option value="all">${tr("Alle Rollen")}</option>${roles.map(role=>`<option value="${role.id}">${escHtml(role.label)}</option>`).join("")}<option value="other">Weitere Rollen</option><option value="member">${tr("Mitglieder ohne Leitungsrolle")}</option>
    </select>
  </div>`);
  const categoryOrder=[...roles,{id:"other",label:"Weitere Rollen",color:"#5ad9e8"},{id:"member",label:"Mitglieder",color:"var(--t4)"}];
  categoryOrder.forEach(category=>{
    const members=enriched.filter(x=>x.info.primary.id===category.id);
    if(!members.length)return;
    const section=$(`<section class="team-category" data-category="${category.id}" style="--role-color:${category.color}">
      <div class="team-category-head"><span class="team-category-title"><i class="team-category-dot"></i>${escHtml(category.label)}</span><span class="team-category-count">${members.length}</span></div>
      <div class="team-grid"></div>
    </section>`);
    const grid=section.find(".team-grid");
    const cardsHtml=members.map(({u,info})=>{
      const name=String(u.name||`#${u.id}`);
      const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase().slice(0,2)||"?";
      const roleIds=(info.all.length?info.all:[info.primary]).map(role=>role.id);
      const badges=(info.all.length?info.all:[info.primary]).map(role=>`<span class="team-role team-role-${role.id}" style="--role-color:${role.color}">${escHtml(role.label)}</span>`).join("");
      const details={...(S.teamAdmin.detailsByName?.[normalizeTxt(name)]||{}),...(S.teamAdmin.details[String(u.id)]||{})};
      const credits=details.credits??teamCreditsFromUser(u);
      const level=details.rank || String(u.rank_name||u.rank_title||u.level_name||"") || (credits!==null?pickLevelByCredits(Number(credits)||0).rank:"Dienstgrad unbekannt");
      const toplist=String(details.toplistRank||u.rank||u.position||u.toplist_rank||u.place||"").replace(/[^\d]/g,"");
      const activity=teamActivityInfo(u,details);
      const inactiveDays=activity.days!==null&&activity.days!==undefined?activity.days:(activity.hint.match(/(\d+)\s*Tage/)?.[1]||"");
      const messagePath=safeSameOriginPath(`/messages/new?target=${encodeURIComponent(name)}`);
      const profilePath=safeSameOriginPath(`/profile/${encodeURIComponent(String(u.id||""))}`);
      return `<article class="team-card" data-user-id="${escHtml(u.id)}" data-name="${escHtml(name.toLowerCase())}" data-roles="${escHtml(roleIds.join(","))}" data-offline-days="${escHtml(inactiveDays)}">
        <div class="team-avatar">${escHtml(initials)}</div>
        <div class="team-main">
          <div class="team-name-row"><span class="team-activity-dot ${activity.cls}" title="${escHtml(activity.label)}">${activity.dot}</span><span class="team-name" title="${escHtml(name)}">${escHtml(name)}</span></div>
          <div class="team-badges">${badges}</div>
          <div class="team-meta-line"><span>Dienstgrad: <b class="team-grade">${escHtml(level||"-")}</b></span><span>Spielerrang: <b class="team-rank">${toplist?`#${fmt(toplist)}`:"-"}</b></span></div>
          <div class="team-meta-line"><span>Credits: <b class="team-credits">${credits!==null?fmtMoney(credits):"-"}</b></span><span>Zuletzt online: <b class="team-last-online ${activity.cls}" title="${escHtml(activity.label)}">${escHtml(activity.hint)}</b></span></div>
        </div>
        <div class="team-card-tools"><a class="team-open team-mail" href="${BASE}${escHtml(messagePath)}" title="Nachricht senden">✉</a><a class="team-open" href="${BASE}${escHtml(profilePath)}" target="_blank" rel="noopener" title="${tr("Profil öffnen")}">↗</a></div>
      </article>`;
    }).join("");
    grid.html(cardsHtml);
    cont.append(section);
  });
  cont.append(`<div class="lss7-empty team-empty-filter">Keine passenden Mitglieder gefunden.</div>`);
  applyTranslations(cont.get(0));
  fetchTeamMemberDetails(users);
  hydrateTeamProfileDetails(users);
}

function filterTeamRows(){
  const q=String($("#team-search").val()||"").trim().toLowerCase();
  const role=String($("#team-filter").val()||"all");
  let visible=0;
  $("#lss7-team .team-card").each(function(){
    const card=$(this);
    const roles=String(card.data("roles")||"").split(",");
    const show=(!q||String(card.data("name")||"").includes(q))&&(role==="all"||roles.includes(role));
    card.toggleClass("is-hidden",!show);if(show)visible++;
  });
  $("#lss7-team .team-category").each(function(){
    $(this).toggleClass("is-hidden",$(this).find(".team-card:not(.is-hidden)").length===0);
  });
  $("#lss7-team .team-empty-filter").toggle(visible===0);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  FOOTER                                                      â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function updateFooter(){ $("#lss7-upd").text(timeAgo(S.lastApiTs)); }

// Lightweight Three.js scene for the Summer 2026 header.
let summerSceneCtl=null;
function initSummerScene(){
  const canvas=document.getElementById("lss7-summer-scene");
  const panel=document.getElementById("lss7");
  const header=document.getElementById("lss7-hd");
  if(!canvas || !panel || !header || typeof THREE==="undefined") return;

  let renderer;
  try{
    renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
  }catch{
    return;
  }
  renderer.setClearColor(0x000000,0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));

  const scene=new THREE.Scene();
  const camera=new THREE.OrthographicCamera(-8,8,3,-3,.1,100);
  camera.position.z=12;
  const root=new THREE.Group();
  scene.add(root);
  const dayRoot=new THREE.Group();
  const nightRoot=new THREE.Group();
  root.add(dayRoot,nightRoot);

  const sun=new THREE.Group();
  const sunCore=new THREE.Mesh(
    new THREE.SphereGeometry(1.02,24,16),
    new THREE.MeshBasicMaterial({color:0xffc928,transparent:true,opacity:.84})
  );
  sun.add(sunCore);
  const rayGeo=new THREE.PlaneGeometry(.16,.72);
  const rayMat=new THREE.MeshBasicMaterial({color:0xffd85a,transparent:true,opacity:.72,side:THREE.DoubleSide});
  for(let i=0;i<18;i++){
    const a=(i/18)*Math.PI*2;
    const ray=new THREE.Mesh(rayGeo,rayMat);
    ray.position.set(Math.cos(a)*1.55,Math.sin(a)*1.55,-.1);
    ray.rotation.z=a-Math.PI/2;
    sun.add(ray);
  }
  dayRoot.add(sun);

  const cloudMat=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.34});
  const cloudGeo=new THREE.CircleGeometry(.62,24);
  const clouds=[];
  for(let i=0;i<2;i++){
    const cloud=new THREE.Group();
    [[-.48,0,.72],[0,.16,.92],[.52,0,.68]].forEach(([x,y,s])=>{
      const part=new THREE.Mesh(cloudGeo,cloudMat);
      part.position.set(x,y,0);part.scale.set(s,s,1);cloud.add(part);
    });
    dayRoot.add(cloud);clouds.push(cloud);
  }

  const flowerColors=[0xf56f98,0xffffff,0xffa7c0,0xffdf72,0x8edb9e];
  const flowers=[];
  const petalGeo=new THREE.CircleGeometry(.12,12);
  const centerGeo=new THREE.CircleGeometry(.095,12);
  for(let i=0;i<16;i++){
    const flower=new THREE.Group();
    const color=flowerColors[i%flowerColors.length];
    const petalMat=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.82,side:THREE.DoubleSide});
    for(let p=0;p<5;p++){
      const a=(p/5)*Math.PI*2;
      const petal=new THREE.Mesh(petalGeo,petalMat);
      petal.position.set(Math.cos(a)*.18,Math.sin(a)*.18,0);
      petal.scale.set(.78,1.35,1);petal.rotation.z=a-Math.PI/2;
      flower.add(petal);
    }
    flower.add(new THREE.Mesh(centerGeo,new THREE.MeshBasicMaterial({color:0xf3ad19,transparent:true,opacity:.78})));
    flower.userData={phase:i*.73,speed:.28+(i%5)*.04,baseY:-2.55+(i%7)*.82};
    dayRoot.add(flower);flowers.push(flower);
  }

  const moon=new THREE.Group();
  const moonGlow=new THREE.Mesh(new THREE.CircleGeometry(1.18,32),new THREE.MeshBasicMaterial({color:0xb7ccff,transparent:true,opacity:.12}));
  const moonDisc=new THREE.Mesh(new THREE.CircleGeometry(.72,32),new THREE.MeshBasicMaterial({color:0xffefb0,transparent:true,opacity:.92}));
  const moonShade=new THREE.Mesh(new THREE.CircleGeometry(.70,32),new THREE.MeshBasicMaterial({color:0x111d42,transparent:true,opacity:.98}));
  moonShade.position.set(.28,.16,.02);moon.add(moonGlow,moonDisc,moonShade);nightRoot.add(moon);

  const starCount=190;
  const starPositions=new Float32Array(starCount*3);
  for(let i=0;i<starCount;i++){
    starPositions[i*3]=(Math.random()-.5)*18;
    starPositions[i*3+1]=(Math.random()-.5)*6;
    starPositions[i*3+2]=-1-Math.random()*2;
  }
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute("position",new THREE.BufferAttribute(starPositions,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xdceaff,size:1.7,transparent:true,opacity:.82,sizeAttenuation:false}));
  nightRoot.add(stars);

  const shootingStars=[];
  const shootingGeo=new THREE.PlaneGeometry(1.45,.035);
  for(let i=0;i<7;i++){
    const shooting=new THREE.Mesh(shootingGeo,new THREE.MeshBasicMaterial({color:0xe9f3ff,transparent:true,opacity:.0,side:THREE.DoubleSide}));
    shooting.rotation.z=-.42;
    shooting.userData={phase:i*3.7,speed:.72+i*.13};
    nightRoot.add(shooting);shootingStars.push(shooting);
  }

  let viewW=0,viewH=0,enabled=false,nightMode=false;
  const reduced=window.matchMedia?.("(prefers-reduced-motion: reduce)");
  function resize(){
    const rect=header.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width));
    const h=Math.max(1,Math.round(rect.height));
    if(w===viewW && h===viewH) return;
    viewW=w;viewH=h;renderer.setSize(w,h,false);
    const aspect=w/h;
    camera.left=-aspect*3.15;camera.right=aspect*3.15;camera.top=3.15;camera.bottom=-3.15;
    camera.updateProjectionMatrix();
    sun.position.set(camera.right-1.28,1.36,-1);
    moon.position.set(camera.right-1.25,1.18,-1);
    stars.scale.x=Math.max(1,(camera.right-camera.left)/18);
    clouds[0].position.set(camera.left+2.2,1.35,-2);
    clouds[1].position.set(camera.right-4.4,-1.25,-2);
    flowers.forEach((flower,i)=>{flower.userData.span=camera.right-camera.left+2;flower.userData.start=camera.left-1+i*flower.userData.span/flowers.length;});
  }
  function draw(ms=0){
    resize();
    const t=ms*.001;
    dayRoot.visible=!nightMode;nightRoot.visible=nightMode;
    sun.rotation.z=t*.12;
    sunCore.scale.setScalar(1+Math.sin(t*.9)*.045);
    clouds[0].position.x+=Math.sin(t*.17)*.0018;
    clouds[1].position.x-=Math.sin(t*.13)*.0014;
    flowers.forEach((flower,i)=>{
      const d=flower.userData;
      const span=d.span||16;
      flower.position.x=camera.left-1+((t*d.speed+d.phase*1.7)%1)*span;
      flower.position.y=d.baseY+Math.sin(t*(.7+d.speed)+d.phase)*.28;
      flower.rotation.z=t*(i%2?-.22:.18)+d.phase;
      const scale=.72+(i%5)*.11;flower.scale.set(scale,scale,1);
    });
    stars.material.opacity=.68+Math.sin(t*1.7)*.14;
    stars.rotation.z=Math.sin(t*.06)*.018;
    moonGlow.scale.setScalar(1+Math.sin(t*.8)*.06);
    shootingStars.forEach((shooting,i)=>{
      const d=shooting.userData;
      const cycle=(t*d.speed+d.phase)%8;
      const active=cycle<1.25;
      shooting.visible=nightMode&&active;
      shooting.material.opacity=active?Math.sin((cycle/1.25)*Math.PI)*.82:0;
      shooting.position.x=camera.right-((cycle/1.25)*(camera.right-camera.left+3));
      shooting.position.y=1.9-i*.75-(cycle/1.25)*1.6;
    });
    renderer.render(scene,camera);
  }
  function animate(ms){draw(ms);}
  function syncLoop(){
    renderer.setAnimationLoop(null);
    canvas.style.display=enabled?"block":"none";
    panel.classList.toggle("summer-webgl-ready",enabled);
    if(!enabled) return;
    draw(performance.now());
    if(!document.hidden && !reduced?.matches) renderer.setAnimationLoop(animate);
  }
  function setTheme(theme){nightMode=theme==="summer-dark";enabled=theme==="summer"||nightMode;syncLoop();}
  const resizeObserver=typeof ResizeObserver!=="undefined"?new ResizeObserver(()=>{if(enabled)draw(performance.now());}):null;
  resizeObserver?.observe(header);
  document.addEventListener("visibilitychange",syncLoop);
  reduced?.addEventListener?.("change",syncLoop);
  function dispose(){
    renderer.setAnimationLoop(null);resizeObserver?.disconnect();
    document.removeEventListener("visibilitychange",syncLoop);
    reduced?.removeEventListener?.("change",syncLoop);
    scene.traverse(obj=>{obj.geometry?.dispose?.();if(Array.isArray(obj.material))obj.material.forEach(m=>m.dispose?.());else obj.material?.dispose?.();});
    renderer.dispose();
  }
  summerSceneCtl={setTheme,dispose};
  setTheme(S.settings.panelTheme);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  BUILD UI                                                    â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildUI(){
  const panel=$(`<div id="lss7"></div>`);

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel.append(`
    <div id="lss7-hd">
      <canvas id="lss7-summer-scene" aria-hidden="true"></canvas>
      <div class="hd-row">
        <div class="hd-mark" aria-hidden="true"><span>VS</span></div>
        <div>
          <div class="hd-title">Verband Statistik Pro</div>
          <div class="hd-sub">Das Dashboard für deinen Verband!</div>
        </div>
        <div class="hd-meta">
          <div class="lss7-live" title="Live-Daten aktiv"></div>
          <div id="lss7-header-events" class="hd-events"></div>
          <span id="lss7-summer" class="bd bd-summer" style="display:${["summer","summer-dark"].includes(S.settings.panelTheme)?"inline-flex":"none"}">${S.settings.panelTheme==="summer-dark"?"SUMMER DARK 2026":"SUMMER 2026"}</span>
          <button id="lss7-col" title="Dashboard ein- oder ausklappen">Offen</button>
          <button id="lss7-x" title="Schliessen">×</button>
        </div>
      </div>
      <div id="lss7-update-note" class="lss7-update-note"><span id="lss7-update-note-text"></span><a id="lss7-update-install" class="lss7-update-install" href="${UPDATE_URL}" target="_blank" rel="noopener" style="display:none">Jetzt installieren</a><button id="lss7-update-patches" type="button">Patch-Notes ansehen</button></div>
    </div>`);

  panel.append(`
    <div class="prof-strip">
      <div class="prof-row">
        <img id="prof-av" class="prof-av" src="${S.profile.avatar||`${BASE}/images/user.png`}" alt="Profil">
        <div class="prof-meta">
          <div class="prof-top">
            <span id="prof-name" class="prof-name">${S.profile.name}</span>
          </div>
          <div class="prof-badges"><span id="prof-rank" class="prof-rank">${S.profile.rank}</span><div id="prof-roles" class="prof-roles"></div></div>
          <div class="prof-progress-row">
            <span id="prof-progress" class="prof-sub">${S.profile.progressText}</span>
            <span id="prof-next" class="prof-next"></span>
          </div>
          <div class="prof-bar"><div id="prof-fill" class="prof-fill" style="width:${S.profile.progress}%"></div></div>
          <span id="prof-reward" class="prof-reward"></span>
        </div>
        <button id="prof-placement" class="prof-placement" type="button" title="Spielerprognose und Platzierungsumfeld öffnen"><span class="prof-placement-kicker">Spielerplatzierung</span><span class="prof-placement-main"><strong>Wird ermittelt</strong><small class="prof-placement-history neutral"><span class="rank-trend-icon" aria-hidden="true">▬</span><span class="rank-trend-label">-</span></small></span><span class="prof-placement-caption">Topliste</span></button>
      </div>
      <div class="prof-subnav"><button class="prof-view-btn active" data-prof-view="summary" type="button">Profil</button><button class="prof-view-btn" data-prof-view="forecast" type="button">Spielerprognose</button></div>
      <div id="prof-forecast-panel" class="prof-forecast-panel"><div id="player-profile-forecast-view" class="player-forecast-view"></div></div>
    </div>`);

  // â”€â”€ Quick-Stats Strip (4 Zellen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel.append(`
    <div id="lss7-qs">
      <div class="qs-cell clickable" id="qs-playtime-cell" title="7-Tage-Spielzeit anzeigen">
        <span class="qs-lbl">Spielzeit</span>
        <span id="lss7-playtime" class="qs-val mono">${fmtHHMM(S.playtime)}</span>
        <div id="playtime-pop" class="pt-pop"></div>
      </div>
      <div class="qs-div" id="qs-playtime-div"></div>
      <div class="qs-cell">
        <span class="qs-lbl">Eigene Credits</span>
        <span id="qs-credits" class="qs-val" style="color:var(--green)"><span class="lspin"></span></span>
      </div>
      <div class="qs-div"></div>
      <div class="qs-cell" id="qs-coins-cell" style="display:${S.settings.coins!==false?"flex":"none"}">
        <span class="qs-lbl">Coins</span>
        <span id="qs-coins" class="qs-val" style="color:var(--purpleh)"><span class="lspin"></span></span>
      </div>
      <div class="qs-div" id="qs-coins-div" style="display:${S.settings.coins!==false?"block":"none"}"></div>
      <div class="qs-cell">
        <span class="qs-lbl">Tagesverd.</span>
        <span id="qs-daily" class="qs-val" style="color:var(--green)">${fmtMoney(S.dailyEarn)}</span>
      </div>
      <div class="qs-div"></div>
      <div class="qs-cell">
        <span class="qs-lbl">Uhrzeit</span>
        <span id="lss7-clock" class="qs-val sm qs-clock"><span class="qs-clock-time"></span><span class="qs-clock-date"></span></span>
      </div>
    </div>`);

  // â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const TABS=[
    {id:"tp-overview",  icon:"", label:"Übersicht"},
    {id:"tp-forecast",  icon:"", label:"Verbandsprognose"},
    {id:"tp-vehicles",  icon:"", label:"Fuhrpark & Standorte"},
    {id:"tp-schoolings",icon:"", label:"Lehrgänge"},
    {id:"tp-aao",       icon:"", label:"AAO"},
    {id:"tp-history",   icon:"", label:"Verlauf"},
    {id:"tp-team",      icon:"", label:"Mitglieder"},
    {id:"tp-event",     icon:"", label:"Event"},
    {id:"tp-settings",  icon:"", label:"Einstellungen"},
  ];
  const tabBar=$(`<div id="lss7-tabs"></div>`);
  TABS.forEach((t,i)=>tabBar.append(
    `<div class="ltab${i===0?" active":""}" data-tab="${t.id}">${t.icon} ${t.label}</div>`
  ));
  panel.append(tabBar);
  enableTabBarScroll(tabBar);

  // â”€â”€ Body â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const body=$(`<div id="lss7-body"></div>`);

  // TAB: Uebersicht
  const tOver=$(`<div id="tp-overview" class="lpanel active"></div>`);
  tOver.append(`
    <div class="sg sg2">
      <div class="overview-command">
        <div class="overview-command-copy">
          <span class="overview-eyebrow">Verbandslage</span>
          <span class="overview-title" id="overview-command-title">Lagebild wird geladen</span>
          <span class="overview-sub" id="overview-command-sub">Credits, Platzierung, Tagesleistung und Zielprognose werden aus den aktuellen Verbandsdaten verdichtet.</span>
        </div>
        <div class="overview-command-metrics">
          <span class="overview-pill forecast-date"><span>Voraussichtliches Zieldatum</span><b id="overview-forecast-date">-</b><small id="overview-forecast-eta">-</small></span>
          <span class="overview-pill"><span>Zielfortschritt</span><b id="overview-forecast-progress">-</b></span>
          <span class="overview-pill"><span>Ø Verband/Tag</span><b id="overview-forecast-avg">-</b></span>
          <span class="overview-pill"><span>Heute</span><b id="overview-today-earn">${fmtMoney(allianceEarnToday())}</b></span>
          <span class="overview-pill"><span>Datenbasis</span><b id="overview-quality">-</b></span>
        </div>
      </div>
      <div class="overview-section-title"><span>Verbandskennzahlen</span><small>Aktueller Stand</small></div>
      <div class="sc overview-card total">
        <span class="sl">Credits gesamt</span>
        <span class="sv c-gr" id="sv-total">-</span>
        <span class="overview-card-note">Gesamtleistung des Verbands</span>
      </div>
      <div class="sc overview-card cash">
        <span class="sl">Verbandskasse</span>
        <span class="sv c-gr" id="sv-kasse">-</span>
        <span class="overview-card-note">Aktuell verfügbare Verbandscredits</span>
      </div>
      <div class="sc overview-card rank">
        <span class="sl">Platzierung</span>
        <span class="sv c-am" id="sv-rank">-</span>
        <span id="sv-rank-next">Platzierung wird geladen...</span>
      </div>
      <div class="sc overview-card members">
        <span class="sl">Mitglieder</span>
        <span class="sv" id="sv-members">-</span>
        <span class="overview-card-note">Spieler im Verband</span>
      </div>
      <div class="overview-section-title"><span>Aktivität & Potenzial</span><small>Heute und offene Einsätze</small></div>
      <div class="sc w2 alliance-day-card" id="alliance-activity-card">
        <div class="alliance-day-head">
          <span class="sl">Tageslage Verband</span>
          <span class="alliance-activity-note"><i></i> Live-Berechnung aktiv</span>
        </div>
        <div class="alliance-day-grid">
          <span class="alliance-day-metric earnings"><small>Verbandsverdienst heute</small><b id="sv-alliance-daily">${fmtMoney(allianceEarnToday())}</b></span>
          <span class="alliance-day-metric potential">
            <small>Möglicher Verdienst aus offenen Einsätzen</small>
            <b id="mission-earn-total">0 Credits</b>
            <em id="mission-earn-note">Noch keine offenen Einsätze erkannt</em>
          </span>
        </div>
        <span class="alliance-day-foot">Der mögliche Verdienst enthält durchschnittliche Einsatzvergütungen sowie geschätzte Behandlungs- und Transporterlöse. Tatsächliche Werte können abweichen.</span>
      </div>
      <div class="overview-section-title"><span>Entwicklung & Prognose</span><small>Historie, Zieltempo und Rangumfeld</small></div>
      <div class="sc w2" id="alliance-earn-board">
        <div class="rank-mini-head">
          <span class="rank-mini-title">Verbandsverdienst 7 Tage</span>
          <span class="rank-mini-note" id="alliance-earn-note">Startet ab jetzt</span>
        </div>
        <div class="alli-earn-list" id="alliance-earn-list">
          <div class="alli-earn-empty">Noch keine Tagesdaten.</div>
        </div>
      </div>
      <div class="sc w2" id="forecast-board">
        <div class="rank-mini-head">
          <span class="rank-mini-title">Verbandsprognose</span>
          <span class="rank-mini-note forecast-beta-badge">LIVE</span>
        </div>
        <div id="forecast-overview-view"></div>
      </div>
      <div class="sc w2" id="rank-board">
        <div class="rank-mini-head">
          <span class="rank-mini-title">Platzierungsumfeld</span>
          <span class="rank-mini-note" id="rank-mini-note">Lade...</span>
        </div>
        <div class="rank-mini-list" id="rank-mini-list"></div>
      </div>
      <div class="sc w2" id="weather-board" style="display:none">
        <span class="sl">Wetter</span>
        <div class="weather-mini" id="wx-overview-view"><span class="w-l">Keine Wetterdaten</span><span class="w-r">-</span></div>
      </div>
      <div class="sc w2" id="event-board" style="display:none">
        <div class="rank-mini-head">
          <span class="rank-mini-title">Events</span>
          <span class="rank-mini-note">Leitstellenspiel Live-Events</span>
        </div>
        <div id="lss-live-events-overview" style="display:none"></div>
        <div id="event-overview-view"><div class="lss7-empty">Aktuell ist kein Leitstellenspiel-Event aktiv.</div></div>
      </div>
    </div>
    <div id="cv-wrap">
      <div class="cv-hdr">
        <span class="cv-title">Kreditverlauf (heute)</span>
        <span class="cv-meta" id="cv-meta">Sammle Daten...</span>
      </div>
      <canvas id="lss7-chart"></canvas>
    </div>`);
  body.append(tOver);

  const tForecast=$(`<div id="tp-forecast" class="lpanel"></div>`);
  tForecast.append(`<div class="forecast-controls">
    <label class="forecast-control"><span>Meilenstein in Credits</span><input id="forecast-target-main" class="lss7-select" type="number" min="1" step="1000000" value="${Math.round(Number(S.settings.forecastTarget)||30000000000)}"></label>
    <button class="lbtn prime" id="forecast-apply" type="button">Prognose aktualisieren</button>
  </div><div id="forecast-full-view"></div>`);
  body.append(tForecast);

  // TAB: Fahrzeuge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tVeh=$(`<div id="tp-vehicles" class="lpanel"></div>`);
  tVeh.append(`
    <div class="vehicle-summary">
      <div class="vehicle-summary-card"><span class="vehicle-summary-label">Fahrzeuge gesamt</span><span class="vehicle-summary-value green" id="veh-total-count">-</span></div>
      <div class="vehicle-summary-card"><span class="vehicle-summary-label">Gebäude gesamt</span><span class="vehicle-summary-value blue" id="veh-building-count">-</span></div>
      <div class="vehicle-summary-card"><span class="vehicle-summary-label">Gebäudetypen</span><span class="vehicle-summary-value amber" id="veh-building-types">-</span></div>
      <div class="vehicle-summary-card"><span class="vehicle-summary-label">Fahrzeuge je Gebäude</span><span class="vehicle-summary-value" id="veh-per-building">-</span></div>
    </div>
    <section class="fleet-panel fleet-readiness">
      <div class="asset-section-head"><div><span class="asset-section-title">Fahrzeugbereitschaft</span><span class="asset-section-sub">Statusverteilung und operative Einsatzbereitschaft aller Fahrzeuge.</span></div><span class="fleet-panel-live">90s Refresh</span></div>
      <div id="fleet-status-kpis" class="fleet-status-kpis"></div>
      <div class="fleet-status-layout">
        <div id="donut-wrap">
          <div id="lss7-donut"></div>
          <div id="donut-leg"><div class="lss7-empty"><span class="lspin"></span> Lade...</div></div>
        </div>
        <div class="vb-wrap" id="lss7-vbars"><div class="lss7-empty"><span class="lspin"></span> Lade...</div></div>
      </div>
    </section>
    <section class="asset-section">
      <div class="asset-section-head">
        <div><span class="asset-section-title">Qualitätscheck & API-Lage</span><span class="asset-section-sub">Automatische Hinweise aus v2-Fahrzeugen, v2-Gebäuden, POIs, Einsatzdaten, Verbandsevents und AAO-Kategorien.</span></div>
        <div class="asset-action-row"><button class="lbtn prime compact" id="fleet-refresh-analysis" type="button">Analyse aktualisieren</button><button class="lbtn compact" data-export="fleet" type="button">CSV Fuhrpark</button></div>
      </div>
      <div id="fleet-quality-board" class="quality-grid"><div class="lss7-empty"><span class="lspin"></span> Lade Qualitätscheck...</div></div>
      <div class="asset-subhead"><span>Top-Fahrzeugtypen</span><span>aus /api/v2/vehicles</span></div>
      <div id="fleet-type-board" class="fleet-type-board"><div class="lss7-empty"><span class="lspin"></span> Lade Fahrzeugtypen...</div></div>
      <div class="asset-subhead"><span>Datenbasis</span><span>offizielle API-Endpunkte</span></div>
      <div id="fleet-api-board" class="quality-grid compact-grid"></div>
    </section>
    <section class="asset-section">
      <div class="asset-section-head">
        <div><span class="asset-section-title">Standorte, Personal & Ausbauten</span><span class="asset-section-sub">Betriebsstatus, Personalabdeckung, Spezialisierungen, Leitstellenbindung und vorhandene Kapazitäten aus der Gebäude-API.</span></div><span class="fleet-panel-live">Live API</span>
      </div>
      <div id="lss7-bld"><div class="lss7-empty"><span class="lspin"></span> Lade Gebäudedetails...</div></div>
    </section>`);
  body.append(tVeh);

  // TAB: Lehrgänge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tSch=$(`<div id="tp-schoolings" class="lpanel"></div>`);
  tSch.append(`<div id="lss7-sch"><div class="lss7-empty"><span class="lspin"></span> Lade Lehrgänge...</div></div>`);
  body.append(tSch);

  // TAB: AAO â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tAAO=$(`<div id="tp-aao" class="lpanel"></div>`);
  tAAO.append(`<div id="lss7-aao"><div class="lss7-empty"><span class="lspin"></span> Lade AAOs...</div></div>`);
  body.append(tAAO);

  // TAB: Verlauf â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tHist=$(`<div id="tp-history" class="lpanel"></div>`);
  tHist.append(`
    <div class="sg sg2">
      <div class="sc">
        <span class="sl">Verlaufspunkte</span>
        <span class="sv" id="sv-hist-cnt">${S.creditHist.length}</span>
      </div>
      <div class="sc">
        <span class="sl">Erster Eintrag</span>
        <span class="sv-sm">${S.creditHist.length?fmtShortTime(S.creditHist[0].ts):"-"}</span>
      </div>
    </div>
    <div class="settings-intro history-explain">
      <b>${tr("Was zeigt der Verlauf?")}</b>
      <span>${tr("Der Verlauf zeigt regelmäßig gespeicherte Stände der Verbandscredits.")} ${tr("Er ist kein vollständiges Spielprotokoll: Werte entstehen nur, während das Skript Daten abrufen kann.")} ${tr("Daten werden ausschließlich lokal in diesem Browser gespeichert.")}</span>
    </div>
    <div id="lss7-hist"></div>`);
  body.append(tHist);

  // TAB: Team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tTeam=$(`<div id="tp-team" class="lpanel"><div id="lss7-team"><div class="lss7-empty"><span class="lspin"></span> Lade Mitglieder...</div></div></div>`);
  body.append(tTeam);
  const tEvt=$(`<div id="tp-event" class="lpanel"></div>`);
  tEvt.append(`<div class="game-events-card" id="lss-game-events-card" style="display:none">
    <div class="game-events-head">
      <span class="game-events-title">Leitstellenspiel Live-Events</span>
      <span class="game-events-live">Live</span>
    </div>
    <div class="game-events-list" id="lss-game-events-list"></div>
  </div>
  <div class="event-card">
    <div class="event-top">
      <div>
        <div class="event-title">Leitstellenspiel Events</div>
        <div class="event-sub">Aktive Credit-Boosts, Coin-Sales und Einsatz-Events werden automatisch aus der Spielnavigation erkannt und im Dashboard hervorgehoben.</div>
      </div>
      <div class="event-status"><span class="event-pill">Live-Erkennung</span><span class="bd bd-blue">LSS</span></div>
    </div>
    <div><div class="event-count-lbl">Aktive Events</div><div class="event-count" id="event-live-count">0</div></div>
    <div class="event-grid">
      <div class="event-kpi"><span class="event-k">Erkennung</span><span class="event-v">Liest die sichtbaren Event-Hinweise direkt aus der Leitstellenspiel-Navigation.</span></div>
      <div class="event-kpi"><span class="event-k">Countdown</span><span class="event-v">Restzeiten werden übernommen, wenn Leitstellenspiel einen Endzeitpunkt bereitstellt.</span></div>
      <div class="event-kpi"><span class="event-k">Header</span><span class="event-v">Aktive Events erscheinen zusätzlich kompakt oben im Dashboard-Header.</span></div>
      <div class="event-kpi"><span class="event-k">Datenschutz</span><span class="event-v">Es wird keine externe Event-API abgefragt; die Auswertung bleibt auf der Spielseite.</span></div>
    </div>
    <div class="event-actions"><button class="lbtn prime" id="event-refresh" type="button">Events neu erkennen</button></div>
    <div class="game-events-list" id="event-live-list"><div class="lss7-empty">Aktuell ist kein Leitstellenspiel-Event aktiv.</div></div>
    <div class="event-note">Diese Ansicht zeigt nur offizielle Leitstellenspiel-Events, die in deiner Spielnavigation vorhanden sind.</div>
    <div class="event-source" id="event-source">Quelle: Leitstellenspiel-Navigation</div>
  </div>`);
  body.append(tEvt);

  // TAB: Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tSet=$(`<div id="tp-settings" class="lpanel"></div>`);
  const setWrap=$(`<div class="set-wrap"></div>`);
  setWrap.append(`<div class="settings-intro"><b>Einstellungen</b><span>Anzeige, Prognose, Wetter und Events sind thematisch getrennt. Änderungen werden automatisch lokal in diesem Browser gespeichert.</span></div>`);

  const grpNav=$(`<div class="set-group set-wide nav-style-setting" id="lss7-nav-style-setting">
    <div class="set-head">Kopfzeilen-Button</div>
    <div class="nav-style-showcase">
      <div class="nav-style-preview-shell"><div id="lss7-nav-style-preview" class="nav-style-preview">${brandMarkHtml()}<span class="nav-style-preview-copy"><b>Dein Verband</b><span>Live-Events</span></span></div></div>
      <div><label class="tog-row"><span class="tog-lbl">Darstellung</span>
        <select id="sb-nav-style" class="lss7-select">
          <option value="logo"${S.settings.navButtonStyle==="logo"?" selected":""}>Nur Logo</option>
          <option value="standard"${S.settings.navButtonStyle==="standard"?" selected":""}>Standard</option>
          <option value="standard-no-event"${S.settings.navButtonStyle==="standard-no-event"?" selected":""}>Standard ohne Events</option>
          <option value="name"${S.settings.navButtonStyle==="name"?" selected":""}>Nur Dein Verband</option>
        </select>
      </label><div class="set-note">Die Vorschau zeigt direkt, wie dein Dashboard-Button im Spiel-Header wirkt. Laufende Events bleiben im Dashboard-Header sichtbar.</div></div>
    </div>
    <label class="tog-row player-forecast-setting"><span class="tog-lbl">Spielerprognose anzeigen</span><select id="sb-player-forecast-place" class="lss7-select"><option value="profile"${S.settings.playerForecastPlacement!=="both"?" selected":""}>Nur im Spielerprofil</option><option value="both"${S.settings.playerForecastPlacement==="both"?" selected":""}>Spielerprofil und Menü</option></select></label>
  </div>`);
  setWrap.append(grpNav);

  const grpAct=$(`<div class="set-group set-wide set-actions settings-actions"><div class="set-head">Schnellaktionen</div></div>`);
  grpAct.append(mkBtn("Akt.","Alle Daten jetzt aktualisieren","id='sb-refresh' class='lbtn prime'"));
  grpAct.append(mkBtn("00:00","Heutige Spielzeit zurücksetzen","id='sb-playtime-reset' class='lbtn'"));
  grpAct.append(mkBtn("7T","7-Tage-Verbandsverdienst zurücksetzen","id='sb-alliance-daily-reset' class='lbtn danger'"));
  setWrap.append(grpAct);

  const grpExport=$(`<div class="set-group set-wide set-actions settings-export"><div class="set-head">Datenexport</div></div>`);
  grpExport.append(`<button class="lbtn" data-export="fleet" type="button"><span class="lbtn-i">CSV</span><span class="lbtn-t">Fuhrpark exportieren</span></button>`);
  grpExport.append(`<button class="lbtn" data-export="buildings" type="button"><span class="lbtn-i">CSV</span><span class="lbtn-t">Standorte exportieren</span></button>`);
  grpExport.append(`<button class="lbtn" data-export="schoolings" type="button"><span class="lbtn-i">CSV</span><span class="lbtn-t">Lehrgänge exportieren</span></button>`);
  grpExport.append(`<button class="lbtn" data-export="aaos" type="button"><span class="lbtn-i">CSV</span><span class="lbtn-t">AAO exportieren</span></button>`);
  grpExport.append(`<button class="lbtn" data-export="team" type="button"><span class="lbtn-i">CSV</span><span class="lbtn-t">Mitspieler exportieren</span></button>`);
  grpExport.append(`<button class="lbtn" data-export="history" type="button"><span class="lbtn-i">CSV</span><span class="lbtn-t">Verlauf exportieren</span></button>`);
  grpExport.append(`<button class="lbtn prime" id="sb-backup-export" type="button"><span class="lbtn-i">JSON</span><span class="lbtn-t">Komplettes Backup erstellen</span></button>`);
  grpExport.append(`<button class="lbtn" id="sb-backup-import" type="button"><span class="lbtn-i">JSON</span><span class="lbtn-t">Backup wiederherstellen</span></button><input id="sb-backup-file" type="file" accept="application/json,.json" style="display:none">`);
  grpExport.append(`<div class="set-note"><b>Datensicherung:</b> Exportiere regelmäßig ein komplettes JSON-Backup. Damit kannst du Verlauf, Einstellungen, Prognosedaten, Spielzeit und Diagnosewerte nach Browser- oder Tampermonkey-Datenlöschung wiederherstellen.</div>`);
  setWrap.append(grpExport);

  const grpDiag=$(`<div class="set-group set-wide settings-diagnostics"><div class="set-head">Analyse & Fehlerbericht</div></div>`);
  grpDiag.append(`<div class="set-note">Wenn ein Nutzer einen Fehler meldet, kann er zuerst eine Analyse laufen lassen. Das Skript prüft die wichtigsten Systeme, zeigt direkt Feedback und kann danach eine Supportdatei für dich erstellen.</div>`);
  grpDiag.append(`<textarea id="sb-diagnostics-note" class="lss7-select diagnostics-note" rows="3" placeholder="Optional: Was ist passiert? Welche Ansicht war geöffnet?"></textarea>`);
  grpDiag.append(`<div class="diagnostics-actions"><button class="lbtn prime" id="sb-diagnostics-run" type="button">Analyse ausführen</button><button class="lbtn" id="sb-diagnostics-export" type="button">Supportdatei erstellen</button><button class="lbtn" id="sb-diagnostics-clear" type="button">Fehlerliste leeren</button></div>`);
  grpDiag.append(`<div class="update-status" id="sb-diagnostics-status"><strong>Diagnose bereit</strong><span>Fehlerstatus wird geladen...</span></div>`);
  grpDiag.append(`<div class="diagnostics-results" id="sb-diagnostics-results"></div>`);

  const grpUpdate=$(`<div class="set-group set-wide settings-updates"><div class="set-head">Updates</div></div>`);
  grpUpdate.append(`<div class="update-status" id="sb-update-status"><strong>Automatische Updates</strong><span>Tampermonkey übernimmt Updates über die hinterlegte Update-URL. Beim Start wird zusätzlich geprüft, ob die installierte Version aktuell ist.</span></div>`);
  grpUpdate.append(`<div class="update-actions"><button class="lbtn prime" id="sb-update-check" type="button">Userscripte auf Updates prüfen</button><a class="lbtn" id="sb-update-install" href="${UPDATE_URL}" target="_blank" rel="noopener" style="display:none">Update manuell installieren</a></div>`);
  setWrap.append(grpUpdate);

  const grpOpt=$(`<div class="set-group set-wide settings-appearance"><div class="set-head">Darstellung & Bedienung</div></div>`);
  grpOpt.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Sprache</span>
    <select id="sb-language" class="lss7-select">
      <option value="de"${S.settings.language==="de"?" selected":""}>Deutsch</option>
      <option value="en"${S.settings.language==="en"?" selected":""}>English</option>
      <option value="fr"${S.settings.language==="fr"?" selected":""}>Français</option>
    </select>
  </label>`);
  grpOpt.append(mkToggle("tog-notif","Browser-Benachrichtigungen","notifications"));
  grpOpt.append(mkToggle("tog-coins","Coins anzeigen","coins"));
  grpOpt.append(mkToggle("tog-playtime","Spielzeit anzeigen","playtimeEnabled"));
  grpOpt.append(mkToggle("tog-hotkeys","Tastenkürzel aktivieren","hotkeysEnabled"));
  grpOpt.append(`<div class="hotkey-grid">
    ${hotkeyCaptureButton("panelHotkey","Menü öffnen / schließen",S.settings.panelHotkey)}
    ${hotkeyCaptureButton("collapseHotkey","Menü ein- / ausklappen",S.settings.collapseHotkey)}
  </div>`);
  grpOpt.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Menü-Modus</span>
    <select id="sb-panel-mode" class="lss7-select">
      <option value="floating"${S.settings.panelMode==="floating"?" selected":""}>Floating</option>
      <option value="embedded"${S.settings.panelMode==="embedded"?" selected":""}>Layout-Box</option>
    </select>
  </label>`);
  grpOpt.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Panel-Theme</span>
    <select id="sb-theme" class="lss7-select">
      <option value="dark"${S.settings.panelTheme==="dark"?" selected":""}>Dark</option>
      <option value="light"${S.settings.panelTheme==="light"?" selected":""}>Light</option>
      <option value="summer"${S.settings.panelTheme==="summer"?" selected":""}>Summer 2026</option>
      <option value="summer-dark"${S.settings.panelTheme==="summer-dark"?" selected":""}>Summer Dark 2026</option>
      <option value="lcars"${S.settings.panelTheme==="lcars"?" selected":""}>LCARS 2364</option>
    </select>
  </label>`);
  setWrap.append(grpOpt);

  const grpCredits=$(`<div class="set-group set-wide settings-credit-popups"><div class="set-head">Credit-Eingang · Popup & Kassenklang</div></div>`);
  grpCredits.append(mkToggle("tog-credit-popup","Credit-Eingänge als Popup anzeigen","creditPopupEnabled"));
  grpCredits.append(mkToggle("tog-credit-sound","Credit-Klang abspielen","creditPopupSound"));
  grpCredits.append(`<div class="settings-feature-grid">
    <label class="tog-row" style="justify-content:space-between;"><span class="tog-lbl">Klang</span><select id="sb-credit-sound-type" class="lss7-select">
      <option value="kaching"${S.settings.creditPopupSoundType==="kaching"?" selected":""}>Kaching · Klassische Kasse</option>
      <option value="coins"${S.settings.creditPopupSoundType==="coins"?" selected":""}>Coins · Münzen</option>
      <option value="register"${S.settings.creditPopupSoundType==="register"?" selected":""}>Register · Registrierkasse</option>
      <option value="success"${S.settings.creditPopupSoundType==="success"?" selected":""}>Success · Erfolgsfanfare</option>
      <option value="soft"${S.settings.creditPopupSoundType==="soft"?" selected":""}>Soft · Dezent</option>
      <option value="arcade"${S.settings.creditPopupSoundType==="arcade"?" selected":""}>Arcade · Retro-Bonus</option>
    </select></label>
    <label class="tog-row credit-volume-row"><span class="tog-lbl">Lautstärke</span><span class="credit-volume-control"><input id="sb-credit-volume" type="range" min="0" max="100" step="5" value="${Math.max(0,Math.min(100,Number.isFinite(Number(S.settings.creditPopupVolume))?Number(S.settings.creditPopupVolume):65))}"><output id="sb-credit-volume-value">${Math.max(0,Math.min(100,Number.isFinite(Number(S.settings.creditPopupVolume))?Number(S.settings.creditPopupVolume):65))}%</output></span></label>
    <label class="tog-row" style="justify-content:space-between;"><span class="tog-lbl">Größe</span><select id="sb-credit-size" class="lss7-select">
      <option value="small"${S.settings.creditPopupSize==="small"?" selected":""}>Klein · kompakt</option>
      <option value="medium"${S.settings.creditPopupSize==="medium"?" selected":""}>Mittel · Standard</option>
      <option value="large"${S.settings.creditPopupSize==="large"?" selected":""}>Groß · prominent</option>
    </select></label>
    <label class="tog-row" style="justify-content:space-between;"><span class="tog-lbl">Position</span><select id="sb-credit-position" class="lss7-select">
      <option value="right-top"${S.settings.creditPopupPosition==="right-top"?" selected":""}>Rechts oben</option>
      <option value="right-center"${S.settings.creditPopupPosition==="right-center"?" selected":""}>Rechts mittig</option>
      <option value="right-bottom"${S.settings.creditPopupPosition==="right-bottom"?" selected":""}>Rechts unten</option>
      <option value="left-top"${S.settings.creditPopupPosition==="left-top"?" selected":""}>Links oben</option>
      <option value="left-center"${S.settings.creditPopupPosition==="left-center"?" selected":""}>Links mittig</option>
      <option value="left-bottom"${S.settings.creditPopupPosition==="left-bottom"?" selected":""}>Links unten</option>
    </select></label>
    <label class="tog-row" style="justify-content:space-between;"><span class="tog-lbl">Animation</span><select id="sb-credit-animation" class="lss7-select">
      <option value="slide"${S.settings.creditPopupAnimation==="slide"?" selected":""}>Seitlich einschieben</option>
      <option value="float"${S.settings.creditPopupAnimation==="float"?" selected":""}>Sanft hochschweben</option>
      <option value="scale"${S.settings.creditPopupAnimation==="scale"?" selected":""}>Elegant vergrößern</option>
      <option value="bounce"${S.settings.creditPopupAnimation==="bounce"?" selected":""}>Dynamisch federn</option>
      <option value="fade"${S.settings.creditPopupAnimation==="fade"?" selected":""}>Dezent einblenden</option>
    </select></label>
    <label class="tog-row" style="justify-content:space-between;"><span class="tog-lbl">Anzeigedauer</span><select id="sb-credit-duration" class="lss7-select">
      ${[[3000,"3 Sekunden"],[5000,"5 Sekunden"],[7000,"7 Sekunden"],[10000,"10 Sekunden"]].map(([value,label])=>`<option value="${value}"${Number(S.settings.creditPopupDuration)===value?" selected":""}>${label}</option>`).join("")}
    </select></label>
    <label class="tog-row" style="justify-content:space-between;"><span class="tog-lbl">Mindestbetrag</span><input id="sb-credit-minimum" class="lss7-select" type="number" min="1" step="100" value="${Math.max(1,Number(S.settings.creditPopupMinimum)||1)}"></label>
  </div>`);
  grpCredits.append(`<div class="update-actions"><button class="lbtn prime" id="sb-credit-preview" type="button">Popup testen</button><button class="lbtn" id="sb-credit-sound-test" type="button">Klang testen</button></div>`);
  grpCredits.append(`<div class="set-note">Das Popup reagiert direkt auf steigende Credits in der Spiel-Navigation. Mehrere Einnahmen werden gestapelt; Ausgaben erzeugen keine Meldung. In jeder Größe bleiben Buchungsstatus, Einnahmebetrag, Tagesstand und Uhrzeit vollständig sichtbar.</div>`);
  setWrap.append(grpCredits);

  const grpForecast=$(`<div class="set-group settings-forecast"><div class="set-head">Verbandsprognose</div></div>`);
  grpForecast.append(mkToggle("tog-forecast","Prognose in Übersicht anzeigen","forecastEnabled"));
  grpForecast.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Meilenstein in Credits</span>
    <input id="sb-forecast-target" class="lss7-select" type="number" min="1" step="1000000" style="max-width:190px" value="${Math.round(Number(S.settings.forecastTarget)||30000000000)}">
  </label>`);
  grpForecast.append(`<div class="set-note"><b>Hinweis:</b> Nach Eingabe des Meilensteins werden Resttage und voraussichtliches Erreichungsdatum automatisch berechnet. Ab 3 bis 7 vollständigen Tagen wird die Prognose deutlich sicherer. Leichte Abweichungen durch Events, Offline-Zeiten und wechselnde Aktivität bleiben dennoch möglich.</div>`);

  const grpWx=$(`<div class="set-group settings-weather"><div class="set-head">Wetter & Warnungen</div></div>`);
  grpWx.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Land</span>
    <select id="sb-weather-country" class="lss7-select">
      ${Object.entries(WEATHER_COUNTRIES).map(([code,cfg])=>`<option value="${code}"${S.settings.weatherCountry===code?" selected":""}>${escHtml(cfg.label)}</option>`).join("")}
    </select>
  </label>`);
  grpWx.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Ort / PLZ</span>
    <input id="sb-weather-loc" class="lss7-select" style="max-width:180px" value="${String(S.settings.weatherLocation||"").replace(/"/g,"&quot;")}" placeholder="z.B. 70173 Stuttgart">
  </label>`);
  grpWx.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Anzeige</span>
    <select id="sb-weather-mode" class="lss7-select">
      <option value="off"${S.settings.weatherMode==="off"?" selected":""}>Aus</option>
      <option value="settings"${S.settings.weatherMode==="settings"?" selected":""}>Nur Settings</option>
      <option value="overview"${S.settings.weatherMode==="overview"?" selected":""}>Übersicht-Box</option>
    </select>
  </label>`);
  grpWx.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Warnsound</span>
    <select id="sb-weather-sound" class="lss7-select">
      <option value="off"${S.settings.weatherSound?"":" selected"}>Aus</option>
      <option value="on"${S.settings.weatherSound?" selected":""}>An</option>
    </select>
  </label>`);
  grpWx.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Warnton</span>
    <select id="sb-weather-tone" class="lss7-select">
      <option value="beep"${S.settings.weatherTone==="beep"?" selected":""}>Beep</option>
      <option value="alarm"${S.settings.weatherTone==="alarm"?" selected":""}>Alarm</option>
      <option value="chime"${S.settings.weatherTone==="chime"?" selected":""}>Chime</option>
    </select>
  </label>`);
  grpWx.append(`<div class="set-note">Wetter und Vorhersage werden für Deutschland, Österreich, Schweiz, Frankreich und Niederlande unterstützt. Amtliche DWD-Warnungen sind technisch nur für Orte in Deutschland verfügbar.</div>`);
  grpWx.append(`<div class="set-note"><div class="weather-mini" id="wx-settings-view"><span class="w-l">Keine Wetterdaten</span><span class="w-r">-</span></div></div>`);

  const grpEvent=$(`<div class="set-group settings-events"><div class="set-head">Leitstellenspiel-Events</div></div>`);
  grpEvent.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Anzeige</span>
    <select id="sb-event-mode" class="lss7-select">
      <option value="off"${S.settings.eventMode==="off"?" selected":""}>Aus</option>
      <option value="overview"${S.settings.eventMode==="overview"?" selected":""}>An - in Übersicht anzeigen</option>
    </select>
  </label>`);
  grpEvent.append(`<button class="lbtn prime" id="sb-event-refresh" type="button">Events neu erkennen</button>`);
  grpEvent.append(`<div class="set-note">Erkennt aktive Leitstellenspiel-Events direkt aus der Navigation, z. B. Credit-Boosts, Coin-Sales oder Einsatz-Events. Es wird keine externe Event-API abgefragt.</div>`);
  const settingsFeatures=$(`<div class="settings-feature-grid set-wide"></div>`);
  settingsFeatures.append($(`<div class="settings-feature-column"></div>`).append(grpForecast,grpEvent));
  settingsFeatures.append($(`<div class="settings-feature-column"></div>`).append(grpWx));
  setWrap.append(settingsFeatures);

  const grpInfo=$(`<div class="set-group set-wide settings-info author-message"><div class="set-head">Informationen & ein paar Worte von mir</div></div>`);
  grpInfo.append(`<div class="settings-info-grid"><div class="set-note">${infoHTML()}</div><div class="author-message-content">
    <div class="author-message-lead">Vielen Dank für die Nutzung meines Skripts</div>
    <p><b>Liebe Nutzerinnen und Nutzer,</b></p>
    <p>vielen Dank, dass ihr mein Skript nutzt. In den vergangenen Wochen und Monaten habe ich viel Zeit, Arbeit und Leidenschaft in die Entwicklung dieses Projekts investiert. Es freut mich sehr, dass ihr mein Skript verwendet, und ich hoffe, dass es euch den Verbandsalltag erleichtert und einen echten Mehrwert bietet.</p>
    <p>Euer Feedback ist mir besonders wichtig. Solltet ihr Anregungen, Verbesserungsvorschläge, Fehlerberichte oder sonstige Hinweise haben, könnt ihr jederzeit über den Kontakt-Button mit mir in Verbindung treten. Jede Rückmeldung hilft dabei, das Skript weiterzuentwickeln und noch besser zu machen.</p>
    <h4>Kostenlose Nutzung</h4>
    <p>Mir ist wichtig zu betonen, dass dieses Skript auch in Zukunft kostenlos bleiben wird. Es handelt sich um mein erstes großes Programmierprojekt, das ich nutze, um meine Fähigkeiten weiterzuentwickeln, neue Ideen umzusetzen und praktische Erfahrungen zu sammeln.</p>
    <p>Gleichzeitig möchte ich damit der Community ein hilfreiches Werkzeug zur Verfügung stellen, das dabei unterstützt, den Überblick über den eigenen Verband zu behalten und wichtige Informationen übersichtlich darzustellen.</p>
    <h4>Wie könnt ihr mich unterstützen?</h4>
    <p>Die beste Unterstützung ist euer Feedback. Verbesserungsvorschläge, Ideen für neue Funktionen oder Hinweise auf Fehler helfen mir dabei, das Skript kontinuierlich weiterzuentwickeln.</p>
    <p>Auf Spenden oder Trinkgelder möchte ich bewusst verzichten. Dieses Projekt ist ein echtes Herzensprojekt und wird aus Freude am Programmieren entwickelt. Die Entwicklung solcher Lösungen ist nicht nur mein Hobby, sondern auch meine Leidenschaft und mein Beruf.</p>
    <p class="author-message-thanks">Vielen Dank für euer Vertrauen und eure Unterstützung!</p>
  </div></div>`);

  const grpContact=$(`<div class="set-group set-wide settings-contact"><div class="set-head">Kontakt</div></div>`);
  grpContact.append(`<div class="set-note">
    Bug gefunden, Feedback oder Verbesserungsvorschlag? Dann melde dich gern direkt im Spiel.
    <div style="margin-top:8px">
      <a class="lbtn prime" href="${BASE}/profile/687089" target="_blank" rel="noopener">Kontakt aufnehmen</a>
    </div>
  </div>`);

  const grpPn=$(`<div class="set-group set-wide settings-patch-notes"><div class="set-head">Patch-Notes</div></div>`);
  grpPn.append(`<div class="set-note"><b>Aktuelle Version v${V}</b><br>Alle Änderungen stehen zusätzlich gesammelt in den ausführlichen Patch-Notes unterhalb des Dashboards.</div>`);
  const settingsCategory=(title,subtitle,items)=>{
    const section=$(`<section class="settings-category set-wide"><div class="settings-category-head"><b>${title}</b><span>${subtitle}</span></div><div class="settings-category-grid"></div></section>`);
    section.find(".settings-category-grid").append(...items);
    return section;
  };
  setWrap.empty().append(
    `<div class="settings-intro"><b>Einstellungen übersichtlich nach Bereichen</b><span>Jeder Abschnitt erklärt, welche Funktionen zusammengehören. Änderungen werden sofort übernommen und ausschließlich lokal in deinem Browser gespeichert.</span></div>`,
    settingsCategory("1 · Oberfläche & Bedienung","Theme, Menüposition, Header-Button, Sprache, sichtbare Kennzahlen und Tastenkürzel.",[grpNav,grpOpt]),
    settingsCategory("2 · Benachrichtigungen & Sounds","Credit-Popups, Lautstärke, Wetterwarnungen sowie Leitstellenspiel-Eventhinweise.",[grpCredits,grpWx,grpEvent]),
    settingsCategory("3 · Auswertungen & Prognosen","Zielwerte und Berechnungen für die Verbandsentwicklung.",[grpForecast]),
    settingsCategory("4 · Daten, Wartung & Diagnose","Daten aktualisieren, exportieren, Updates prüfen und Fehlerberichte erstellen.",[grpAct,grpExport,grpUpdate,grpDiag]),
    settingsCategory("5 · Hilfe & Projektinformationen","Versionshinweise, Kontaktmöglichkeiten und Hintergrund zum Projekt.",[grpPn,grpContact,grpInfo])
  );

  tSet.append(setWrap);
  body.append(tSet);
  panel.append(body);

  panel.append(mkAccordion("PN","Patch-Notes v9.6.0",patchHTML()));

  // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel.append(`
    <div id="lss7-ft">
      <span class="ft-l">(c) 2025 Fabian (Capt.BobbyNash)</span>
      <span class="ft-r"><span class="ft-version">v${V}</span><span>Aktualisiert: <span id="lss7-upd">-</span></span></span>
    </div>`);

  // â”€â”€ EVENTS: stopPropagation auf allem im Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Dies verhindert dass Bootstrap oder LSS den Click abfÃ¤ngt
  panel.on("click mousedown mouseup touchstart", function(e){
    e.stopPropagation();
  });

  // Tabs
  panel.on("click",".ltab",function(e){
    e.stopPropagation();e.preventDefault();
    const id=$(this).data("tab");
    panel.find(".ltab").removeClass("active");
    $(this).addClass("active");
    panel.find(".lpanel").removeClass("active");
    panel.find(`#${id}`).addClass("active");

    // Lazy fetch beim ersten Ã–ffnen
    if(id==="tp-vehicles"  && !panel.data("lv")){panel.data("lv",1);fetchVehicleStates();fetchBuildings();fetchFleetVehicles();fetchAnalysisMeta();}
    if(id==="tp-schoolings"&& !panel.data("ls")){panel.data("ls",1);fetchSchoolings();}
    if(id==="tp-aao"       && !panel.data("la")){panel.data("la",1);fetchAAOs();fetchAnalysisMeta();}
    if(id==="tp-history"){renderHistTab();}
    if(id==="tp-forecast"){renderForecast();}
    if(id==="tp-player-forecast"){renderPlayerForecast();fetchPlayerRanking();}
    if(id==="tp-event"){scanGameEvents();renderEventPage();}
    if(id==="tp-overview"){renderForecast();setTimeout(drawChart,50);}
  });

  panel.on("click","[data-open-event]",function(e){
    e.stopPropagation();e.preventDefault();
    panel.find('.ltab[data-tab="tp-event"]').trigger("click");
  });

  // Settings buttons
  panel.on("click","#sb-refresh",  e=>{ e.stopPropagation(); fetchAllData(); });
  panel.on("click","[data-export]",e=>{
    e.stopPropagation();e.preventDefault();
    exportDashboardData(String($(e.currentTarget).data("export")||""));
  });
  panel.on("click","#sb-backup-export",e=>{
    e.stopPropagation();e.preventDefault();
    exportFullBackup();
  });
  panel.on("click","#sb-backup-import",e=>{
    e.stopPropagation();e.preventDefault();
    $("#sb-backup-file").trigger("click");
  });
  panel.on("change","#sb-backup-file",e=>{
    const file=e.currentTarget.files?.[0];
    if(file&&window.confirm("Dieses Backup überschreibt lokale Dashboard-Daten und lädt die Seite danach neu. Fortfahren?"))importFullBackup(file);
    e.currentTarget.value="";
  });
  panel.on("click","#sb-diagnostics-run",e=>{
    e.stopPropagation();e.preventDefault();
    runDiagnosticAnalysis();
  });
  panel.on("click","#sb-diagnostics-export",e=>{
    e.stopPropagation();e.preventDefault();
    createDiagnosticReport();
  });
  panel.on("click","#sb-diagnostics-clear",e=>{
    e.stopPropagation();e.preventDefault();
    clearDiagnosticErrors();
  });
  panel.on("click","#fleet-refresh-analysis",e=>{
    e.stopPropagation();e.preventDefault();
    fetchVehicleStates();fetchBuildings();fetchFleetVehicles();fetchAnalysisMeta();
  });
  panel.on("click","#sb-update-check",e=>{
    e.stopPropagation();e.preventDefault();
    checkUpdate({manual:true});
  });
  panel.on("click","#lss7-update-patches",e=>{
    e.stopPropagation();e.preventDefault();
    S.settings.panelCollapsed=false;save();applyPanelMode();
    const acc=panel.find(".lacc").last().addClass("open");
    acc.get(0)?.scrollIntoView({behavior:"smooth",block:"nearest"});
  });
  panel.on("click","#sb-playtime-reset",e=>{
    e.stopPropagation();e.preventDefault();
    resetTodayPlaytime();
  });
  panel.on("click","#sb-alliance-daily-reset",e=>{
    e.stopPropagation();e.preventDefault();
    if(window.confirm("Den gespeicherten 7-Tage-Verbandsverdienst wirklich zurücksetzen? Die Prognose beginnt danach mit einer neuen Datenbasis.")){
      resetAllianceDailyCredits();
    }
  });
  panel.on("click","#qs-playtime-cell",e=>{
    e.stopPropagation();e.preventDefault();
    renderPlaytimeStats();
    $("#playtime-pop").toggleClass("open");
  });
  panel.on("click",".prof-view-btn",e=>{
    e.stopPropagation();e.preventDefault();
    const view=String($(e.currentTarget).data("prof-view")||"summary");
    if(view==="forecast"){openPlayerForecastPanel(false);return;}
    panel.find(".prof-view-btn").removeClass("active");
    $(e.currentTarget).addClass("active");
    $("#prof-forecast-panel").removeClass("open");
  });
  panel.on("click","#prof-placement",e=>{
    e.stopPropagation();e.preventDefault();
    openPlayerForecastPanel(false);
  });
  panel.on("click",e=>{
    if(!$(e.target).closest("#qs-playtime-cell").length) $("#playtime-pop").removeClass("open");
  });
  panel.on("change","#sb-panel-mode",e=>{
    e.stopPropagation();
    S.settings.panelMode=String($(e.currentTarget).val()||"floating");
    save();applyPanelMode();
  });
  panel.on("change","#sb-theme",e=>{
    e.stopPropagation();
    S.settings.panelTheme=String($(e.currentTarget).val()||"dark");
    save();applyPanelMode();
  });
  panel.on("change","#sb-credit-position",e=>{
    S.settings.creditPopupPosition=String($(e.currentTarget).val()||"right-center");
    save();creditPopupContainer();
  });
  panel.on("change","#sb-credit-size",e=>{
    S.settings.creditPopupSize=String($(e.currentTarget).val()||"medium");
    save();creditPopupContainer();showCreditPopup(12500,{preview:true});
  });
  panel.on("change","#sb-credit-sound-type",e=>{
    S.settings.creditPopupSoundType=String($(e.currentTarget).val()||"kaching");
    save();playCreditSound(true);
  });
  panel.on("input change","#sb-credit-volume",e=>{
    S.settings.creditPopupVolume=Math.max(0,Math.min(100,Math.round(Number($(e.currentTarget).val())||0)));
    $("#sb-credit-volume-value").text(`${S.settings.creditPopupVolume}%`);
    save();
  });
  panel.on("change","#sb-credit-animation",e=>{
    S.settings.creditPopupAnimation=String($(e.currentTarget).val()||"slide");
    save();
  });
  panel.on("change","#sb-credit-duration",e=>{
    S.settings.creditPopupDuration=Math.max(2000,Number($(e.currentTarget).val())||5000);
    save();
  });
  panel.on("change","#sb-credit-minimum",e=>{
    S.settings.creditPopupMinimum=Math.max(1,Math.round(Number($(e.currentTarget).val())||1));
    $(e.currentTarget).val(S.settings.creditPopupMinimum);
    save();
  });
  panel.on("click","#sb-credit-preview",e=>{
    e.stopPropagation();e.preventDefault();showCreditPopup(12500,{preview:true});
  });
  panel.on("click","#sb-credit-sound-test",e=>{
    e.stopPropagation();e.preventDefault();playCreditSound(true);
  });
  panel.on("change","#sb-nav-style",e=>{
    e.stopPropagation();
    S.settings.navButtonStyle=String($(e.currentTarget).val()||"standard");
    save();applyNavButtonStyle();renderNavStylePreview();
  });
  panel.on("change","#sb-player-forecast-place",e=>{
    e.stopPropagation();
    S.settings.playerForecastPlacement=String($(e.currentTarget).val()||"profile");
    save();applyPlayerForecastPlacement();
  });
  panel.on("click",".hotkey-capture",e=>{
    e.stopPropagation();e.preventDefault();
    startHotkeyCapture($(e.currentTarget).data("hotkey-key"));
  });
  panel.on("change","#sb-language",e=>{
    S.settings.language=String($(e.currentTarget).val()||"de");
    save();location.reload();
  });
  panel.on("change","#sb-forecast-target",e=>{
    applyForecastSettings($(e.currentTarget).val());
  });
  panel.on("click","#forecast-apply",e=>{
    e.stopPropagation();e.preventDefault();
    applyForecastSettings($("#forecast-target-main").val());
  });
  panel.on("keydown","#forecast-target-main",e=>{
    if(e.key!=="Enter")return;
    e.preventDefault();
    $("#forecast-apply").trigger("click");
  });
  panel.on("click","#lss7-col",e=>{
    e.stopPropagation();e.preventDefault();
    togglePanelCollapse();
  });
  panel.on("change","#sb-weather-mode",e=>{
    S.settings.weatherMode=String($(e.currentTarget).val()||"off");
    save();renderWeather();
  });
  panel.on("change","#sb-weather-country",e=>{
    S.settings.weatherCountry=String($(e.currentTarget).val()||"DE");
    S.weather=null;S.weatherLoc="";
    save();fetchWeather();
  });
  panel.on("change","#sb-weather-loc",e=>{
    S.settings.weatherLocation=String($(e.currentTarget).val()||"").trim();
    save();fetchWeather();
  });
  panel.on("change","#sb-weather-sound",e=>{
    S.settings.weatherSound=String($(e.currentTarget).val()||"off")==="on";
    save();
  });
  panel.on("change","#sb-weather-tone",e=>{
    S.settings.weatherTone=String($(e.currentTarget).val()||"beep");
    save();
  });
  panel.on("keydown","#sb-weather-loc",e=>{
    if(e.key!=="Enter") return;
    e.preventDefault();
    S.settings.weatherLocation=String($(e.currentTarget).val()||"").trim();
    save();fetchWeather();
  });
  panel.on("change","#sb-event-mode",e=>{
    S.settings.eventMode=String($(e.currentTarget).val()||"overview");
    save();renderEventOverview();
  });
  panel.on("click","#sb-event-refresh,#event-refresh",e=>{
    e.stopPropagation();e.preventDefault();
    scanGameEvents();
    renderEventPage();
  });
  panel.on("input","#team-search",filterTeamRows);
  panel.on("change","#team-filter",filterTeamRows);
  panel.on("input","#schooling-search",filterSchoolingRows);
  panel.on("change","#schooling-filter",filterSchoolingRows);
  panel.on("click","#schooling-refresh",e=>{
    e.stopPropagation();e.preventDefault();fetchSchoolings();
  });

  // Close button
  panel.on("click","#lss7-x",      e=>{ e.stopPropagation(); togglePanel(false); });

  // Accordions
  panel.on("click",".lacc-hd",function(e){ e.stopPropagation(); $(this).closest(".lacc").toggleClass("open"); });

  // Toggles
  panel.on("click",".tog-row",function(e){
    e.stopPropagation();
    const key=$(this).data("key");
    if(!key)return;
    S.settings[key]=!S.settings[key];save();
    $(this).find(".tog-track").toggleClass("on",S.settings[key]);
    if(key==="playtimeEnabled")updatePlaytimeUi();
    if(key==="coins")updateCoinsUi();
    if(key==="forecastEnabled")renderForecast();
    if(key==="notifications" && S.settings.notifications && "Notification" in window && Notification.permission==="default"){
      Notification.requestPermission().then(permission=>{
        notify(permission==="granted"?"Browser-Benachrichtigungen sind aktiviert.":"Browser-Benachrichtigungen wurden nicht freigegeben.",permission!=="granted");
      }).catch(()=>{});
    }
  });

  applyTranslations(panel.get(0));
  $("body").append(panel);
  renderForecast();
  setTimeout(drawChart,200);
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function mkBtn(icon,label,attrs){
  return `<button ${attrs}><span class="lbtn-i">${icon}</span><span class="lbtn-t">${label}</span></button>`;
}
function enableTabBarScroll(tabBar){
  tabBar.on("wheel", function(e){
    const ev = e.originalEvent;
    if(this.scrollWidth <= this.clientWidth) return;
    const dx = Math.abs(ev.deltaX);
    const dy = Math.abs(ev.deltaY);
    if(dy > dx){
      this.scrollLeft += ev.deltaY;
      e.preventDefault();
    }
  });
}
function getLayoutAnchor(){
  const rowMain=$("#row-main-template").first();
  const mapOuter=$("#map_outer").first();
  if(rowMain.length) return {el:rowMain, where:"before"};
  if(mapOuter.length) return {el:mapOuter, where:"before"};
  return null;
}
function canUseEmbeddedPanel(){
  if(/^\/(?:alliances|verband|profile|users)\b/i.test(location.pathname))return false;
  return !!getLayoutAnchor();
}
function applyPanelMode(){
  const panel=$("#lss7");
  const btnLi=$("#lss7-btn").closest("li");
  if(!panel.length) return;
  if(!panel.parent().is("body")) $("body").append(panel);
  panel.removeClass("layout align-right align-left emb-collapsed");
  btnLi.show();

  const mode=S.settings.panelMode||"floating";
  if(mode==="embedded"&&canUseEmbeddedPanel()){
    const p=getLayoutAnchor();
    if(p.el && p.el.length){
      if(p.where==="before") p.el.before(panel);
      else if(p.where==="after") p.el.after(panel);
      else if(p.where==="prepend") p.el.prepend(panel);
      else p.el.append(panel);
    }
    panel.addClass("layout");
    panel.css({top:"auto",bottom:"auto",right:"auto",left:"auto",width:"100%",height:"auto"});
  } else {
    if(!panel.parent().is("body")) $("body").append(panel);
    const p=S.settings.panelPlacement||"default";
    const top=(p==="default"||p.startsWith("top")) ? "52px" : "auto";
    const bottom=(p.startsWith("bottom")) ? "14px" : "auto";
    const right=(p==="default"||p.endsWith("right")) ? "14px" : "auto";
    const left=(p.endsWith("left")) ? "14px" : "auto";
    panel.css({top,bottom,right,left,width:"",height:""});
  }
  if(S.settings.panelCollapsed) panel.addClass("emb-collapsed");
  panel.removeClass("theme-dark theme-light theme-summer theme-summer-dark theme-lcars");
  const th=String(S.settings.panelTheme||"summer");
  panel.addClass(`theme-${th}`);
  document.body.classList.toggle("lss7-lcars-global",th==="lcars");
  const themeBadge={summer:"SUMMER 2026","summer-dark":"SUMMER DARK 2026",lcars:"LCARS 2364"}[th];
  $("#lss7-summer").toggle(!!themeBadge).text(themeBadge||"");
  summerSceneCtl?.setTheme(th);
  $("#lss7-col").text(S.settings.panelCollapsed?"Zu":"Offen");
  renderWeather();
}
function parseAllianceRankingHtml(html,pageHint=1,pageSizeHint=25){
  const doc=new DOMParser().parseFromString(html,"text/html");
  const table=doc.querySelector("table.table.table-striped");
  const rows=table?Array.from(table.querySelectorAll("tbody tr")):[];
  const activePage=parseInt((doc.querySelector(".pagination li.active span")?.textContent||"").trim(),10);
  const pageNum=Number.isFinite(activePage)&&activePage>0?activePage:pageHint;
  const pageSize=Math.max(1,rows.length||pageSizeHint);
  const list=[];
  const myId=Number(S.allianceId)||null;
  let localRank=0;
  rows.forEach((tr)=>{
    const tds=Array.from(tr.querySelectorAll("td"));
    if(tds.length<3) return;
    const links=Array.from(tr.querySelectorAll("a[href*='/alliances/']"));
    const nameLink=links.find(a=>(a.textContent||"").trim().length>0) || links[0] || null;
    const href=(nameLink?.getAttribute("href")||"");
    const m=href.match(/\/alliances\/(\d+)/);
    const id=m?Number(m[1]):null;
    let name=(nameLink?.textContent||"").trim();
    if(!name){
      const col2=(tds[1]?.textContent||"").replace(/\s+/g," ").trim();
      const texts=tds.map(td=>(td.textContent||"").replace(/\s+/g," ").trim()).filter(Boolean);
      name=(col2||texts[0]||"").replace(/\d[\d\.\, ]*(Credits?)?$/i,"").trim();
    }
    if(!name) name=id?`Verband ${id}`:"Unbekannter Verband";
    let credits=parseDeNum((tds[2].textContent||"").replace(/Credits?/ig,"").trim());
    if(credits===null) credits=parseDeNum((tds[tds.length-1].textContent||"").replace(/Credits?/ig,"").trim());
    if(credits===null) return;
    localRank+=1;
    const rowRank=((pageNum-1)*pageSize)+localRank;
    const allianceName=(S.allianceName||"").trim().toLowerCase();
    const isMe=!!(
      (S.allianceId && id!==null && id===Number(S.allianceId)) ||
      (allianceName && name.trim().toLowerCase()===allianceName)
    );
    const members=parseInt((tds[3]?.textContent||"").replace(/[^\d]/g,""),10)||null;
    const rank = rowRank;
    if(rank===null) return;
    list.push({id,name,rank,credits,isMe,members,rowRank});
  });
  const foundById=!!(myId && list.some(x=>x.id===myId));
  return {list,pageNum,pageSize,foundById};
}
function computeRankContext(list){
  if(!list.length) return null;
  const norm=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9 ]/g,"").replace(/\s+/g," ").trim();
  let idx=list.findIndex(x=>x.isMe);
  const hasAllianceId=!!(S.allianceId && Number(S.allianceId)>0);
  if(idx<0 && hasAllianceId){
    idx=list.findIndex(x=>x.id!==null && x.id===Number(S.allianceId));
  }
  if(idx<0 && S.allianceName){
    const n=norm(S.allianceName);
    idx=list.findIndex(x=>norm(x.name)===n);
  }
  if(idx<0 && S.allianceRank && S.allianceCredits){
    const r=Number(S.allianceRank);
    const mine=Number(S.allianceCredits)||0;
    const byRank=list.find(x=>Number(x.rank)===r);
    if(byRank){
      const d=Math.abs((Number(byRank.credits)||0)-mine);
      const rel=mine>0?(d/mine):1;
      if(rel<=0.01 || d<=10000000) idx=list.indexOf(byRank);
    }
  }
  if(idx<0 && S.allianceCredits){
    const mine=Number(S.allianceCredits)||0;
    let bestIdx=-1,bestDiff=Number.POSITIVE_INFINITY;
    list.forEach((x,i)=>{
      const d=Math.abs((Number(x.credits)||0)-mine);
      if(d<bestDiff){bestDiff=d;bestIdx=i;}
    });
    const rel=mine>0?(bestDiff/mine):1;
    if(bestIdx>=0 && (rel<=0.005 || bestDiff<=5000000)) idx=bestIdx;
  }
  if(idx<0 && S.allianceRank){
    const r=Number(S.allianceRank);
    const byRank=list.find(x=>Number(x.rank)===r);
    if(byRank) idx=list.indexOf(byRank);
  }
  if(idx<0){
    const domRank=readAllianceRankFromDom();
    const anchorRank=domRank || (S.allianceRank?Number(S.allianceRank):null);
    if(anchorRank && anchorRank>0){
      let bestIdx=-1,bestDist=Number.POSITIVE_INFINITY;
      list.forEach((x,i)=>{
        const dist=Math.abs((Number(x.rank)||0)-anchorRank);
        if(dist<bestDist){bestDist=dist;bestIdx=i;}
      });
      if(bestIdx>=0 && bestDist<=2) idx=bestIdx;
    }
  }
  if(idx<0) return null;
  const me=list[idx];
  const above=idx>0?list[idx-1]:null;
  const needed=above?Math.max(0,Math.floor(above.credits-me.credits+1)):0;
  const start=Math.max(0,idx-2), end=Math.min(list.length-1,idx+2);
  const slice=list.slice(start,end+1);
  return {idx,me,above,needed,slice};
}
function renderRankSummary(ctx){
  if(!ctx){ setV("#sv-rank-next","Platzierung nicht gefunden"); return; }
  if(!ctx.above){ setV("#sv-rank-next","Top-Platzierung erreicht"); return; }
  setV("#sv-rank-next",`Bis Platz ${ctx.above.rank}: ${fmtMoney(ctx.needed)}`);
}
function renderRankMini(ctx){
  if(!ctx){
    $("#rank-mini-note").text("Platzierung nicht verfuegbar");
    $("#rank-mini-list").html("");
    return;
  }
  $("#rank-mini-note").text(ctx.above
    ? `Bis naechster Platz fehlen ${fmtMoney(ctx.needed)}`
    : "Top-Platzierung erreicht");
  const rows=ctx.slice.map(x=>{
    const isMe=x===ctx.me;
    const rankTxt=isMe && S.allianceRank ? `#${S.allianceRank}` : `#${x.rank}`;
    const nameHtml=x.id
      ? `<a class="rank-mini-n" href="${BASE}/alliances/${encodeURIComponent(x.id)}" target="_blank" rel="noopener" title="${escHtml(x.name)}">${escHtml(x.name)}</a>`
      : `<div class="rank-mini-n" title="${escHtml(x.name)}">${escHtml(x.name)}</div>`;
    return `<div class="rank-mini-row ${isMe?"me":""}">
      <div class="rank-mini-r">${rankTxt}</div>
      ${nameHtml}
      <div class="rank-mini-c">${fmtMoney(x.credits)}</div>
    </div>`;
  }).join("");
  $("#rank-mini-list").html(rows);
}
function loadRankContext(done){
  const applyRankHtml=(html,pageHint=1,pageSizeHint=25)=>{
    const parsed=parseAllianceRankingHtml(html||"",pageHint,pageSizeHint);
    const list=parsed.list||[];
    const ctx=computeRankContext(list);
    renderRankSummary(ctx);
    renderRankMini(ctx);
    done && done(ctx);
    return {ok:!!ctx,pageSize:parsed.pageSize||pageSizeHint,foundById:!!parsed.foundById};
  };

  pageGet(API.alliancesPage,raw=>{
    const first=applyRankHtml(raw,1,25);
    const r=Number(S.allianceRank)||0;
    const targetPage=r>0?Math.floor((r-1)/(first.pageSize||25))+1:1;
    if(first.foundById) return;
    if(targetPage<=1){ if(!first.ok) $("#rank-mini-note").text("Platzierung geladen (Fallback-Zuordnung aktiv)"); return; }
    pageGet(`${API.alliancesPage}?page=${targetPage}`,h2=>{
      const second=applyRankHtml(h2,targetPage,first.pageSize||25);
      if(!second.foundById && !second.ok) $("#rank-mini-note").text("Platzierung geladen (Fallback-Zuordnung aktiv)");
    },()=>{ if(!first.ok) $("#rank-mini-note").text("Platzierung geladen (Fallback-Zuordnung aktiv)"); });
  },()=>{
    renderRankSummary(null);
    renderRankMini(null);
  });
}
function mkToggle(id,label,key){
  const on=S.settings[key];
  return `<div class="tog-row" data-key="${key}">
    <span class="tog-lbl">${label}</span>
    <div class="tog-track${on?" on":""}" id="${id}"><div class="tog-knob"></div></div>
  </div>`;
}
function mkAccordion(icon,title,body){
  return `<div class="lacc">
    <div class="lacc-hd"><span>${icon}</span><span>${title}</span><span class="lacc-arr">v</span></div>
    <div class="lacc-body"><div class="lacc-content">${body}</div></div>
  </div>`;
}
function patchHTML(){
  const groups=[{
    title:"v9.6.0 — Maximale Sicherheit, Backup & Stabilität",
    items:[
      "Der WM-Plan inklusive externem Spielplan-/Zusatzmodul wurde vollständig entfernt: API-Verbindung, Header-Anzeigen, externe Zeitpläne, Ergebnisdaten, Tipps, Hinweise, Sounds, Cache, Styles und Start-Timer sind raus.",
      "Der Event-Bereich zeigt ausschließlich echte Leitstellenspiel-Events wie Credit-Boosts, Coin-Sales und Einsatz-Events, die direkt aus der Spielnavigation erkannt werden.",
      "API-Aufrufe besitzen jetzt eine strengere Sicherheits-Allowlist, Retry-Logik, Timeout, Backoff, Request-Deduplizierung und leichtes Rate-Limiting pro Quelle.",
      "Unsichere oder zu lange URLs sowie nicht erlaubte externe Quellen werden blockiert und in der Diagnose protokolliert.",
      "In den Einstellungen gibt es ein komplettes JSON-Backup und eine Wiederherstellung für Verlauf, Einstellungen, Prognosedaten, Spielzeit, Aktivitätswerte und Diagnoseinformationen.",
      "Der Backup-Import ist gehärtet: Dateigrößenlimit, JSON-Prüfung, Backup-Typ, Herkunfts-Domain, Top-Level-Allowlist und Normalisierung aller Werte.",
      "Support- und Diagnosedateien werden stärker anonymisiert: Namen, IDs, URLs, E-Mails und potenziell sensible Felder werden entfernt, gekürzt oder gehasht.",
      "Dynamische Profil- und Nachrichtenlinks werden zusätzlich gegen unsichere Protokolle und fremde Origins normalisiert.",
      "Die Mitgliederansicht rendert große Kategorien gebündelt statt Karte für Karte direkt in den DOM und läuft dadurch bei größeren Verbänden ruhiger.",
      "Der Ein-/Ausklapp-Button wurde auf die kompakteren Zustände „Offen“ und „Zu“ gekürzt.",
      "Die Verbandsprognose erklärt die Farbsemantik der Fortschrittsanzeige jetzt direkt mit einer kleinen Legende.",
      "Alle Patchnotes wurden bereinigt und in diesem aktuellen v9.6.0-Sicherheitsblock zusammengeführt."
    ]
  }];
  return groups.map((g,i)=>`<details class="patch-ver"${i===0?" open":""}>
    <summary>${escHtml(g.title)}</summary>
    <div class="patch-ver-body">
      ${g.items.map(t=>`<div class="patch-i"><span class="patch-b">→</span><span>${escHtml(t)}</span></div>`).join("")}
    </div>
  </details>`).join("");
}
function infoHTML(){
  const rows=[
    ["Ersteller","Fabian (Capt.BobbyNash)"],
    ["Supporter","m75e, twoyears"],
    ["Version",V],
    ["APIs","allianceinfo · userinfo · vehicle_states · alliance_schoolings · v2/buildings · v2/vehicles · v2/pois · v1/aaos · mission_type_data"],
    ["Panel-Typ","Layout-Box Standard, Floating optional"],
    ["Alliance-Interval","60s"],
    ["7-Tage-Verdienst","lokal ab erstem Refresh"],
    ["Verbandsprognose","lokale Tageswerte · Trendtempo · Zieltempo"],
    ["Updates","Tampermonkey automatisch · manueller Check verfügbar"],
    ["Spielzeit","lokal, 7 Tage"],
    ["Fahrzeugstatus","90s"],
    ["Lehrgänge","300s"],
    ["AAO","300s (Lazy)"],
  ];
  return rows.map(([k,v])=>`<div class="info-r"><span class="info-k">${k}</span><span class="info-v">${v}</span></div>`).join("");
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  NAV TRIGGER                                                 â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
GM_addStyle(`
/* v9.2.0 UI refinement */
#lss7-tabs{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(160px,.62fr) minmax(0,1fr);gap:6px;overflow:visible;padding:7px 9px;background:var(--bg1);}
#lss7-tabs.player-menu-hidden{grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);}
.lss7-nav-group{display:flex;align-items:stretch;min-width:0;overflow-x:auto;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.018);scrollbar-width:thin;}
.lss7-nav-group-label{display:flex;align-items:center;padding:0 9px;border-right:1px solid var(--b1);color:var(--t4);font-size:7.5px;font-weight:900;letter-spacing:.8px;text-transform:uppercase;white-space:nowrap;}
.lss7-nav-group-tabs{display:flex;align-items:stretch;min-width:max-content;}
.lss7-nav-group .ltab{min-height:34px;padding:8px 10px;font-size:9.5px;display:flex;align-items:center;color:var(--t2);font-weight:800;}
.lss7-nav-group .ltab:hover{color:var(--t1)}.lss7-nav-group .ltab.active{color:#fff!important;text-shadow:0 1px 5px rgba(0,0,0,.28)}
.lss7-nav-alliance{border-color:rgba(59,130,246,.28);background:linear-gradient(90deg,rgba(59,130,246,.07),transparent 38%);}
.lss7-nav-alliance .lss7-nav-group-label{color:var(--blueh);background:rgba(59,130,246,.08);}
.lss7-nav-player .lss7-nav-group-label{color:var(--purpleh);background:rgba(168,85,247,.08);}
.lss7-nav-tools .lss7-nav-group-label{color:var(--t3);background:rgba(148,163,184,.06);}
#lss7-btn .lss7-nav-lbl{color:#f8fafc!important;font-weight:900!important;text-shadow:0 1px 4px rgba(0,0,0,.45)}
#lss7-btn .lss7-nav-events,#lss7-btn .lss7-nav-event{color:#dfffea!important;font-weight:850!important;opacity:1!important}
#lss7-btn{height:50px!important;min-height:50px!important;padding:8px 10px!important;margin:0!important;border-radius:0!important;overflow:visible!important;line-height:normal!important;box-sizing:border-box!important;}
#lss7-btn .lss7-nav-mark.brand-emblem{width:52px!important;height:30px!important;min-width:52px!important;padding:0 6px!important;overflow:hidden!important;border-radius:7px!important;align-items:center!important;justify-content:space-between!important;}
#lss7-btn .lss7-nav-mark.brand-emblem::before{display:none!important;content:none!important;}
#lss7-btn .lss7-nav-mark .brand-letter{font-size:12px!important;}
#lss7-btn .lss7-nav-mark .brand-pro{font-size:4.5px!important;}
#lss7-btn .lss7-nav-mark .brand-signal{width:17px!important;height:15px!important;}
#lss7-btn.nav-logo-only{padding:8px 10px!important;}
#lss7-btn.nav-name-only{padding:0 14px!important;}
#lss7-btn .lss7-nav-copy{justify-content:center!important;}
.lss7-navbar-item{height:50px!important;display:flex!important;align-items:stretch!important;}
.alliance-day-card{position:relative;overflow:hidden;padding:11px 12px!important;background:linear-gradient(135deg,rgba(14,165,233,.055),rgba(34,197,94,.045))!important;}
.alliance-day-card::after{content:'';position:absolute;inset:auto -34px -64px auto;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(34,197,94,.11),transparent 68%);pointer-events:none;}
.alliance-day-head{position:relative;z-index:1;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;}
.alliance-day-head .sl{margin:0;}
.alliance-day-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;}
.alliance-day-metric{display:flex;flex-direction:column;justify-content:center;gap:5px;min-width:0;min-height:54px;padding:9px 10px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.025);}
.alliance-day-metric.earnings{border-color:rgba(34,197,94,.22);background:linear-gradient(125deg,rgba(34,197,94,.10),rgba(14,165,233,.035));}
.alliance-day-metric.potential{border-color:rgba(59,130,246,.28);background:linear-gradient(125deg,rgba(59,130,246,.105),rgba(168,85,247,.04));}
.alliance-day-metric small{color:var(--t3);font-size:7.5px;font-weight:850;text-transform:uppercase;letter-spacing:.35px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.alliance-day-metric b{color:var(--greenh);font:900 15px/1.1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.alliance-day-metric.earnings b,.alliance-day-metric.potential b{font-size:17px;}
.alliance-day-metric.potential b{color:var(--blueh);}
.alliance-day-metric.potential em{color:var(--t4);font-size:7.5px;font-style:normal;line-height:1.25;}
.alliance-day-foot{position:relative;z-index:1;display:block;margin-top:6px;color:var(--t4);font-size:7.5px;line-height:1.35;}
.alliance-activity-note{display:flex;align-items:center;gap:5px;color:var(--greenh);font-size:7.5px;font-weight:800;line-height:1.25;white-space:nowrap;}
.alliance-activity-note i{width:5px;height:5px;border-radius:50%;background:var(--green);box-shadow:0 0 7px var(--green);animation:lpulse 2.4s ease-in-out infinite;}
.overview-section-title{grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;gap:10px;margin:5px 1px -1px;padding:7px 2px 6px;border-bottom:1px solid var(--b1);}
.overview-section-title span{color:var(--t1);font-size:9.5px;font-weight:950;letter-spacing:.55px;text-transform:uppercase;}
.overview-section-title small{color:var(--t4);font-size:7.5px;font-weight:800;}
.overview-card-note{display:block;margin-top:5px;color:var(--t4);font-size:7.5px;line-height:1.3;}
.overview-pill.forecast-date{grid-row:span 2;display:flex;flex-direction:column;justify-content:center;min-width:190px;border-color:rgba(34,197,94,.32);background:linear-gradient(135deg,rgba(34,197,94,.14),rgba(14,165,233,.06));}
.overview-pill.forecast-date b{color:var(--greenh);font-size:13px;white-space:normal;line-height:1.25;}
.overview-pill.forecast-date small{display:block;margin-top:4px;color:var(--t2);font:900 9px/1.2 var(--mono);}
.player-forecast-hero{grid-template-columns:minmax(220px,.8fr) minmax(300px,1.25fr) minmax(210px,.75fr)!important;}
.player-forecast-eta{position:relative;display:flex;flex-direction:column;justify-content:center;min-width:0;padding:15px 17px;border:1px solid rgba(34,197,94,.42);border-radius:10px;background:linear-gradient(135deg,rgba(34,197,94,.16),rgba(14,165,233,.07));box-shadow:0 12px 28px rgba(0,0,0,.12),inset 0 1px rgba(255,255,255,.04);overflow:hidden;}
.player-forecast-eta::after{content:"";position:absolute;right:-38px;top:-58px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,.20),transparent 67%);pointer-events:none;}
.player-forecast-eta-label{position:relative;z-index:1;color:var(--greenh);font-size:8px;font-weight:950;letter-spacing:.75px;text-transform:uppercase;}
.player-forecast-eta strong{position:relative;z-index:1;display:block;margin-top:7px;color:var(--t1);font:950 20px/1.18 var(--head);text-wrap:balance;}
.player-forecast-eta-days{position:relative;z-index:1;display:inline-flex;align-self:flex-start;margin-top:8px;padding:4px 8px;border:1px solid rgba(34,197,94,.35);border-radius:999px;color:var(--greenh);background:rgba(34,197,94,.10);font:950 9px/1 var(--mono);}
.player-forecast-eta small{position:relative;z-index:1;display:block;margin-top:8px;color:var(--t3);font-size:8px;line-height:1.35;}
.player-forecast-eta.waiting{border-color:rgba(245,158,11,.38);background:linear-gradient(135deg,rgba(245,158,11,.13),rgba(59,130,246,.05));}
.player-forecast-eta.waiting .player-forecast-eta-label,.player-forecast-eta.waiting .player-forecast-eta-days{color:var(--amberh);}
.player-forecast-eta.waiting .player-forecast-eta-days{border-color:rgba(245,158,11,.32);background:rgba(245,158,11,.09);}
.player-forecast-eta.reached{border-color:rgba(168,85,247,.38);background:linear-gradient(135deg,rgba(168,85,247,.14),rgba(34,211,238,.05));}
.player-forecast-progress-block{padding:11px 12px;border:1px solid var(--b1);border-radius:9px;background:rgba(255,255,255,.018);}
.player-forecast-progress-meta{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px;color:var(--t3);font-size:8.5px;font-weight:850;}
.player-forecast-progress-meta b{color:var(--greenh);font:950 11px/1 var(--mono);}
.player-forecast-progress-meta.foot{margin:6px 0 0;color:var(--t4);font-size:7.5px;font-weight:750;}
.forecast-target-hero{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(0,1.4fr);gap:10px;padding:10px;border:1px solid rgba(34,197,94,.32);border-radius:11px;background:linear-gradient(135deg,rgba(34,197,94,.10),rgba(14,165,233,.045));}
.forecast-target-date{position:relative;display:flex;flex-direction:column;justify-content:center;min-height:110px;padding:15px 17px;border:1px solid rgba(34,197,94,.34);border-radius:9px;background:rgba(34,197,94,.07);overflow:hidden;}
.forecast-target-date::after{content:"";position:absolute;right:-34px;top:-48px;width:135px;height:135px;border-radius:50%;background:radial-gradient(circle,rgba(74,222,128,.18),transparent 68%);}
.forecast-target-date span{position:relative;z-index:1;color:var(--greenh);font-size:8px;font-weight:950;letter-spacing:.75px;text-transform:uppercase;}
.forecast-target-date strong{position:relative;z-index:1;display:block;margin-top:7px;color:var(--t1);font:950 21px/1.18 var(--head);text-wrap:balance;}
.forecast-target-date b{position:relative;z-index:1;display:inline-flex;align-self:flex-start;margin-top:9px;padding:4px 8px;border-radius:999px;border:1px solid rgba(34,197,94,.35);color:var(--greenh);background:rgba(34,197,94,.09);font:950 9px/1 var(--mono);}
.forecast-target-summary{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;}
.forecast-target-summary>span{display:flex;flex-direction:column;justify-content:center;min-width:0;padding:10px 11px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.022);}
.forecast-target-summary small{color:var(--t4);font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;}
.forecast-target-summary b{display:block;margin-top:5px;color:var(--t1);font:950 12px/1.1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.forecast-target-hero.waiting{border-color:rgba(245,158,11,.28);background:linear-gradient(135deg,rgba(245,158,11,.09),rgba(59,130,246,.035));}
.forecast-target-hero.waiting .forecast-target-date{border-color:rgba(245,158,11,.30);background:rgba(245,158,11,.06);}
.forecast-target-hero.waiting .forecast-target-date span,.forecast-target-hero.waiting .forecast-target-date b{color:var(--amberh);}
.forecast-target-hero.reached{border-color:rgba(168,85,247,.32);background:linear-gradient(135deg,rgba(168,85,247,.10),rgba(34,211,238,.04));}
.player-records{padding:11px;border:1px solid var(--b1);border-radius:9px;background:linear-gradient(145deg,rgba(168,85,247,.055),rgba(59,130,246,.025));}
.player-records-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:9px;}
.player-records-head>div{min-width:0}.player-records-head b{display:block;color:var(--t1);font-size:10px}.player-records-head span{display:block;margin-top:2px;color:var(--t4);font-size:7.5px}
.player-records-head em{flex:0 0 auto;padding:4px 7px;border:1px solid rgba(168,85,247,.30);border-radius:999px;color:var(--purpleh);background:rgba(168,85,247,.08);font-size:7.5px;font-style:normal;font-weight:900;}
.player-record-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
.player-record-card{position:relative;min-width:0;padding:9px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.02);overflow:hidden;}
.player-record-card::before{content:"";position:absolute;left:0;right:0;top:0;height:2px;background:var(--record-accent,var(--blue));opacity:.55;}
.player-record-card.best{--record-accent:var(--green)}.player-record-card.streak{--record-accent:var(--purple)}.player-record-card.rank{--record-accent:var(--amber)}
.player-record-card span{display:block;color:var(--t4);font-size:7px;font-weight:900;text-transform:uppercase;letter-spacing:.4px;}
.player-record-card b{display:block;margin-top:5px;color:var(--t1);font:950 12px/1.1 var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.player-record-card small{display:block;margin-top:4px;color:var(--t3);font-size:7.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.player-milestones{display:flex;align-items:stretch;gap:7px;margin-top:9px;overflow-x:auto;padding-bottom:2px;}
.player-milestone{display:flex;align-items:center;gap:7px;min-width:190px;padding:8px 9px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.015);}
.player-milestone.reached{border-color:rgba(34,197,94,.25);background:rgba(34,197,94,.055);}
.player-milestone.next{border-color:rgba(245,158,11,.30);background:rgba(245,158,11,.06);}
.player-milestone-dot{display:grid;place-items:center;flex:0 0 22px;width:22px;height:22px;border-radius:50%;color:var(--greenh);background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.30);font-weight:950;}
.player-milestone.next .player-milestone-dot{color:var(--amberh);background:rgba(245,158,11,.11);border-color:rgba(245,158,11,.30);}
.player-milestone div{min-width:0}.player-milestone b{display:block;color:var(--t1);font-size:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.player-milestone small{display:block;margin-top:3px;color:var(--t4);font:800 7px/1.2 var(--mono);white-space:nowrap;}
#lss7.theme-light .alliance-day-metric,#lss7.theme-summer .alliance-day-metric{background:rgba(255,255,255,.66);}
.author-message{position:relative;overflow:hidden;background:linear-gradient(145deg,rgba(59,130,246,.06),rgba(34,197,94,.025));}
.author-message::after{content:'VS';position:absolute;right:18px;bottom:-18px;color:var(--t1);font:950 76px/1 var(--head);opacity:.025;pointer-events:none;}
.author-message-content{position:relative;z-index:1;max-width:980px;padding:3px 2px;color:var(--t2);font-size:9.5px;line-height:1.65;}
.author-message-lead{margin-bottom:12px;color:var(--t1);font:850 17px/1.25 var(--head);}
.author-message-content p{margin:0 0 10px;}
.author-message-content h4{margin:16px 0 7px;padding-top:11px;border-top:1px solid var(--b1);color:var(--blueh);font:850 11px/1.2 var(--head);}
.author-message-thanks{margin-top:14px!important;color:var(--greenh);font-weight:850;}
@media(max-width:1050px){.player-forecast-hero{grid-template-columns:1fr 1.25fr!important}.player-forecast-hero-grid{grid-column:1/-1;grid-template-columns:repeat(3,minmax(0,1fr))}.player-record-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:760px){.alliance-day-head{align-items:flex-start;flex-direction:column}.author-message-content{font-size:9px}.player-forecast-hero{grid-template-columns:1fr!important}.player-forecast-hero-grid{grid-column:auto}.overview-pill.forecast-date{grid-row:auto;min-width:0}.forecast-target-hero{grid-template-columns:1fr}}
@media(max-width:560px){.alliance-day-grid{grid-template-columns:1fr}.overview-section-title{align-items:flex-start;flex-direction:column;gap:3px}.player-forecast-eta strong,.forecast-target-date strong{font-size:17px}.player-record-grid,.forecast-target-summary{grid-template-columns:1fr}.player-records-head{align-items:flex-start;flex-direction:column}}
.ltab[data-tab="tp-event"]{position:relative;isolation:isolate;color:#ffe8a3!important;border-color:rgba(245,158,11,.36)!important;background:linear-gradient(135deg,rgba(245,158,11,.18),rgba(239,68,68,.08))!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.025),0 0 0 rgba(245,158,11,0);animation:lss7-event-tab 2.6s ease-in-out infinite;}
.ltab[data-tab="tp-event"]::after{content:'LIVE';margin-left:6px;padding:2px 4px;border-radius:4px;background:#e11d48;color:#fff;font:900 6px/1 var(--mono);letter-spacing:.5px;box-shadow:0 0 8px rgba(225,29,72,.45);}
.ltab[data-tab="tp-event"]:hover,.ltab[data-tab="tp-event"].active{color:#fff7d6!important;border-color:rgba(245,158,11,.68)!important;background:linear-gradient(135deg,rgba(245,158,11,.30),rgba(225,29,72,.16))!important;}
#lss7.theme-light .ltab[data-tab="tp-event"],#lss7.theme-summer .ltab[data-tab="tp-event"]{color:#744500!important;background:linear-gradient(135deg,#fff0b8,#ffe1d6)!important;border-color:#d79220!important;}
#lss7.theme-light .ltab[data-tab="tp-event"].active,#lss7.theme-summer .ltab[data-tab="tp-event"].active{color:#fff!important;background:linear-gradient(135deg,#bd6811,#bd2847)!important;}
@keyframes lss7-event-tab{0%,100%{box-shadow:0 0 0 rgba(245,158,11,0)}50%{box-shadow:0 0 14px rgba(245,158,11,.24)}}
@media(prefers-reduced-motion:reduce){.ltab[data-tab="tp-event"]{animation:none!important}}
.brand-emblem{position:relative;display:inline-flex;align-items:center;justify-content:space-between;gap:6px;overflow:hidden;box-sizing:border-box;border:1px solid rgba(96,165,250,.42);border-radius:9px;background:linear-gradient(120deg,#071426 0%,#12385b 48%,#075e70 100%);box-shadow:0 6px 18px rgba(2,12,27,.30),inset 0 1px rgba(255,255,255,.17),inset 0 -1px rgba(2,12,27,.32);}
.brand-emblem::before{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 18%,rgba(255,255,255,.16) 46%,transparent 72%);transform:translateX(-120%);animation:lss7-brand-sheen 5.4s ease-in-out infinite;}
.brand-emblem::after{content:'';position:absolute;left:0;right:0;bottom:0;height:2px;background:linear-gradient(90deg,#38bdf8,#2dd4bf,#4ade80);box-shadow:0 0 8px rgba(45,212,191,.5);}
.brand-core{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:center;align-items:flex-start;line-height:1;}
.brand-letter{display:block;color:#fff;font-family:var(--head);font-weight:950;line-height:.92;letter-spacing:0;white-space:nowrap;transform:none!important;text-shadow:0 1px 4px rgba(0,0,0,.45);}
.brand-pro{display:block;margin-top:2px;color:#8ee8dd;font:900 5px/1 var(--mono);letter-spacing:1.1px;}
.brand-signal{position:relative;z-index:1;display:flex;align-items:flex-end;justify-content:flex-end;gap:2px;width:25px;height:22px;padding-left:6px;border-left:1px solid rgba(255,255,255,.17);}
.brand-signal i{display:block;width:3px;border-radius:3px 3px 0 0;background:linear-gradient(180deg,#a7f3d0,#22d3ee);box-shadow:0 0 5px rgba(45,212,191,.5);animation:lss7-brand-bars 2.8s ease-in-out infinite;}
.brand-signal i:nth-child(1){height:5px;animation-delay:-.6s}.brand-signal i:nth-child(2){height:9px;animation-delay:-.3s}.brand-signal i:nth-child(3){height:14px}.brand-signal i:nth-child(4){height:19px;animation-delay:.25s;background:linear-gradient(180deg,#bfdbfe,#60a5fa)}
.hd-mark.brand-emblem{width:82px;height:40px;transform:none;padding:0 9px;flex-shrink:0;}
.hd-mark.brand-emblem .brand-letter{font-size:17px;}.hd-mark.brand-emblem .brand-pro{font-size:5px}.hd-mark.brand-emblem .brand-signal{width:28px;height:23px;}
.lss7-nav-mark.brand-emblem{width:52px;height:30px;padding:0 6px;transform:none;flex-shrink:0;}
.lss7-nav-mark.brand-emblem .brand-letter{font-size:12px;}
@keyframes lss7-brand-sheen{0%,64%{transform:translateX(-110%)}82%,100%{transform:translateX(125%)}}
@keyframes lss7-brand-bars{0%,100%{opacity:.72;transform:scaleY(.88)}50%{opacity:1;transform:scaleY(1.08)}}
.fleet-command{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 15px;margin-bottom:8px;border:1px solid var(--b1);border-radius:8px;background:linear-gradient(125deg,rgba(59,130,246,.11),rgba(14,165,233,.035) 58%,transparent);}
.fleet-command-copy{min-width:0}.fleet-command-eyebrow{display:block;color:var(--blueh);font-size:8px;font-weight:900;letter-spacing:.8px;text-transform:uppercase}.fleet-command-title{display:block;margin-top:3px;color:var(--t1);font:850 17px/1.2 var(--head)}.fleet-command-sub{display:block;margin-top:4px;color:var(--t3);font-size:9.5px;line-height:1.45;max-width:700px}.fleet-command-badge{flex-shrink:0;padding:5px 8px;border:1px solid rgba(34,197,94,.28);border-radius:6px;color:var(--greenh);background:rgba(34,197,94,.08);font:850 9px/1 var(--mono)}
.fleet-status-kpis{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;margin:9px 0;}
.fleet-status-kpi{padding:10px;border:1px solid var(--b1);border-radius:7px;background:rgba(255,255,255,.025);}
.fleet-status-kpi b{font-size:17px}.fleet-status-kpi span{font-size:8px;line-height:1.3;}
.fleet-panel{margin-top:9px;padding:12px;border:1px solid var(--b1);border-radius:8px;background:linear-gradient(145deg,rgba(255,255,255,.028),rgba(255,255,255,.008));}
.fleet-panel-live{position:relative;overflow:hidden;}
.fleet-panel-live::after{content:'';position:absolute;inset:0 auto 0 0;width:3px;background:linear-gradient(180deg,var(--green),var(--cyan));opacity:.72;}
.fleet-status-layout{display:grid;grid-template-columns:minmax(235px,.72fr) minmax(320px,1.28fr);gap:12px;align-items:start;}
.fleet-status-layout>#lss7-donut,.fleet-status-layout>#lss7-vbars{min-width:0;}
.fleet-panel .sec-h{margin-top:0;}
.asset-kpis.asset-kpis-pro{grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;}
.asset-kpi.pro{min-height:59px;padding:9px 10px;border-radius:7px;}
.asset-kpi-note{display:block;margin-top:3px;color:var(--t4);font-size:7.5px;line-height:1.25;}
.building-category-card{position:relative;overflow:hidden;}
.building-category-bar{position:absolute;left:0;right:0;bottom:0;height:3px;background:rgba(148,163,184,.10);}
.building-category-bar i{display:block;height:100%;background:var(--cat);}
.building-detail-row{grid-template-columns:minmax(170px,1.5fr) repeat(5,minmax(62px,.45fr));}
.extension-row{position:relative;overflow:hidden;padding-bottom:10px;}
.extension-progress{position:absolute;left:10px;right:10px;bottom:4px;height:3px;border-radius:3px;background:rgba(148,163,184,.10);overflow:hidden;}
.extension-progress i{display:block;height:100%;background:linear-gradient(90deg,var(--green),var(--cyan));}
.player-daily-panel{margin-top:10px;padding:11px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.018);}
.player-daily-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:7px}.player-daily-head b{color:var(--t1);font-size:10px}.player-daily-head span{color:var(--t4);font-size:8px}
.player-daily-row{display:grid;grid-template-columns:68px minmax(60px,1fr) 104px;align-items:center;gap:8px;min-height:25px;border-top:1px solid var(--b0);font-size:8.5px}.player-daily-row:first-child{border-top:0}.player-daily-day{color:var(--t3)}.player-daily-bar{height:5px;border-radius:5px;background:rgba(148,163,184,.10);overflow:hidden}.player-daily-bar i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#2563eb,#22c55e)}.player-daily-val{text-align:right;color:var(--greenh);font:800 8.5px/1 var(--mono)}
.nav-style-setting{position:relative;overflow:hidden;border-color:rgba(59,130,246,.32)!important;background:linear-gradient(135deg,rgba(59,130,246,.10),rgba(14,165,233,.035))!important;box-shadow:0 8px 24px rgba(2,12,27,.10);}
.nav-style-setting::before{content:'HEADER';position:absolute;right:10px;top:8px;color:rgba(96,165,250,.38);font:900 8px/1 var(--mono);letter-spacing:1px;}
.player-forecast-setting{margin:0 12px 11px;padding-top:10px;border-top:1px solid var(--b1);}
.lss7-update-install{display:inline-flex;align-items:center;justify-content:center;min-height:25px;padding:5px 9px;border:1px solid rgba(34,197,94,.38);border-radius:6px;background:rgba(34,197,94,.13);color:var(--greenh)!important;font-size:8.5px;font-weight:900;text-decoration:none!important;white-space:nowrap;}
.lss7-update-install:hover{background:rgba(34,197,94,.23);border-color:rgba(34,197,94,.62);}
.lss7-update-close{order:99!important;margin-left:4px!important;flex:0 0 22px!important;}
.team-name-row{display:flex;align-items:center;gap:6px;min-width:0}.team-activity-dot{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;font-size:0;color:transparent;background:#94a3b8;border:2px solid rgba(255,255,255,.20);box-shadow:0 0 0 1px rgba(15,23,42,.35),0 0 9px rgba(148,163,184,.28);flex:0 0 14px;}.team-activity-dot.online{background:#22c55e!important;box-shadow:0 0 0 1px rgba(15,23,42,.35),0 0 12px rgba(34,197,94,.62)!important}.team-activity-dot.recent{background:#e5e7eb!important;box-shadow:0 0 0 1px rgba(15,23,42,.35),0 0 9px rgba(226,232,240,.38)!important}.team-activity-dot.week{background:#3b82f6!important;box-shadow:0 0 0 1px rgba(15,23,42,.35),0 0 12px rgba(59,130,246,.58)!important}.team-activity-dot.two-weeks{background:#f59e0b!important;box-shadow:0 0 0 1px rgba(15,23,42,.35),0 0 12px rgba(245,158,11,.58)!important}.team-activity-dot.month{background:#ef4444!important;box-shadow:0 0 0 1px rgba(15,23,42,.35),0 0 12px rgba(239,68,68,.62)!important}.team-activity-dot.unknown{background:#94a3b8!important;}
.team-meta-line{display:flex;align-items:center;gap:11px;flex-wrap:wrap;margin-top:4px;color:var(--t4);font-size:8px;line-height:1.35}.team-meta-line b{color:var(--t2);font-weight:850}.team-grade{color:var(--blueh)!important}.team-rank{color:var(--amberh)!important}.team-credits{color:var(--greenh)!important}.team-last-online{display:inline-flex;align-items:center;min-height:17px;padding:2px 7px;border:1px solid var(--b1);border-radius:999px;background:rgba(148,163,184,.08);color:var(--t2)!important;font-weight:900;letter-spacing:.01em}.team-last-online.online{border-color:rgba(34,197,94,.38);background:rgba(34,197,94,.12);color:#86efac!important}.team-last-online.recent{border-color:rgba(226,232,240,.36);background:rgba(226,232,240,.11);color:#f8fafc!important}.team-last-online.week{border-color:rgba(59,130,246,.42);background:rgba(59,130,246,.13);color:#bfdbfe!important}.team-last-online.two-weeks{border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.14);color:#fde68a!important}.team-last-online.month{border-color:rgba(239,68,68,.44);background:rgba(239,68,68,.13);color:#fecaca!important}.team-last-online.unknown{color:var(--t3)!important}
#lss7.theme-light .team-last-online.recent,#lss7.theme-summer .team-last-online.recent{color:#334155!important;background:rgba(100,116,139,.11);border-color:rgba(100,116,139,.28)}#lss7.theme-light .team-last-online.online,#lss7.theme-summer .team-last-online.online{color:#166534!important}#lss7.theme-light .team-last-online.week,#lss7.theme-summer .team-last-online.week{color:#1d4ed8!important}#lss7.theme-light .team-last-online.two-weeks,#lss7.theme-summer .team-last-online.two-weeks{color:#92400e!important}#lss7.theme-light .team-last-online.month,#lss7.theme-summer .team-last-online.month{color:#991b1b!important}
.team-card-tools{display:flex;align-items:center;gap:5px;justify-self:end;}
.team-mail{color:var(--cyanh)!important;border-color:rgba(34,211,238,.28)!important;background:rgba(34,211,238,.08)!important;}
.team-command{position:relative;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;margin:12px 12px 0;padding:14px 15px;border:1px solid rgba(59,130,246,.25);border-radius:10px;background:linear-gradient(135deg,rgba(59,130,246,.13),rgba(34,211,238,.045));overflow:hidden;}
.team-command::after{content:'';position:absolute;right:-42px;top:-66px;width:178px;height:178px;border-radius:50%;background:radial-gradient(circle,rgba(34,211,238,.16),transparent 66%);pointer-events:none;}
.team-command-copy,.team-command-stats{position:relative;z-index:1;}
.team-command-eyebrow{display:block;color:var(--blueh);font-size:8px;font-weight:950;letter-spacing:.9px;text-transform:uppercase;}
.team-command-title{display:block;margin-top:4px;color:var(--t1);font:950 17px/1.15 var(--head);}
.team-command-sub{display:block;margin-top:5px;color:var(--t3);font-size:10px;line-height:1.45;max-width:820px;}
.team-command-stats{display:grid;grid-template-columns:repeat(3,minmax(78px,1fr));gap:7px;min-width:285px;}
.team-command-stats span{padding:8px 9px;border:1px solid var(--b1);border-radius:8px;background:rgba(255,255,255,.028);min-width:0;}
.team-command-stats b{display:block;color:var(--t1);font:950 13px/1 var(--mono);}
.team-command-stats small{display:block;margin-top:4px;color:var(--t4);font-size:7.5px;font-weight:900;text-transform:uppercase;letter-spacing:.45px;}
.team-summary{gap:9px!important;padding:12px!important;}
.team-summary-card{position:relative;overflow:hidden;border-radius:9px!important;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,.012))!important;box-shadow:0 8px 22px rgba(2,12,27,.10);}
.team-summary-card::before{content:'';position:absolute;left:0;right:0;top:0;height:2px;background:var(--team-accent,var(--blue));opacity:.58;}
.team-summary-card.total{--team-accent:var(--blue)}.team-summary-card.online{--team-accent:var(--green)}.team-summary-card.lead{--team-accent:var(--amber)}.team-summary-card.special{--team-accent:var(--cyan)}.team-summary-card.regular{--team-accent:var(--t3)}
.team-category{margin:0 12px 11px!important;border-radius:10px!important;background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.008))!important;box-shadow:0 8px 24px rgba(2,12,27,.08);}
.team-category-head{padding:10px 11px!important;background:linear-gradient(90deg,rgba(255,255,255,.035),rgba(255,255,255,.012))!important;}
.team-category-title{font-size:11px!important;}
.team-category-count{min-width:25px;text-align:center;padding:3px 7px;border:1px solid var(--b1);border-radius:999px;background:rgba(255,255,255,.035);color:var(--t2)!important;}
.team-grid{gap:10px!important;padding:10px!important;}
.team-card{grid-template-columns:44px minmax(0,1fr) auto!important;gap:10px!important;padding:11px!important;border-radius:10px!important;background:linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.012))!important;box-shadow:0 7px 18px rgba(2,12,27,.08);}
.team-card:hover{border-color:rgba(59,130,246,.32)!important;box-shadow:0 12px 26px rgba(2,12,27,.16),0 0 18px rgba(59,130,246,.08);}
.team-avatar{width:44px!important;height:44px!important;border-radius:10px!important;background:linear-gradient(145deg,rgba(59,130,246,.22),rgba(34,197,94,.15))!important;box-shadow:0 0 18px rgba(34,211,238,.07) inset;}
.team-name{font-size:12px!important;}
.team-open{width:30px!important;height:30px!important;border-radius:8px!important;}
@media(max-width:780px){.team-command{grid-template-columns:1fr}.team-command-stats{min-width:0;grid-template-columns:repeat(3,minmax(0,1fr));}}
@media(max-width:520px){.team-command-stats{grid-template-columns:1fr}.team-summary{grid-template-columns:1fr!important}}
.nav-style-showcase{display:grid;grid-template-columns:minmax(210px,.72fr) minmax(0,1.28fr);gap:12px;align-items:center;margin:9px 0 10px;}
.nav-style-preview-shell{padding:11px;border:1px solid var(--b1);border-radius:8px;background:#121923;}
.nav-style-preview{min-height:42px;display:flex;align-items:center;gap:8px;padding:5px 9px;border:1px solid rgba(148,163,184,.18);border-radius:7px;background:linear-gradient(180deg,#202a38,#141c27);color:#f8fafc;}
.nav-style-preview .brand-emblem{width:52px;height:29px;padding:0 6px}.nav-style-preview .brand-letter{font-size:12px}.nav-style-preview .brand-signal{width:17px;height:15px}.nav-style-preview-copy{min-width:0;display:flex;flex-direction:column;gap:2px}.nav-style-preview-copy b{font-size:10px}.nav-style-preview-copy span{color:#86efac;font-size:7.5px}.nav-style-preview.preview-logo .nav-style-preview-copy,.nav-style-preview.preview-name .nav-style-preview-copy span,.nav-style-preview.preview-no-event .nav-style-preview-copy span{display:none}.nav-style-preview.preview-name .brand-emblem{display:none}
.prof-placement{display:flex!important;max-width:none!important;min-height:78px!important;padding:12px 14px 12px 54px!important;border-radius:11px!important;font-size:inherit!important;white-space:normal!important;overflow:hidden!important;}
.prof-placement-main{display:flex!important;align-items:center!important;gap:9px!important;min-width:0!important;}
@media(max-width:900px){.fleet-status-layout{grid-template-columns:1fr}}
@media(max-width:920px){#lss7-tabs,#lss7-tabs.player-menu-hidden{display:flex;overflow-x:auto}.lss7-nav-group{flex:0 0 auto;max-width:78vw}}
@media(max-width:760px){.asset-kpis.asset-kpis-pro{grid-template-columns:repeat(2,minmax(0,1fr))}.building-detail-row{grid-template-columns:minmax(140px,1fr) repeat(3,60px)}.building-detail-row .building-detail-stat:nth-last-child(-n+2){display:none}.nav-style-showcase{grid-template-columns:1fr}.fleet-command{align-items:stretch;flex-direction:column}.fleet-command-badge{align-self:flex-start}.fleet-panel{padding:9px}}

/* v9.4.0 Premium Theme System */
#lss7{
  --premium-bg:var(--bg0);
  --premium-body:var(--bg1);
  --premium-surface:rgba(255,255,255,.028);
  --premium-surface-strong:rgba(255,255,255,.052);
  --premium-border:var(--b1);
  --premium-border-strong:var(--b2);
  --premium-highlight:rgba(255,255,255,.065);
  --premium-shadow:0 16px 42px rgba(0,0,0,.25);
  --premium-card-shadow:0 8px 24px rgba(0,0,0,.14),inset 0 1px rgba(255,255,255,.035);
  --premium-accent:var(--blue);
  --premium-accent-2:var(--cyan);
  --premium-radius:12px;
}
#lss7.theme-dark{
  --bg0:#070b12;--bg1:#0b111b;--bg2:#101827;--bg3:#162133;--bg4:#1b2940;
  --b0:rgba(174,203,242,.045);--b1:rgba(174,203,242,.09);--b2:rgba(174,203,242,.16);--b3:rgba(174,203,242,.24);
  --t1:#f5f8fd;--t2:#d5deeb;--t3:#9eacbf;--t4:#718096;
  --blue:#4c8dff;--blueh:#82b1ff;--cyan:#2cc7da;--cyanh:#75e3ee;
  --premium-bg:#070b12;--premium-body:#09101a;--premium-surface:rgba(19,31,49,.82);
  --premium-surface-strong:rgba(25,41,64,.92);--premium-border:rgba(151,185,229,.11);
  --premium-border-strong:rgba(151,185,229,.20);--premium-highlight:rgba(130,177,255,.07);
  --premium-shadow:0 24px 70px rgba(0,0,0,.56);--premium-card-shadow:0 12px 30px rgba(0,0,0,.23),inset 0 1px rgba(255,255,255,.045);
}
#lss7.theme-light{
  --bg0:#f4f6fa;--bg1:#edf1f6;--bg2:#e5eaf1;--bg3:#dce3ec;--bg4:#d2dbe7;
  --b0:rgba(25,43,67,.04);--b1:rgba(25,43,67,.09);--b2:rgba(25,43,67,.16);--b3:rgba(25,43,67,.24);
  --t1:#142033;--t2:#29384d;--t3:#526177;--t4:#748196;
  --blue:#356fd1;--blueh:#2459b2;--cyan:#168a9b;--cyanh:#0c6d7d;
  --premium-bg:#f5f7fa;--premium-body:#eef2f7;--premium-surface:rgba(255,255,255,.82);
  --premium-surface-strong:#fff;--premium-border:rgba(36,57,84,.10);
  --premium-border-strong:rgba(36,57,84,.18);--premium-highlight:rgba(53,111,209,.055);
  --premium-shadow:0 22px 60px rgba(36,57,84,.18);--premium-card-shadow:0 10px 28px rgba(36,57,84,.09),inset 0 1px #fff;
}
#lss7.theme-summer{
  --premium-bg:#f3fafb;--premium-body:#edf7f7;--premium-surface:rgba(255,255,255,.76);
  --premium-surface-strong:rgba(255,255,255,.94);--premium-border:rgba(27,86,108,.11);
  --premium-border-strong:rgba(27,86,108,.19);--premium-highlight:rgba(22,135,200,.065);
  --premium-shadow:0 24px 64px rgba(32,91,111,.20);--premium-card-shadow:0 11px 28px rgba(32,91,111,.09),inset 0 1px rgba(255,255,255,.95);
}
#lss7.theme-summer-dark{
  --bg0:#060b17;--bg1:#091225;--bg2:#0e1a32;--bg3:#142441;--bg4:#1b2f50;
  --b0:rgba(178,205,255,.04);--b1:rgba(178,205,255,.09);--b2:rgba(178,205,255,.16);--b3:rgba(178,205,255,.24);
  --t1:#f5f8ff;--t2:#d8e3f7;--t3:#9fb2d0;--t4:#7185a7;
  --premium-bg:#060b17;--premium-body:#081123;--premium-surface:rgba(13,27,52,.83);
  --premium-surface-strong:rgba(19,38,70,.93);--premium-border:rgba(166,197,255,.12);
  --premium-border-strong:rgba(166,197,255,.21);--premium-highlight:rgba(117,158,255,.075);
  --premium-shadow:0 26px 72px rgba(0,0,0,.57);--premium-card-shadow:0 12px 30px rgba(0,0,0,.25),inset 0 1px rgba(255,255,255,.045);
}
#lss7.theme-lcars{
  --premium-bg:#06070a;--premium-body:#080a0e;--premium-surface:#0c0f15;
  --premium-surface-strong:#11151d;--premium-border:rgba(217,166,93,.16);
  --premium-border-strong:rgba(217,166,93,.28);--premium-highlight:rgba(232,169,88,.065);
  --premium-shadow:0 25px 70px rgba(0,0,0,.64);--premium-card-shadow:0 11px 28px rgba(0,0,0,.30),inset 0 1px rgba(255,255,255,.025);
}
#lss7{
  background:var(--premium-bg);
  border-color:var(--premium-border-strong);
  box-shadow:var(--premium-shadow);
}
#lss7 #lss7-body{background:var(--premium-body);}
#lss7 #lss7-hd{
  min-height:72px;padding:15px 17px;
  border-bottom-color:var(--premium-border);
  box-shadow:inset 0 -1px var(--premium-highlight);
}
#lss7.theme-dark #lss7-hd{background:radial-gradient(circle at 72% 0,rgba(76,141,255,.14),transparent 38%),linear-gradient(145deg,#101b2d,#070b12 72%);}
#lss7.theme-light #lss7-hd{background:radial-gradient(circle at 72% 0,rgba(53,111,209,.11),transparent 40%),linear-gradient(145deg,#fff,#edf2f7 74%);}
#lss7.theme-summer #lss7-hd{background:radial-gradient(circle at 75% 0,rgba(255,208,79,.24),transparent 34%),linear-gradient(135deg,#d9f2fb,#e8f8f2 58%,#fff4c9);}
#lss7.theme-summer-dark #lss7-hd{background:radial-gradient(circle at 76% -10%,rgba(129,156,255,.19),transparent 38%),linear-gradient(145deg,#111d3a,#060b17 72%);}
#lss7 .hd-title{font-size:15px;font-weight:900;letter-spacing:.15px;}
#lss7 .hd-sub{margin-top:3px;font-size:9px;font-weight:600;letter-spacing:.18px;}
#lss7 .hd-meta{gap:8px;}
#lss7 .hd-events{gap:10px;}
  min-width:248px;max-width:286px;min-height:50px;
  grid-template-columns:minmax(150px,1fr) auto;gap:11px;
  padding:7px 10px 7px 13px;border-radius:11px;
  box-shadow:0 10px 24px rgba(0,0,0,.18),inset 0 1px rgba(255,255,255,.055);
}
#lss7 .prof-strip,#lss7 .sc,#lss7 .set-group,#lss7 .asset-section,#lss7 .fleet-panel,
#lss7 .event-card,#lss7 .vehicle-summary-card,#lss7 .forecast-controls,#lss7 .forecast-chart-box,
  border-color:var(--premium-border);
  border-radius:var(--premium-radius);
  background:var(--premium-surface);
  box-shadow:var(--premium-card-shadow);
}
  border-color:var(--premium-border-strong);
  box-shadow:0 14px 32px rgba(0,0,0,.16),inset 0 1px var(--premium-highlight);
}
#lss7 #lss7-qs,#lss7 #lss7-tabs{
  background:color-mix(in srgb,var(--premium-body) 92%,transparent);
  border-color:var(--premium-border);
  backdrop-filter:blur(14px) saturate(1.12);
}
#lss7 .lss7-nav-group{border-color:var(--premium-border);border-radius:10px;background:var(--premium-surface);}
#lss7 .lss7-nav-group-label{border-color:var(--premium-border);font-size:7px;letter-spacing:1px;}
#lss7 .lss7-nav-group .ltab{min-height:36px;border-radius:7px;margin:3px;padding:8px 11px;transition:background .16s ease,color .16s ease,box-shadow .16s ease,transform .16s ease;}
#lss7 .lss7-nav-group .ltab:hover{transform:translateY(-1px);background:var(--premium-highlight);}
#lss7 .lss7-nav-group .ltab.active{background:linear-gradient(135deg,var(--premium-accent),var(--premium-accent-2));box-shadow:0 7px 17px color-mix(in srgb,var(--premium-accent) 25%,transparent);}
#lss7 .qs-cell{background:transparent;}
#lss7 .qs-cell:hover{background:var(--premium-highlight);}
  min-height:32px;border-color:var(--premium-border-strong);border-radius:8px;
  background:linear-gradient(180deg,var(--premium-surface-strong),var(--premium-surface));
  box-shadow:inset 0 1px var(--premium-highlight),0 5px 14px rgba(0,0,0,.08);
  font-weight:850;transition:transform .15s ease,box-shadow .15s ease,border-color .15s ease,background .15s ease;
}
#lss7 .lss7-select,#lss7 input,#lss7 select,#lss7 textarea{
  border-color:var(--premium-border-strong)!important;border-radius:8px!important;
  background:var(--premium-surface-strong)!important;color:var(--t1)!important;
  box-shadow:inset 0 1px 2px rgba(0,0,0,.08),0 1px var(--premium-highlight);
}
#lss7 .lss7-select:focus,#lss7 input:focus,#lss7 select:focus,#lss7 textarea:focus{outline:none!important;border-color:var(--premium-accent)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--premium-accent) 16%,transparent)!important;}
  border-color:var(--premium-border);background:var(--premium-surface);box-shadow:0 5px 15px rgba(0,0,0,.07);
}
  background:linear-gradient(135deg,color-mix(in srgb,var(--premium-accent) 11%,var(--premium-surface)),var(--premium-surface));
  border-color:color-mix(in srgb,var(--premium-accent) 25%,var(--premium-border));
}
  background:linear-gradient(90deg,var(--premium-highlight),transparent);
  border-color:var(--premium-border);
}
#lss7 table th{background:var(--premium-surface-strong)!important;color:var(--t3)!important;border-color:var(--premium-border)!important;}
#lss7 table td{border-color:var(--premium-border)!important;}
#lss7 #lss7-ft{background:var(--premium-body);border-color:var(--premium-border);padding:9px 13px;}
  background:rgba(255,255,255,.86);
}
  background:rgba(255,255,255,.79);
}
#lss7.theme-lcars{border-radius:18px 8px 8px 18px;}
#lss7.theme-lcars #lss7-hd{min-height:92px;background:radial-gradient(circle at 86% 20%,rgba(133,214,255,.08),transparent 34%),linear-gradient(145deg,#0b0d12,#050609);border-color:rgba(232,169,88,.22);}
#lss7.theme-lcars #lss7-hd .hd-row{margin-top:19px;}
#lss7.theme-lcars .sc,#lss7.theme-lcars .set-group,#lss7.theme-lcars .asset-section,#lss7.theme-lcars .fleet-panel,
#lss7.theme-lcars .event-card,#lss7.theme-lcars .vehicle-summary-card,#lss7.theme-lcars .forecast-controls,
  border-radius:18px 7px 7px 18px;background:#0c0f15;border-color:rgba(232,169,88,.18);
  box-shadow:inset 5px 0 rgba(232,169,88,.75),var(--premium-card-shadow);
}
#lss7.theme-lcars .lss7-nav-group{border-radius:18px 7px 7px 18px;background:#0c0f15;}
#lss7.theme-lcars .lss7-nav-group .ltab{border-radius:13px 5px 5px 13px;background:#10141b;border-color:rgba(232,169,88,.17);}
#lss7.theme-lcars .lss7-nav-group .ltab.active{color:#ffe2aa!important;background:#241b11!important;border-color:rgba(232,169,88,.52);box-shadow:inset 5px 0 #e8a958;}
@media(max-width:1180px){
  #lss7 .hd-events{position:static;transform:none;margin-right:auto;overflow-x:auto;justify-content:flex-start;}
}
@media(max-width:760px){
  #lss7 #lss7-hd{padding:12px;}
}

/* Credit income notifications */
.lss7-credit-popups{
  position:fixed;z-index:10060;display:flex;flex-direction:column;gap:10px;
  width:min(370px,calc(100vw - 24px));pointer-events:none;
}
.lss7-credit-popups.size-small{width:min(310px,calc(100vw - 24px));}
.lss7-credit-popups.size-medium{width:min(370px,calc(100vw - 24px));}
.lss7-credit-popups.size-large{width:min(440px,calc(100vw - 24px));}
.lss7-credit-popups.pos-right-top{right:14px;top:66px;align-items:flex-end;}
.lss7-credit-popups.pos-right-center{right:14px;top:50%;transform:translateY(-50%);align-items:flex-end;}
.lss7-credit-popups.pos-right-bottom{right:14px;bottom:18px;align-items:flex-end;flex-direction:column-reverse;}
.lss7-credit-popups.pos-left-top{left:14px;top:66px;align-items:flex-start;}
.lss7-credit-popups.pos-left-center{left:14px;top:50%;transform:translateY(-50%);align-items:flex-start;}
.lss7-credit-popups.pos-left-bottom{left:14px;bottom:18px;align-items:flex-start;flex-direction:column-reverse;}
.lss7-credit-popup{
  --cp-bg:linear-gradient(145deg,rgba(12,29,24,.985),rgba(7,14,21,.99));
  --cp-border:rgba(74,222,128,.34);--cp-text:#f5fff8;--cp-muted:#9abaaa;--cp-accent:#4ade80;--cp-gold:#f3c85b;
  position:relative;display:grid;grid-template-columns:48px minmax(0,1fr) 18px;gap:12px;align-items:center;
  width:100%;min-height:108px;padding:13px 14px 15px 17px;border:1px solid var(--cp-border);border-radius:16px;
  background:var(--cp-bg);color:var(--cp-text);box-shadow:0 24px 58px rgba(0,0,0,.42),inset 0 1px rgba(255,255,255,.08),inset 0 -1px rgba(0,0,0,.20);
  overflow:hidden;opacity:0;will-change:transform,opacity;transition:opacity .38s ease,transform .48s cubic-bezier(.2,.85,.25,1);
  font-family:'Inter',system-ui,sans-serif;
}
.lss7-credit-popup::before{content:"";position:absolute;right:-55px;top:-68px;width:170px;height:170px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--cp-accent) 16%,transparent),transparent 68%);pointer-events:none;}
.lss7-credit-popup::after{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 12%,rgba(255,255,255,.13) 42%,transparent 68%);transform:translateX(-120%);}
.lss7-credit-popup.show::after{animation:credit-popup-sheen 1.15s .12s ease-out;}
.credit-popup-rail{position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(180deg,var(--cp-gold),var(--cp-accent));box-shadow:0 0 16px var(--cp-accent);}
.credit-popup-icon{position:relative;display:flex;align-items:center;justify-content:center;width:46px;height:46px;border-radius:14px;color:#3b2500;background:linear-gradient(145deg,#fff0ad,#d8a225);border:1px solid rgba(255,240,178,.76);box-shadow:0 9px 22px rgba(220,166,45,.30),inset 0 1px rgba(255,255,255,.82),inset 0 -5px 12px rgba(126,80,0,.12);}
.credit-popup-icon i{font:950 22px/1 'JetBrains Mono',monospace;font-style:normal;}
.credit-popup-icon em{position:absolute;right:-4px;bottom:-3px;display:flex;align-items:center;justify-content:center;width:17px;height:17px;border:2px solid rgba(8,20,17,.92);border-radius:50%;color:#fff;background:var(--cp-accent);font:950 12px/1 Arial;font-style:normal;box-shadow:0 3px 8px rgba(0,0,0,.28);}
.credit-popup-content{display:flex;flex-direction:column;min-width:0;gap:5px;}
.credit-popup-head{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.credit-popup-head>small{color:var(--cp-muted);font-size:7.5px;font-weight:950;letter-spacing:1px;text-transform:uppercase;}
.credit-popup-live{display:inline-flex;align-items:center;gap:4px;padding:3px 6px;border:1px solid color-mix(in srgb,var(--cp-accent) 42%,transparent);border-radius:999px;color:var(--cp-accent);background:color-mix(in srgb,var(--cp-accent) 10%,transparent);font-size:6.5px;font-weight:950;letter-spacing:.55px;}
.credit-popup-live i{width:5px;height:5px;border-radius:50%;background:currentColor;box-shadow:0 0 7px currentColor;}
.credit-popup-amount{display:flex;align-items:baseline;gap:3px;min-width:0;color:var(--cp-text);font:950 22px/1.08 'JetBrains Mono',monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.credit-popup-amount>b{color:var(--cp-accent);font-size:16px;}
.credit-popup-amount>small{margin-left:3px;color:var(--cp-muted);font:850 8px/1 'Inter',sans-serif;text-transform:uppercase;letter-spacing:.55px;}
.credit-popup-details{display:flex;align-items:center;gap:14px;min-width:0;}
.credit-popup-details>span{display:flex;align-items:center;gap:5px;min-width:0;}
.credit-popup-details i{color:var(--cp-muted);font-size:7px;font-style:normal;text-transform:uppercase;letter-spacing:.4px;}
.credit-popup-details b{color:var(--cp-text);font:850 8px/1 'JetBrains Mono',monospace;white-space:nowrap;}
.credit-popup-spark{position:relative;z-index:1;color:var(--cp-gold);font-size:15px;text-shadow:0 0 11px var(--cp-gold);animation:credit-popup-spark 1.4s ease-in-out infinite;}
.credit-popup-progress{position:absolute;left:5px;right:0;bottom:0;height:3px;background:linear-gradient(90deg,var(--cp-gold),var(--cp-accent));transform-origin:left center;animation:credit-popup-progress var(--credit-duration,5000ms) linear forwards;}
.pos-left-bottom .credit-popup-progress,.pos-right-bottom .credit-popup-progress{transform-origin:right center;}
.lss7-credit-popup.theme-light{--cp-bg:linear-gradient(145deg,rgba(255,255,255,.995),rgba(237,247,241,.99));--cp-border:rgba(21,128,61,.27);--cp-text:#142d20;--cp-muted:#5a7164;--cp-accent:#239b55;--cp-gold:#c58b18;box-shadow:0 22px 52px rgba(36,67,49,.20),inset 0 1px #fff;}
.lss7-credit-popup.theme-summer{--cp-bg:linear-gradient(145deg,rgba(255,255,255,.995),rgba(226,248,239,.99));--cp-border:rgba(47,158,91,.30);--cp-text:#173d2b;--cp-muted:#567669;--cp-accent:#2f9e5b;--cp-gold:#d39a1d;box-shadow:0 22px 52px rgba(29,92,67,.20),inset 0 1px #fff;}
.lss7-credit-popup.theme-summer-dark{--cp-bg:linear-gradient(145deg,rgba(13,42,38,.995),rgba(8,16,34,.995));--cp-border:rgba(94,234,176,.35);--cp-text:#effff8;--cp-muted:#9fcabb;--cp-accent:#5eeab0;--cp-gold:#f2c96b;}
.lss7-credit-popup.theme-lcars{--cp-bg:linear-gradient(145deg,#121720,#07080b);--cp-border:rgba(232,169,88,.38);--cp-text:#fff7e8;--cp-muted:#c3a77d;--cp-accent:#85d6ff;--cp-gold:#e8a958;border-radius:20px 7px 7px 20px;box-shadow:inset 7px 0 #e8a958,0 24px 58px rgba(0,0,0,.46);}
.lss7-credit-popup.theme-lcars .credit-popup-rail{display:none;}
.lss7-credit-popup.theme-lcars .credit-popup-icon{border-radius:18px 6px 6px 18px;background:linear-gradient(90deg,#e8a958,#ffd99b);}
.lss7-credit-popup.popup-small{
  grid-template-columns:39px minmax(0,1fr) 14px;gap:9px;min-height:86px;
  padding:10px 11px 12px 14px;border-radius:13px;
}
.lss7-credit-popup.popup-small .credit-popup-icon{width:38px;height:38px;border-radius:11px;}
.lss7-credit-popup.popup-small .credit-popup-icon i{font-size:18px;}
.lss7-credit-popup.popup-small .credit-popup-icon em{width:14px;height:14px;right:-3px;bottom:-2px;font-size:9px;border-width:2px;}
.lss7-credit-popup.popup-small .credit-popup-content{gap:3px;}
.lss7-credit-popup.popup-small .credit-popup-head>small{font-size:6.5px;letter-spacing:.7px;}
.lss7-credit-popup.popup-small .credit-popup-live{padding:2px 5px;font-size:5.5px;}
.lss7-credit-popup.popup-small .credit-popup-amount{font-size:17px;}
.lss7-credit-popup.popup-small .credit-popup-amount>b{font-size:13px;}
.lss7-credit-popup.popup-small .credit-popup-amount>small{font-size:6.5px;}
.lss7-credit-popup.popup-small .credit-popup-details{gap:8px;}
.lss7-credit-popup.popup-small .credit-popup-details i{font-size:5.8px;}
.lss7-credit-popup.popup-small .credit-popup-details b{font-size:6.8px;}
.lss7-credit-popup.popup-small .credit-popup-spark{font-size:12px;}
.lss7-credit-popup.popup-large{
  grid-template-columns:58px minmax(0,1fr) 22px;gap:15px;min-height:128px;
  padding:16px 17px 18px 20px;border-radius:18px;
}
.lss7-credit-popup.popup-large .credit-popup-icon{width:56px;height:56px;border-radius:16px;}
.lss7-credit-popup.popup-large .credit-popup-icon i{font-size:27px;}
.lss7-credit-popup.popup-large .credit-popup-icon em{width:20px;height:20px;right:-5px;bottom:-4px;font-size:13px;}
.lss7-credit-popup.popup-large .credit-popup-content{gap:7px;}
.lss7-credit-popup.popup-large .credit-popup-head>small{font-size:8.5px;letter-spacing:1.15px;}
.lss7-credit-popup.popup-large .credit-popup-live{padding:4px 8px;font-size:7px;}
.lss7-credit-popup.popup-large .credit-popup-amount{font-size:27px;}
.lss7-credit-popup.popup-large .credit-popup-amount>b{font-size:20px;}
.lss7-credit-popup.popup-large .credit-popup-amount>small{font-size:9px;}
.lss7-credit-popup.popup-large .credit-popup-details{gap:20px;}
.lss7-credit-popup.popup-large .credit-popup-details i{font-size:7.5px;}
.lss7-credit-popup.popup-large .credit-popup-details b{font-size:9px;}
.lss7-credit-popup.popup-large .credit-popup-spark{font-size:18px;}
.lss7-credit-popup.theme-lcars.popup-small{border-radius:16px 6px 6px 16px;}
.lss7-credit-popup.theme-lcars.popup-large{border-radius:23px 8px 8px 23px;}
.credit-volume-row{justify-content:space-between!important;gap:14px!important;}
.credit-volume-control{display:grid;grid-template-columns:minmax(130px,220px) 45px;align-items:center;gap:9px;min-width:210px;}
#sb-credit-volume{appearance:none!important;width:100%;height:6px;padding:0!important;border:0!important;border-radius:999px!important;background:linear-gradient(90deg,var(--green),var(--cyan))!important;box-shadow:inset 0 1px 2px rgba(0,0,0,.24)!important;cursor:pointer;}
#sb-credit-volume::-webkit-slider-thumb{appearance:none;width:17px;height:17px;border:2px solid var(--premium-surface-strong);border-radius:50%;background:var(--greenh);box-shadow:0 3px 9px rgba(0,0,0,.28),0 0 0 1px rgba(34,197,94,.42);cursor:grab;}
#sb-credit-volume::-moz-range-thumb{width:15px;height:15px;border:2px solid var(--premium-surface-strong);border-radius:50%;background:var(--greenh);box-shadow:0 3px 9px rgba(0,0,0,.28);cursor:grab;}
#sb-credit-volume-value{min-width:43px;padding:4px 6px;border:1px solid var(--premium-border);border-radius:7px;color:var(--greenh);background:var(--premium-surface);font:900 9px/1 'JetBrains Mono',monospace;text-align:center;}
#lss7.theme-light #sb-credit-volume-value,#lss7.theme-summer #sb-credit-volume-value{color:#166534;}
#lss7.theme-lcars #sb-credit-volume{background:linear-gradient(90deg,#e8a958,#85d6ff)!important;}
#lss7.theme-lcars #sb-credit-volume-value{color:#ffd99b;border-radius:12px 4px 4px 12px;}
.lss7-credit-popup.anim-slide{transform:translateX(120%);}
.pos-left-top .lss7-credit-popup.anim-slide,.pos-left-center .lss7-credit-popup.anim-slide,.pos-left-bottom .lss7-credit-popup.anim-slide{transform:translateX(-120%);}
.lss7-credit-popup.anim-float{transform:translateY(28px);}
.lss7-credit-popup.anim-scale{transform:scale(.72);}
.lss7-credit-popup.anim-bounce{transform:translateX(120%) scale(.88);}
.pos-left-top .lss7-credit-popup.anim-bounce,.pos-left-center .lss7-credit-popup.anim-bounce,.pos-left-bottom .lss7-credit-popup.anim-bounce{transform:translateX(-120%) scale(.88);}
.lss7-credit-popup.anim-fade{transform:none;}
.lss7-credit-popup.show{opacity:1;transform:translate(0,0) scale(1);}
.lss7-credit-popup.show.anim-bounce{animation:credit-popup-bounce .62s cubic-bezier(.2,.9,.3,1.25);}
.pos-left-top .lss7-credit-popup.show.anim-bounce,.pos-left-center .lss7-credit-popup.show.anim-bounce,.pos-left-bottom .lss7-credit-popup.show.anim-bounce{animation-name:credit-popup-bounce-left;}
.lss7-credit-popup.leaving{opacity:0;transform:translateY(-12px) scale(.96);}
@keyframes credit-popup-sheen{to{transform:translateX(130%)}}
@keyframes credit-popup-spark{0%,100%{opacity:.55;transform:scale(.8) rotate(0)}50%{opacity:1;transform:scale(1.16) rotate(12deg)}}
@keyframes credit-popup-progress{from{transform:scaleX(1)}to{transform:scaleX(0)}}
@keyframes credit-popup-bounce{0%{transform:translateX(100%) scale(.88)}65%{transform:translateX(-8px) scale(1.02)}100%{transform:translateX(0) scale(1)}}
@keyframes credit-popup-bounce-left{0%{transform:translateX(-100%) scale(.88)}65%{transform:translateX(8px) scale(1.02)}100%{transform:translateX(0) scale(1)}}
@media(max-width:600px){
  .lss7-credit-popups{left:10px!important;right:10px!important;width:auto;top:auto!important;bottom:12px!important;transform:none!important;}
  .lss7-credit-popup{min-height:70px;}
  .credit-volume-row{align-items:flex-start!important;flex-direction:column!important;}
  .credit-volume-control{width:100%;min-width:0;}
}
@media(prefers-reduced-motion:reduce){
  .lss7-credit-popup,.lss7-credit-popup::after,.credit-popup-spark{animation:none!important;transition:opacity .15s ease!important;transform:none!important;}
}
`);

function brandMarkHtml(extraClass=""){
  return `<span class="brand-emblem ${extraClass}" aria-hidden="true"><span class="brand-core"><span class="brand-letter">VS</span><span class="brand-pro">PRO</span></span><span class="brand-signal"><i></i><i></i><i></i><i></i></span></span>`;
}
function applyNavButtonStyle(){
  const button=$("#lss7-btn");
  if(!button.length)return;
  const style=S.settings.navButtonStyle||"standard";
  button.removeClass("nav-logo-only nav-no-events nav-name-only");
  if(style==="logo")button.addClass("nav-logo-only");
  else if(style==="standard-no-event")button.addClass("nav-no-events");
  else if(style==="name")button.addClass("nav-name-only");
}

function organizeDashboardTabs(){
  const tabs=$("#lss7-tabs");
  if(!tabs.length||tabs.children(".lss7-nav-group").length)return;
  const take=ids=>ids.map(id=>tabs.find(`.ltab[data-tab="${id}"]`).first()).filter(tab=>tab.length);
  const makeGroup=(cls,label,items)=>{
    const group=$(`<div class="lss7-nav-group ${cls}"><span class="lss7-nav-group-label">${label}</span><div class="lss7-nav-group-tabs"></div></div>`);
    items.forEach(tab=>group.find(".lss7-nav-group-tabs").append(tab));
    return group;
  };
  const alliance=makeGroup("lss7-nav-alliance","Verband",take(["tp-overview","tp-forecast","tp-vehicles","tp-schoolings","tp-team"]));
  const player=makeGroup("lss7-nav-player","Spieler",take(["tp-player-forecast"]));
  const tools=makeGroup("lss7-nav-tools","Werkzeuge",take(["tp-aao","tp-history","tp-event","tp-settings"]));
  tabs.empty().append(alliance,player,tools);
}

function applyPlayerForecastPlacement(){
  const showMenu=(S.settings.playerForecastPlacement||"profile")==="both";
  const tab=$("#lss7-tabs .ltab[data-tab='tp-player-forecast']");
  tab.toggle(showMenu);
  tab.closest(".lss7-nav-player").toggle(showMenu);
  $("#lss7-tabs").toggleClass("player-menu-hidden",!showMenu);
  $("#sb-player-forecast-place").val(showMenu?"both":"profile");
}

function renderNavStylePreview(){
  const preview=$("#lss7-nav-style-preview");
  if(!preview.length)return;
  const style=S.settings.navButtonStyle||"standard";
  preview.removeClass("preview-logo preview-standard preview-no-event preview-name");
  preview.addClass(style==="logo"?"preview-logo":style==="standard-no-event"?"preview-no-event":style==="name"?"preview-name":"preview-standard");
}

function upgradeUi910(){
  $("#lss-profile-events").remove();
  if(!$("#prof-placement").length)$(".prof-top").append(`<button id="prof-placement" class="prof-placement" type="button" title="Spielerprognose und Platzierungsumfeld öffnen"><span class="prof-placement-kicker">Spielerplatzierung</span><span class="prof-placement-main"><strong>Wird ermittelt</strong><small class="prof-placement-history neutral"><span class="rank-trend-icon" aria-hidden="true">▬</span><span class="rank-trend-label">-</span></small></span><span class="prof-placement-caption">Topliste</span></button>`);
  if(!$("#fleet-status-kpis").length)$("#lss7-vbars").before(`<div id="fleet-status-kpis" class="fleet-status-kpis"></div>`);
  if(!$("#fleet-command").length)$("#tp-vehicles").prepend(`<div id="fleet-command" class="fleet-command">
    <div class="fleet-command-copy"><span class="fleet-command-eyebrow">Einsatzmittel & Infrastruktur</span><span class="fleet-command-title">Fuhrpark- und Standortlage</span><span class="fleet-command-sub">Fahrzeugbereitschaft, Personal, Ausbauten, Spezialisierungen und Standortbetrieb in einer gemeinsamen Lageübersicht.</span></div>
    <span class="fleet-command-badge">LIVE-DATEN</span>
  </div>`);
  $(".hd-mark").replaceWith(brandMarkHtml("hd-mark"));

  const tabs=$("#lss7-tabs");
  if(tabs.length&&!tabs.find(`[data-tab="tp-player-forecast"]`).length){
    const tab=$(`<div class="ltab" data-tab="tp-player-forecast">Spielerprognose</div>`);
    const eventTab=tabs.find(`[data-tab="tp-event"]`).first();
    eventTab.length?tab.insertBefore(eventTab):tabs.append(tab);
    $("#lss7-body").append(`<div class="lpanel" id="tp-player-forecast"><div id="player-forecast-view"></div></div>`);
  }
  organizeDashboardTabs();
  applyPlayerForecastPlacement();

  $("#sb-size").closest("label,.tog-row").remove();
  if(!$("#sb-nav-style").length){
    $("#tp-settings .settings-intro").first().after(`<div class="set-group set-wide nav-style-setting" id="lss7-nav-style-setting">
      <div class="set-head">Kopfzeilen-Button</div>
      <div class="nav-style-showcase">
        <div class="nav-style-preview-shell"><div id="lss7-nav-style-preview" class="nav-style-preview">${brandMarkHtml()}<span class="nav-style-preview-copy"><b>Dein Verband</b><span>Live-Events</span></span></div></div>
        <div><label class="tog-row"><span class="tog-lbl">Darstellung</span>
        <select id="sb-nav-style" class="lss7-select">
          <option value="logo">Nur Logo</option><option value="standard">Standard</option>
          <option value="standard-no-event">Standard ohne Events</option><option value="name">Nur Dein Verband</option>
        </select>
        </label><div class="set-note">Die Vorschau zeigt direkt, wie dein Dashboard-Button im Spiel-Header wirkt. Laufende Events bleiben im Dashboard-Header sichtbar.</div></div>
      </div>
    </div>`);
    $("#sb-nav-style").val(S.settings.navButtonStyle||"standard");
  }
  if(!$("#sb-player-forecast-place").length){
    $("#lss7-nav-style-setting").append(`<label class="tog-row player-forecast-setting"><span class="tog-lbl">Spielerprognose anzeigen</span><select id="sb-player-forecast-place" class="lss7-select"><option value="profile">Nur im Spielerprofil</option><option value="both">Spielerprofil und Menü</option></select></label>`);
    $("#sb-player-forecast-place").val(S.settings.playerForecastPlacement||"profile");
  }
  renderNavStylePreview();
  applyPlayerForecastPlacement();

  const updateNote=$("#lss7-update-note");
  $("#lss7-update-patches").addClass("update-patches");
  if(updateNote.length&&!$("#lss7-update-close").length){
    updateNote.append(`<button id="lss7-update-close" class="lss7-update-close" type="button" aria-label="Update-Hinweis schließen" title="Schließen">×</button>`);
    $("#lss7-update-close").on("click",()=>{
      GM_setValue("v7_update_note_dismissed",V);
      updateNote.removeClass("show available");
    });
  }
  renderPlayerForecast();
  applyTranslations(document.getElementById("lss7"));
}

function buildTrigger(){
  const li=$(`<li class="lss7-navbar-item"></li>`);
  const a=$(`
    <a href="#" id="lss7-btn">
      ${brandMarkHtml("lss7-nav-mark")}
      <span class="lss7-nav-copy">
        <span class="lss7-nav-lbl">Dein Verband</span>
        <span class="lss7-nav-events" id="lss7-nav-events"></span>
      </span>
      <div class="lss7-live"></div>
      <span class="lss7-nav-arr">v</span>
    </a>`);
  a.on("click",function(e){ e.preventDefault();e.stopPropagation();togglePanel(); });
  li.append(a);

  const nb=$("#navbar-main-collapse .navbar-nav");
  if(nb.length)nb.append(li);
  else logDebug("Navbar nicht gefunden.");
  applyNavButtonStyle();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  PANEL TOGGLE                                                â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let panelOpen=false;
function togglePanel(force){
  panelOpen = force!==undefined ? !!force : !panelOpen;
  $("#lss7").toggleClass("open",panelOpen);
  $("#lss7-btn").toggleClass("open",panelOpen);
  if(panelOpen) setTimeout(drawChart,80);
}
function togglePanelCollapse(force){
  S.settings.panelCollapsed=force!==undefined?!!force:!S.settings.panelCollapsed;
  save();
  if(!panelOpen) togglePanel(true);
  applyPanelMode();
}
function installGlobalHotkeys(){
  document.addEventListener("keydown",e=>{
    if(activeHotkeyCapture){
      e.preventDefault();e.stopPropagation();
      commitHotkeyCapture(eventHotkey(e)||String(e.key||""));
      return;
    }
    if(!S.settings.hotkeysEnabled || isTypingTarget(e.target))return;
    const pressed=eventHotkey(e);
    const panelKey=normalizeHotkey(S.settings.panelHotkey);
    const collapseKey=normalizeHotkey(S.settings.collapseHotkey);
    if(pressed && pressed===panelKey){
      e.preventDefault();e.stopPropagation();
      togglePanel();
    }else if(pressed && pressed===collapseKey){
      e.preventDefault();e.stopPropagation();
      togglePanelCollapse();
    }
  },true);
}

// AuÃŸerhalb klicken â†’ schlieÃŸen
$(document).on("click.lss7",function(e){
  if((S.settings.panelMode||"floating")==="embedded") return;
  if(panelOpen && !$(e.target).closest("#lss7,#lss7-btn").length){
    togglePanel(false);
  }
});

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  UPDATE CHECK                                                â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function compareVersions(a,b){
  const pa=String(a||"0").split(".").map(x=>parseInt(x,10)||0);
  const pb=String(b||"0").split(".").map(x=>parseInt(x,10)||0);
  const n=Math.max(pa.length,pb.length);
  for(let i=0;i<n;i++){
    const da=pa[i]||0,db=pb[i]||0;
    if(da>db)return 1;
    if(da<db)return -1;
  }
  return 0;
}
function updateManagerInfo(){
  try{
    const enabled=GM_info?.scriptWillUpdate!==false && GM_info?.script?.options?.check_for_updates!==false;
    return {enabled,handler:GM_info?.scriptHandler||"Userscript-Manager"};
  }catch{return {enabled:true,handler:"Userscript-Manager"};}
}
function setUpdateHeader(text,type="updated"){
  const note=$("#lss7-update-note");
  if(!note.length)return;
  note.removeClass("show available");
  if(!text)return;
  if(type!=="available"&&String(GM_getValue("v7_update_note_dismissed","")||"")===V)return;
  $("#lss7-update-note-text").text(text);
  $("#lss7-update-install").toggle(type==="available").attr("href",UPDATE_URL);
  note.toggleClass("available",type==="available").addClass("show");
}
function setUpdateSettings(text,type="",showInstall=false){
  const status=$("#sb-update-status");
  if(status.length)status.removeClass("good warn").addClass(type).html(text);
  $("#sb-update-install").toggle(!!showInstall);
}
function announceInstalledUpdate(){
  if(S.update.justUpdated){
    const text=S.update.previousVersion
      ? `Verband Statistik Pro wurde von v${S.update.previousVersion} auf v${V} aktualisiert.`
      : `Verband Statistik Pro wurde auf v${V} aktualisiert.`;
    setUpdateHeader(text,"updated");
  }
  const manager=updateManagerInfo();
  const mode=manager.enabled?"aktiviert":"im Userscript-Manager deaktiviert";
  setUpdateSettings(`<strong>Automatische Updates ${escHtml(mode)}</strong><span>${escHtml(manager.handler)} nutzt @updateURL und @downloadURL. Installiert ist v${escHtml(V)}.</span>`,manager.enabled?"good":"warn",false);
}
function checkUpdate({manual=false}={}){
  if(S.update.checking)return;
  S.update.checking=true;S.update.error="";
  if(manual)setUpdateSettings(`<strong>Update-Prüfung läuft</strong><span>Die aktuelle GitHub-Version wird geprüft...</span>`,"",false);
  requestTextWithRetry(`${UPDATE_URL}?t=${Date.now()}`,{timeout:15000,retries:1,label:"update"},txt=>{
      S.update.checking=false;S.update.lastCheck=Date.now();
      const m=String(txt||"").match(/@version\s+([\d.]+)/);
      if(!m){
        if(manual)setUpdateSettings(`<strong>Version nicht erkannt</strong><span>Die Update-Datei wurde geladen, aber die Versionsnummer konnte nicht ermittelt werden.</span>`,"warn",false);
        return;
      }
      const remote=m[1];S.update.availableVersion=remote;
      if(compareVersions(remote,V)>0){
        const manager=updateManagerInfo();
        setUpdateHeader(`Update v${remote} ist verfügbar. Falls ${manager.handler} nicht automatisch aktualisiert, kannst du es direkt installieren.`,"available");
        setUpdateSettings(`<strong>Update v${escHtml(remote)} verfügbar</strong><span>Installiert ist v${escHtml(V)}. Der Userscript-Manager sollte automatisch aktualisieren; die manuelle Installation bleibt als Fallback verfügbar.</span>`,"warn",true);
      }else if(manual){
        setUpdateSettings(`<strong>Alles aktuell</strong><span>Installiert ist v${escHtml(V)}. Es ist kein neueres Update verfügbar.</span>`,"good",false);
      }
  },err=>{
    S.update.checking=false;S.update.error=String(err||"Netzwerkfehler");
    if(manual)setUpdateSettings(`<strong>Update-Prüfung fehlgeschlagen</strong><span>Die GitHub-Datei konnte nicht erreicht werden oder wurde blockiert. Bitte später erneut versuchen.</span>`,"warn",false);
  });
}
// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  INIT                                                        â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
$(document).ready(()=>{
  load();
  installDiagnosticsHooks();
  buildUI();
  updateDiagnosticStatus();
  upgradeUi910();
  initSummerScene();
  buildTrigger();
  installAllianceActivityHooks();
  installCreditPopupObserver();
  installGlobalHotkeys();
  applyPanelMode();
  updatePlaytimeUi();
  updateCoinsUi();
  renderAllianceActivity();
  renderMissionEarnings();
  scanCurrentMissionsFromDom();
  renderClock();
  announceInstalledUpdate();

  // Initialer Fetch
  fetchAlliance();
  fetchUserinfo();
  fetchProfileCard();
  fetchBuildings();
  fetchVehicleStates();
  fetchFleetVehicles();
  fetchSchoolings();
  fetchAnalysisMeta();
  fetchDailyEarnFromOverview();
  fetchWeather();
  renderWeather();
  scanGameEvents();
  renderEventPage();

  document.addEventListener("visibilitychange",()=>{
    S.lastTs=Date.now();
    if(document.visibilityState==="visible")checkMidnight();
    save();
  });
  window.addEventListener("pageshow",()=>{
    S.lastTs=Date.now();
    checkMidnight();
  });

  // Intervals
  setInterval(tickTimer,          ITV.timer);
  setInterval(tickClock,          ITV.clock);
  setInterval(tickEventCountdown, ITV.clock);
  setInterval(checkMidnight,      ITV.midnight);
  setInterval(fetchAlliance,      ITV.alliance);
  setInterval(fetchUserinfo,      ITV.userinfo);
  setInterval(fetchProfileCard,   ITV.profile);
  setInterval(fetchVehicleStates, ITV.vstates);
  setInterval(fetchFleetVehicles, ITV.vehicles);
  setInterval(fetchBuildings,     ITV.buildings);
  setInterval(fetchSchoolings,    ITV.schools);
  setInterval(fetchAnalysisMeta,  900000);
  setInterval(fetchDailyEarnFromOverview, ITV.dailyEarn);
  setInterval(fetchWeather,       ITV.weather);
  setInterval(scanGameEvents,     30000);
  setInterval(scanCurrentMissionsFromDom,30000);
  setInterval(updateFooter,       ITV.footer);

  // Daily-Earnings quick-stat sync
  setInterval(()=>setV("#qs-daily",fmtMoney(S.dailyEarn)), 5000);

  checkUpdate();
});

window.addEventListener("beforeunload",()=>{clearTimeout(creditObserverTimer);clearTimeout(missionEarningsRenderTimer);clearInterval(creditPollTimer);creditObserver?.disconnect();summerSceneCtl?.dispose();save();});
window.addEventListener("pagehide",save);

})();
