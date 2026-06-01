// ==UserScript==
// @name         LSS Verband Statistik Pro
// @namespace    http://tampermonkey.net/
// @charset      UTF-8
// @version      6.0.4
// @description  Ultimate Premium Dashboard: Floating Panel, 8 APIs, Live-Charts, Fahrzeugstatus-Donut, Kilometerstand, ARR-Ãœbersicht, GebÃ¤ude, Schulungen, Verlaufshistorie, Team, Dark-Design.
// @author       Fabian (Capt.BobbyNash)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      raw.githubusercontent.com
// @connect      github.com
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel-Verband-Statistik-Pro.user.js
// @downloadURL  https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel-Verband-Statistik-Pro.user.js
// ==/UserScript==

(function () {
"use strict";

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  KONFIGURATION                                               â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const V   = "6.0.4";
const BASE = "https://www.leitstellenspiel.de";
const UPDATE_URL = "https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel-Verband-Statistik-Pro.user.js";

const API = {
  alliance:    `${BASE}/api/allianceinfo`,
  userinfo:    `${BASE}/api/userinfo`,
  vStates:     `${BASE}/api/vehicle_states`,
  buildings:   `${BASE}/api/buildings`,
  schoolings:  `${BASE}/api/alliance_schoolings`,
  vehicles:    `${BASE}/api/v2/vehicles`,
  vDistances:  `${BASE}/api/v1/vehicle_distances.json`,
  aaos:        `${BASE}/api/v1/aaos`,
  creditsOverview: `${BASE}/credits/overview`,
  alliancesPage: `${BASE}/alliances`,
  wxGeo: "https://geocoding-api.open-meteo.com/v1/search",
  wxForecast: "https://api.open-meteo.com/v1/forecast",
  zipGeo: "https://api.zippopotam.us/de",
  dwdWarnings: "https://www.dwd.de/DWD/warnungen/warnapp/json/warnings.json",
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
  4:{l:"Einsatz uebernommen",     s:"Uebernom.",c:"#fb923c"},
  5:{l:"Sprechwunsch",           s:"Sprech.", c:"#ef4444"},
  6:{l:"Nicht einsatzbereit",    s:"N.E.",    c:"#475569"},
  7:{l:"RD bereit",              s:"RD",      c:"#60a5fa"},
  9:{l:"Sonderfahrt",            s:"Sonder.", c:"#a855f7"},
};

const BICONS = {0:"B",1:"B",2:"B",3:"B",4:"B",5:"B",6:"B",7:"B",
  8:"B",9:"B",11:"B",12:"B",13:"B",14:"B",15:"B",
  18:"B",20:"B",21:"B",25:"B"};

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
  --t1:#f0f6fc; --t2:#c9d1d9; --t3:#8b949e; --t4:#4a5568;
  --r:10px; --rsm:6px; --rlg:14px; --rxl:18px;
  --font:'Inter',system-ui,sans-serif;
  --mono:'JetBrains Mono',monospace;
  color-scheme:dark;
  --sh:0 0 0 1px rgba(255,255,255,0.03) inset,
       0 4px 24px rgba(0,0,0,0.5),
       0 20px 60px rgba(0,0,0,0.6),
       0 0 80px rgba(0,0,0,0.4);
}

/* â”€â”€ Floating Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7 {
  position:fixed; top:52px; right:14px;
  width:500px; max-width:calc(100vw - 24px);
  height:min(760px, calc(100vh - 68px)); max-height:calc(100vh - 68px);
  min-width:420px; min-height:320px;
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
  resize:both;
  animation:lss7-in .18s cubic-bezier(.4,0,.2,1) both;
}
#lss7.open { display:flex; }
#lss7.layout{
  position:relative; top:auto; right:auto; left:auto;
  width:100%; max-width:100%;
  height:auto; max-height:none; min-height:0;
  margin:8px 0 12px;
  border-radius:10px;
  z-index:20;
  resize:both;
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
  height:34px; padding:0 11px; border-radius:8px;
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
#lss7-btn img   { height:18px; width:auto; opacity:.94; }
.lss7-nav-lbl   { font-size:12px; font-weight:700; color:rgba(255,255,255,.9); letter-spacing:.2px; }
.lss7-nav-arr   { font-size:9px; color:rgba(255,255,255,.45); transition:transform .2s; }
#lss7-btn.open .lss7-nav-arr { transform:rotate(180deg); }
#lss7-live {
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
#lss7-hd::after {
  content:'';position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(ellipse at 80% 30%,rgba(59,130,246,.09) 0%,transparent 60%);
}
.hd-row   { display:flex; align-items:center; gap:10px; }
.hd-ring  {
  width:36px;height:36px;border-radius:10px;flex-shrink:0;
  background:var(--blue3);border:1px solid rgba(59,130,246,.35);
  display:flex;align-items:center;justify-content:center;font-size:18px;
}
.hd-ring img{width:24px;height:24px;object-fit:contain;opacity:.96;}
.hd-title { font-size:14px;font-weight:700;color:var(--t1);line-height:1.2; }
.hd-sub   { font-size:10px;color:var(--t4);margin-top:1px; }
.hd-meta  { margin-left:auto;display:flex;align-items:center;gap:6px;flex-shrink:0; }

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
  display:none;align-items:center;justify-content:center;
  transition:all .15s;
}
#lss7-col:hover{background:var(--blue3);color:var(--blueh);border-color:rgba(59,130,246,.35);}
#lss7.layout #lss7-col{display:flex;}
#lss7.layout.emb-collapsed .prof-strip,
#lss7.layout.emb-collapsed #lss7-qs,
#lss7.layout.emb-collapsed #lss7-tabs,
#lss7.layout.emb-collapsed #lss7-body,
#lss7.layout.emb-collapsed #lss7-changelog,
#lss7.layout.emb-collapsed .lacc,
#lss7.layout.emb-collapsed #lss7-ft{display:none !important;}

/* â”€â”€ Quick-Stats Strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
#lss7-qs {
  flex-shrink:0;
  display:grid;grid-template-columns:1fr 1px 1fr 1px 1fr 1px 1fr;
  background:var(--bg1);border-bottom:1px solid var(--b1);
}
.qs-div{background:var(--b1);}
.qs-cell{padding:9px 11px;display:flex;flex-direction:column;gap:2px;cursor:default;}
.qs-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t4);}
.qs-val{font-size:12px;font-weight:700;color:var(--t1);}
.qs-val.mono{font-family:var(--mono);font-size:12px;letter-spacing:1.2px;color:var(--green);}
.qs-val.sm  {font-size:10px;font-weight:500;color:var(--t3);}
.prof-strip{
  flex-shrink:0;
  margin:0;
  border-top:1px solid var(--b1);
  border-bottom:1px solid var(--b1);
  border-left:none;
  border-right:none;
  border-radius:0;
  background:linear-gradient(180deg,rgba(255,255,255,.02),rgba(255,255,255,.01));
  padding:8px 10px;
}
.prof-row{display:flex;align-items:center;gap:10px;min-width:0;}
.prof-av{
  width:54px;height:38px;border-radius:6px;
  object-fit:cover;border:1px solid var(--b2);background:var(--bg3);flex-shrink:0;
}
.prof-meta{display:flex;flex-direction:column;gap:2px;min-width:0;flex:1;}
.prof-name{font-size:12px;font-weight:700;color:var(--t1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prof-sub{font-size:10px;color:var(--t4);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prof-rank{font-size:10px;color:var(--cyan);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prof-reward{font-size:10px;color:var(--amber);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:none;}
.prof-bar{height:5px;border-radius:5px;background:rgba(255,255,255,.09);overflow:hidden;margin-top:3px;}
.prof-fill{height:100%;width:0%;background:linear-gradient(90deg,var(--blue),var(--cyan));}

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
#donut-leg{flex:1;display:flex;flex-direction:column;gap:4px;}
.dl-row{display:flex;align-items:center;gap:6px;font-size:11px;}
.dl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.dl-lbl{color:var(--t3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;}
.dl-val{font-family:var(--mono);font-size:10px;font-weight:600;color:var(--t2);min-width:26px;text-align:right;}
.dl-pct{font-size:9px;color:var(--t4);min-width:30px;text-align:right;}

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

/* â”€â”€ Credit History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.hist-row{
  display:flex;gap:8px;padding:5px 14px;
  border-bottom:1px solid var(--b0);font-size:11px;align-items:center;
}
.hist-row:last-child{border-bottom:none;}
.hist-t{color:var(--t4);min-width:54px;font-family:var(--mono);font-size:10px;}
.hist-v{flex:1;font-weight:600;color:var(--t2);font-family:var(--mono);}
.hist-d{min-width:72px;text-align:right;font-family:var(--mono);font-size:10px;font-weight:700;}

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

/* â”€â”€ Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
.set-wrap{padding:14px;display:flex;flex-direction:column;gap:10px;}
.set-head{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t4);margin-bottom:2px;}
.set-group{display:flex;flex-direction:column;gap:5px;}
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

.weather-mini{display:block;}
.weather-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;}
.weather-mini .w-l{font-size:11px;color:var(--t2);}
.weather-mini .w-r{font-size:11px;color:var(--cyan);font-family:var(--mono);}
.weather-forecast{display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;}
.wx-chip{
  border:1px solid var(--b1);background:rgba(255,255,255,.02);border-radius:6px;
  padding:4px 6px;font-size:10px;color:var(--t2);
}
.wx-alert{margin-top:6px;font-size:10px;color:var(--amber);}
.wx-warn{
  margin-top:6px;padding:8px;border-radius:6px;border:1px solid var(--b1);font-size:10px;line-height:1.4;display:block;width:100%;
}
.wx-warn.lvl0{background:rgba(34,197,94,.12);border-color:rgba(34,197,94,.35);color:#4ade80;}
.wx-warn.lvl2{background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.35);color:#fbbf24;}
.wx-warn.lvl3{background:rgba(249,115,22,.12);border-color:rgba(249,115,22,.35);color:#fb923c;}
.wx-warn.lvl4{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.35);color:#f87171;}
.wx-warn.lvl5{background:rgba(168,85,247,.12);border-color:rgba(168,85,247,.35);color:#c084fc;}
.wx-src{margin-top:2px;font-size:9px;color:var(--t4);text-align:left;opacity:.66;}

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

#lss7.theme-midnight{
  --bg0:#050913; --bg1:#0b1324; --bg2:#101a30; --bg3:#16233d; --bg4:#1b2b48;
  --bgh:#1a2a45; --bgc:#13213a;
  --blue:#4f8cff; --blueh:#77a5ff; --cyan:#2dd4bf; --cyanh:#5eead4;
}
#lss7.theme-emerald{
  --bg0:#07110f; --bg1:#0d1a17; --bg2:#12221e; --bg3:#163029; --bg4:#1b3a32;
  --bgh:#1d3b33; --bgc:#163028;
  --blue:#10b981; --blueh:#34d399; --cyan:#2dd4bf; --cyanh:#5eead4;
  --green:#34d399; --greenh:#6ee7b7;
}
#lss7.theme-sunset{
  --bg0:#14090a; --bg1:#1f0f12; --bg2:#2a1418; --bg3:#361920; --bg4:#40202a;
  --bgh:#42222d; --bgc:#331a22;
  --blue:#f97316; --blueh:#fb923c; --cyan:#f59e0b; --cyanh:#fbbf24;
  --green:#f59e0b; --greenh:#fbbf24;
}
#lss7.theme-slate{
  --bg0:#0b0f14; --bg1:#11161d; --bg2:#171d26; --bg3:#1d2632; --bg4:#243042;
  --bgh:#223043; --bgc:#1b2737;
  --blue:#60a5fa; --blueh:#93c5fd; --cyan:#22d3ee; --cyanh:#67e8f9;
}
#lss7.theme-premium{
  --bg0:#0e0a04; --bg1:#171107; --bg2:#1e1609; --bg3:#281c0b; --bg4:#33240e;
  --bgh:#2f220d; --bgc:#261c0c;
  --b1:rgba(248,199,101,.16); --b2:rgba(248,199,101,.26); --b3:rgba(248,199,101,.38);
  --blue:#d9a441; --blueh:#f1c76a; --cyan:#f59e0b; --cyanh:#f8b84a;
  --green:#f6d377; --greenh:#ffe5a8;
  box-shadow:0 0 0 1px rgba(248,199,101,.18) inset, 0 20px 60px rgba(0,0,0,.65);
}
#lss7.theme-premium #lss7-hd{
  background:radial-gradient(120% 140% at 100% 0%, rgba(245,190,75,.22), transparent 60%),linear-gradient(180deg, rgba(255,219,130,.09), rgba(255,219,130,0));
}
#lss7.theme-premium .prof-fill{background:linear-gradient(90deg,#d9a441,#f6d377,#ffe5a8);}
#lss7.theme-premium .kpi-val,#lss7.theme-premium .stat-num{text-shadow:0 0 18px rgba(245,196,88,.18);}

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

/* Footer */
#lss7-ft{
  flex-shrink:0;padding:7px 14px;
  background:var(--bg1);border-top:1px solid var(--b1);
  display:flex;align-items:center;justify-content:space-between;
}
.ft-l,.ft-r{font-size:10px;color:var(--t4);}

/* Update Popup */
#lss7-uo{
  position:fixed;inset:0;background:rgba(0,0,0,.78);
  backdrop-filter:blur(7px);z-index:99999;
  display:flex;align-items:center;justify-content:center;
}
#lss7-ub{
  background:linear-gradient(180deg, rgba(8,16,34,.96), rgba(7,13,27,.96));
  border:1px solid rgba(88,122,201,.28);border-radius:14px;
  padding:18px 18px 14px;width:380px;text-align:left;
  box-shadow:0 40px 100px rgba(0,0,0,.85);font-family:var(--font);color:var(--t1);
  animation:popin .22s cubic-bezier(.34,1.56,.64,1) both;
  position:relative;
}
@keyframes popin{from{opacity:0;transform:scale(.86) translateY(-10px)}}
.ub-x{
  position:absolute;top:10px;right:10px;width:26px;height:26px;
  border-radius:9px;border:1px solid var(--b2);background:rgba(255,255,255,.04);
  color:var(--t3);font-size:15px;line-height:1;cursor:pointer;
}
.ub-x:hover{background:rgba(255,255,255,.1);color:var(--t1);}
.ub-tag{
  display:inline-flex;align-items:center;gap:6px;padding:4px 9px;
  border:1px solid rgba(65,122,255,.35);background:rgba(65,122,255,.12);
  color:#9fc0ff;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:.4px;
  margin-bottom:10px;text-transform:uppercase;
}
.ub-icon{display:none;}
#lss7-ub h2{font-size:25px;font-weight:800;margin:0 0 8px;letter-spacing:0;}
#lss7-ub p {font-size:14px;color:var(--t3);line-height:1.55;margin:0 0 14px;}
.ub-vers{
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  margin:0 0 14px;padding:10px 12px;border:1px solid var(--b2);
  border-radius:10px;background:rgba(255,255,255,.03);font-size:12px;color:var(--t3);
}
.ub-vers strong{color:var(--t1);}
.ub-row{display:flex;gap:8px;}
.ub-btn{
  flex:1;padding:10px;font-size:12px;font-weight:700;
  border-radius:10px;border:none;cursor:pointer;
  font-family:var(--font);transition:all .15s;text-decoration:none;display:block;
  text-align:center;
}
.ub-ok{background:linear-gradient(180deg,#2f6fff,#2358d6);color:#fff;}
.ub-ok:hover{filter:brightness(1.07);}
.ub-sk{background:rgba(255,255,255,.04);color:var(--t3);border:1px solid var(--b2);}
.ub-sk:hover{background:rgba(255,255,255,.08);color:var(--t1);}

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
.rank-mini-n{font-size:11px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rank-mini-c{font-size:11px;color:var(--green);text-align:right;font-family:var(--mono);}
`);

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  STATE                                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const S = {
  playtime:0, lastTs:Date.now(),
  lastAlliCreds:0, dailyEarn:0,
  lastDate:todayStr(),
  creditHist:[],     // [{ts,v}]
  userCredits:0, userCoins:0, userId:null,
  allianceId:null, allianceName:"", allianceRank:null, allianceCredits:0,
  weather:null,
  profile:{name:"-",since:"-",avatar:"",rank:"-",progress:0,progressText:"-",reward:""},
  weatherAlertKey:"",
  lastApiTs:null,
  settings:{
    notifications:true,
    coins:true,
    compact:false,
    panelPlacement:"top-right",
    panelMode:"floating",
    panelCollapsed:false,
    panelSize:"normal",
    panelTheme:"dark",
    weatherLocation:"",
    weatherMode:"off", // off | settings | overview
    weatherSound:false,
    weatherTone:"beep",
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
  GM_setValue("v7_ld",  today);
  GM_setValue("v7_ch",  JSON.stringify(S.creditHist));
  GM_setValue("v7_set", JSON.stringify(S.settings));
}
function load(){
  const today=todayStr();
  const saved=GM_getValue("v7_ld",today);
  const newDay=saved!==today;
  S.playtime     =newDay?0:GM_getValue("v7_pt",0);
  S.lastAlliCreds=newDay?0:GM_getValue("v7_lc",0);
  S.dailyEarn    =newDay?0:GM_getValue("v7_de",0);
  S.lastTs       =GM_getValue("v7_lts",Date.now());
  S.lastDate     =today;
  try{S.creditHist=JSON.parse(GM_getValue("v7_ch","[]"))||[];}catch{S.creditHist=[];}
  try{Object.assign(S.settings,JSON.parse(GM_getValue("v7_set","{}"))||{});}catch{}
  const validPlacements=["default","top-left","top-right","bottom-left","bottom-right"];
  if(!validPlacements.includes(S.settings.panelPlacement)) S.settings.panelPlacement="default";
  const validModes=["floating","embedded"];
  if(!validModes.includes(S.settings.panelMode)) S.settings.panelMode="floating";
  if(typeof S.settings.panelCollapsed!=="boolean") S.settings.panelCollapsed=false;
  const validSizes=["small","normal","large"];
  if(!validSizes.includes(S.settings.panelSize)) S.settings.panelSize="normal";
  const validThemes=["dark","light","midnight","emerald","sunset","slate","premium"];
  if(!validThemes.includes(S.settings.panelTheme)) S.settings.panelTheme="dark";
  const validWeatherModes=["off","settings","overview"];
  if(!validWeatherModes.includes(S.settings.weatherMode)) S.settings.weatherMode="off";
  if(typeof S.settings.weatherSound!=="boolean") S.settings.weatherSound=false;
  const validTones=["beep","alarm","chime"];
  if(!validTones.includes(S.settings.weatherTone)) S.settings.weatherTone="beep";
  if(newDay)save();
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  UTILITIES                                                   â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function todayStr(){return new Date().toISOString().split("T")[0];}
function fmt(n,u=""){return typeof n==="number"?n.toLocaleString("de-DE")+(u?" "+u:""):"-";}
function fmtMoney(n){return typeof n==="number"?n.toLocaleString("de-DE")+" ¢":"-";}
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
  return new Date().toLocaleString("de-DE",{
    weekday:"short",day:"2-digit",month:"2-digit",year:"numeric",
    hour:"2-digit",minute:"2-digit",second:"2-digit"
  }).replace(",","");
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
  const el=$(sel);if(!el.length)return;
  const v=String(val);
  if(el.text()!==v){
    el.text(v);
    el.removeClass("lflash");
    void el[0].offsetWidth;
    el.addClass("lflash");
  }
}
function setH(sel,html){$(sel).html(html);}
function spin(sel){$(sel).html(`<span class="lspin"></span>`);}

function apiGet(url,cb,onErr){
  GM_xmlhttpRequest({
    method:"GET",url,
    onload(r){
      if(r.status===200){
        try{cb(JSON.parse(r.responseText));}
        catch(e){console.error("[LSS7] parse:",url,e);}
      } else { onErr&&onErr(r.status); }
    },
    onerror(){onErr&&onErr(-1);console.warn("[LSS7] fail:",url);}
  });
}
function pageGet(url,cb,onErr){
  GM_xmlhttpRequest({
    method:"GET",url,
    onload(r){
      if(r.status===200) cb(r.responseText||"");
      else onErr&&onErr(r.status);
    },
    onerror(){onErr&&onErr(-1);console.warn("[LSS7] fail:",url);}
  });
}
function jsonGet(url,cb,onErr){
  GM_xmlhttpRequest({
    method:"GET",url,
    onload(r){
      if(r.status===200){
        try{cb(JSON.parse(r.responseText||"{}"));}
        catch{onErr&&onErr("parse");}
      }else onErr&&onErr(String(r.status));
    },
    onerror(){onErr&&onErr("network");}
  });
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
  const m={
    0:"Klar",1:"Heiter",2:"Wolkig",3:"Bedeckt",
    45:"Nebel",48:"Raureif",51:"Niesel",53:"Niesel",55:"Niesel",
    61:"Regen",63:"Regen",65:"Starkregen",71:"Schnee",73:"Schnee",75:"Starkschnee",
    80:"Schauer",81:"Schauer",82:"Starkschauer",95:"Gewitter"
  };
  return m[code]||"Wetter";
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
  const hCodes=(hourly?.weather_code||[]).slice(0,6).map(Number);
  const hWind=(hourly?.wind_speed_10m||[]).slice(0,6).map(Number);
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
    elSet.html(`<span class="w-l">Keine Wetterdaten</span><span class="w-r">-</span>`);
    elOv.html(`<span class="w-l">Keine Wetterdaten</span><span class="w-r">-</span>`);
    return;
  }
  if(S.weather.error){
    const h=`<span class="w-l">${S.weather.error}</span><span class="w-r">-</span>`;
    elSet.html(h);elOv.html(h);return;
  }
  const icon=weatherCodeToIcon(S.weather.code);
  const headline=`<div class="weather-head"><span class="w-l">${icon} ${S.weather.place}: ${weatherCodeToText(S.weather.code)}</span>
    <span class="w-r">${S.weather.temp}°C · ${S.weather.wind} km/h</span></div>`;
  const fc=(S.weather.forecast||[]).map(x=>`<span class="wx-chip">${x.t}: ${weatherCodeToIcon(x.c)} ${x.temp}°</span>`).join("");
  const warn=S.weather.warn||{level:0,title:"Keine Warnung",desc:"Aktuell liegt keine DWD-Warnung für den Ort vor.",src:"DWD"};
  const alert=`<div class="wx-warn lvl${warn.level}">
    <b>${warn.title}</b><br>${warn.desc}
  </div>`;
  const full=`${headline}<div class="wx-src">Quelle: DWD</div><div class="weather-forecast">${fc}</div>${alert}`;
  elSet.html(full);elOv.html(full);
}
function fetchWeather(){
  const loc=(S.settings.weatherLocation||"").trim();
  if(!loc){ S.weather=null; renderWeather(); return; }
  const isPlz=/^\d{5}$/.test(loc);
  const loadByLatLon=(lat,lon,place,admin1="",zip="")=>{
    const url=`${API.wxForecast}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
    jsonGet(url,w=>{
      const c=w?.current||{};
      const h=w?.hourly||{};
      const hTimes=(h.time||[]);
      const hCodes=(h.weather_code||[]);
      const hTemps=(h.temperature_2m||[]);
      const nowTs=new Date(c.time||Date.now()).getTime();
      const idx=hTimes.findIndex(t=>new Date(t).getTime()>nowTs);
      const start=idx>=0?idx:0;
      const fc=hTimes.slice(start,start+7).map((t,i)=>({
        t:(new Date(t)).toLocaleTimeString("de-DE",{hour:"2-digit",minute:"2-digit"}),
        c:Number(hCodes[start+i]||0),
        temp:Math.round(Number(hTemps[start+i]||0))
      }));
      const alert=computeWeatherAlert(c,h);
      const alertKey=`${place}|${alert}|${zip}`;
      S.weather={
        place,
        temp: Math.round(Number(c.temperature_2m)||0),
        wind: Math.round(Number(c.wind_speed_10m)||0),
        code: Number(c.weather_code)||0,
        forecast:fc,
        alert,
        warn:{level:0,title:"Keine Warnung",desc:"Aktuell liegt keine DWD-Warnung für den Ort vor.",src:"DWD"}
      };
      if(alert && S.settings.weatherSound && S.weatherAlertKey!==alertKey){
        playWeatherTone(S.settings.weatherTone||"beep");
      }
      S.weatherAlertKey=alertKey;
      fetchDwdWarning({place,admin1,zip},warn=>{
        S.weather.warn=warn;
        if(warn.level>=2 && S.settings.weatherSound){
          const wk=`${place}|${warn.level}|${warn.title}`;
          if(S.weatherAlertKey!==wk){ playWeatherTone(S.settings.weatherTone||"beep"); S.weatherAlertKey=wk; }
        }
        renderWeather();
      });
    },()=>{
      S.weather={error:"Wetterdaten konnten nicht geladen werden"};
      renderWeather();
    });
  };
  if(isPlz){
    jsonGet(`${API.zipGeo}/${encodeURIComponent(loc)}`,z=>{
      const p=z?.places?.[0];
      if(!p){ S.weather={error:"PLZ nicht gefunden"}; renderWeather(); return; }
      const lat=Number(p.latitude),lon=Number(p.longitude);
      const place=[p["place name"],p.state,z.country].filter(Boolean).join(", ");
      loadByLatLon(lat,lon,place,p.state,loc);
    },()=>{
      S.weather={error:"PLZ-Suche nicht erreichbar"};
      renderWeather();
    });
    return;
  }
  const q=encodeURIComponent(loc);
  jsonGet(`${API.wxGeo}?name=${q}&count=1&language=de&format=json`,g=>{
    const p=g?.results?.[0];
    if(!p){ S.weather={error:"Ort/PLZ nicht gefunden"}; renderWeather(); return; }
    const place=[p.name,p.admin1,p.country].filter(Boolean).join(", ");
    loadByLatLon(p.latitude,p.longitude,place,p.admin1,"");
  },()=>{
    S.weather={error:"Geo-Suche nicht erreichbar"};
    renderWeather();
  });
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  TIMER / CLOCK                                               â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function tickTimer(){
  const now=Date.now(), el=Math.floor((now-S.lastTs)/1000);
  if(el>0){S.playtime+=el;S.lastTs=now;
    $("#lss7-playtime").text(fmtHHMM(S.playtime));save();}
}
function tickClock(){$("#lss7-clock").text(fmtClock());}
function checkMidnight(){
  if(todayStr()!==S.lastDate){
    S.playtime=0;S.dailyEarn=0;S.lastAlliCreds=0;S.lastDate=todayStr();save();
    $("#lss7-playtime").text(fmtHHMM(0));
    setV("#sv-daily",fmtMoney(0));
    setV("#qs-daily",fmtMoney(0));
  }
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  CREDIT HISTORY                                              â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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
    <text x="44" y="41" text-anchor="middle" fill="#f0f6fc" font-size="14" font-weight="700" font-family="JetBrains Mono">${total}</text>
    <text x="44" y="54" text-anchor="middle" fill="#4a5568" font-size="7.5" font-family="Inter">Fahrzeuge</text>
  </svg>`;
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  API â€” FETCH FUNCTIONS                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function fetchAlliance(){
  apiGet(API.alliance,d=>{
    const apiAllianceId=Number(d.id)||null;
    const domAllianceId=readAllianceIdFromDom();
    S.allianceId=apiAllianceId || domAllianceId || S.allianceId || null;
    S.lastApiTs=Date.now();
    const tot=d.credits_total||0;
    S.lastAlliCreds=tot;save();
    pushHist(tot);
    renderOverview(d);
    loadRankContext();
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
    rows.forEach(row => {
      const tds = row.querySelectorAll("td");
      if(tds.length < 4) return;
      const dateTxt = (tds[3].textContent||"").trim();
      if(dateTxt !== today) return;
      const earnTxt = (tds[2].textContent||"").trim();
      const earnVal = parseDeNum(earnTxt);
      if(earnVal !== null) found = earnVal;
    });

    if(found === null) return;
    S.dailyEarn = found;
    save();
    setV("#sv-daily", fmtMoney(S.dailyEarn));
    setV("#qs-daily", fmtMoney(S.dailyEarn));
  });
}

function fetchUserinfo(){
  apiGet(API.userinfo,d=>{
    S.userId=Number(d.id)||S.userId||null;
    const domCredits=readOwnCreditsFromNavbar();
    const domCoins=readOwnCoinsFromNavbar();
    S.userCredits=(domCredits!==null?domCredits:(d.credits||0));
    S.userCoins=(domCoins!==null?domCoins:(d.coins||0));
    setV("#qs-credits",fmtMoney(S.userCredits));
    setV("#sv-mycoins",fmt(S.userCoins));
  });
}

function renderProfileQuick(){
  $("#prof-name").text(S.profile.name||"-");
  $("#prof-rank").text(`Dienstgrad: ${S.profile.rank||"-"}`);
  if(S.profile.reward){
    $("#prof-reward").text(`Level-Up: ${S.profile.reward}`).show();
  }else{
    $("#prof-reward").hide().text("");
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

  const profileUrl=S.userId?`${BASE}/profile/${S.userId}`:`${BASE}/profile`;
  pageGet(profileUrl, html=>{
    const doc=new DOMParser().parseFromString(html,"text/html");
    const name=(doc.querySelector(".user_name, .profile-header h1, h1, .navbar-profile-name, .username")?.textContent||"").trim() || S.profile.name || "-";
    const avatarDom=(
      doc.querySelector(".profile-image, .profile-avatar img, .user_image img, img.img-rounded, .panel img, .navbar-avatar img, .avatar img")?.getAttribute("src") ||
      doc.querySelector(".profile-image, .profile-avatar img, .user_image img, img.img-rounded, .panel img, .navbar-avatar img, .avatar img")?.getAttribute("data-src") ||
      ""
    ).trim();
    const mAvatar=html.match(/<img[^>]*class=["'][^"']*profile-image[^"']*["'][^>]*src=["']([^"']+)["']/i);
    const avatar=((mAvatar&&mAvatar[1])||avatarDom||"").trim();
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
    const mAbs=pctText.match(/([\d\.\,]+)\s*\\\s*([\d\.\,]+)/);
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
    const creditsFromLevel=curAbs!==null?curAbs:null;
    if(creditsFromLevel!==null){
      const lv=pickLevelByCredits(creditsFromLevel);
      if(!S.profile.rank || S.profile.rank==="-" || /^(level|rang)$/i.test(S.profile.rank)) S.profile.rank=lv.rank;
      S.profile.reward=lv.reward;
    } else if(rank && !/^(level|rang)$/i.test(rank)) {
      S.profile.rank=rank;
    }
    S.profile.progress=progress;
    S.profile.progressText=progressText;
    if(!S.profile.reward) S.profile.reward=reward||"";
    renderProfileQuick();
  },()=>renderProfileQuick());
}

function fetchVehicleStates(){
  apiGet(API.vStates,d=>{ renderVehicles(d); });
}

function fetchBuildings(){
  apiGet(API.buildings,list=>{ renderBuildings(Array.isArray(list)?list:[]); });
}

function fetchSchoolings(){
  apiGet(API.schoolings,list=>{ renderSchoolings(Array.isArray(list)?list:[]); });
}

function fetchVehicleDistances(){
  apiGet(API.vDistances,d=>{
    const arr=(d&&d.result)?d.result:[];
    renderDistances(arr);
  });
}

function fetchAAOs(){
  apiGet(API.aaos,list=>{ renderAAOs(Array.isArray(list)?list:[]); });
}

function fetchAllData(){
  fetchAlliance(); fetchUserinfo(); fetchVehicleStates();
  fetchSchoolings(); fetchAAOs();
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
  const id=finalAllianceId||"#",name=d.name||"Unbekannt";
  S.allianceId=finalAllianceId;
  S.allianceName=String(name||"").trim();
  S.allianceRank=d.rank||null;
  S.allianceCredits=d.credits_total||0;
  const link=`<a href="${BASE}/alliances/${id}" target="_blank">${name}</a>`;
  setH("#sv-alliname",link);
  setV("#sv-total",   fmtMoney(d.credits_total||0));
  setV("#sv-kasse",   fmtMoney(d.credits_current||0));
  setV("#sv-members", d.user_count||0);
  setV("#sv-rank",    d.rank||"-");
  setV("#sv-daily",   fmtMoney(S.dailyEarn));

  const mc=d.user_count||0,maxM=100;
  const pct=Math.min(100,Math.round(mc/maxM*100));
  $("#sv-members-bar").css({width:pct+"%",background:pct>80?"var(--amber)":"var(--blue)"});
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” VEHICLES TAB                                       â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderVehicles(data){
  const total=Object.values(data).reduce((s,v)=>s+(v||0),0);
  drawDonut(data);
  const leg=$("#donut-leg").empty();
  const bars=$("#lss7-vbars").empty();
  if(!total){leg.html(`<div class="lss7-empty">Keine Fahrzeugdaten.</div>`);return;}

  const keys=Object.keys(VSTATUS).map(Number).filter(k=>(data[k]||0)>0)
    .sort((a,b)=>(data[b]||0)-(data[a]||0));

  keys.forEach(k=>{
    const {l,c}=VSTATUS[k],cnt=data[k]||0,pct=Math.round(cnt/total*100);
    leg.append(`<div class="dl-row">
      <div class="dl-dot" style="background:${c}"></div>
      <span class="dl-lbl">${l}</span>
      <span class="dl-pct">${pct}%</span>
      <span class="dl-val">${cnt}</span></div>`);
    bars.append(`<div class="vb-row">
      <div class="vb-dot" style="background:${c}"></div>
      <span class="vb-lbl">${l}</span>
      <div class="vb-bg"><div class="vb-fill" style="width:${pct}%;background:${c}"></div></div>
      <span class="vb-num">${cnt}</span></div>`);
  });

  bars.append(`<div class="vb-total">
    <span>Fahrzeuge gesamt</span>
    <span class="vb-tv">${total}</span></div>`);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” BUILDINGS TAB                                      â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderBuildings(list){
  const cont=$("#lss7-bld").empty();
  setV("#sv-bld-total", list.length);
  if(!list.length){cont.html(`<div class="lss7-empty">Keine Gebaeudedaten.</div>`);return;}

  const grp={};
  list.forEach(b=>{
    const t=b.building_type||0,icon=BICONS[t]||"B";
    if(!grp[t])grp[t]={icon,name:b.caption||`Typ ${t}`,count:0};
    grp[t].count++;
  });

  const sorted=Object.values(grp).sort((a,b)=>b.count-a.count);

  // Summary grid
  const sg=$(`<div class="sg sg3" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">Gebaeude gesamt</span><span class="sv c-cy" id="sv-bld-total-inner">${list.length}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Typen</span><span class="sv">${sorted.length}</span></div>`);
  const maxCount=sorted[0]?.count||0;
  sg.append(`<div class="sc"><span class="sl">Haeufigster Typ</span><span class="sv-sm c-bl">${sorted[0]?.icon||""} ${maxCount}x</span></div>`);
  cont.append(sg);

  const listDiv=$(`<div></div>`);
  sorted.forEach(g=>{
    listDiv.append(`<div class="lrow">
      <span class="lrow-icon">${g.icon}</span>
      <span class="lrow-name">${g.name}</span>
      <span class="lrow-val">${g.count}x</span></div>`);
  });
  cont.append(listDiv);
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” SCHOOLINGS TAB                                     â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderSchoolings(list){
  const cont=$("#lss7-sch").empty();
  const running=list.filter(s=>!s.dismissed);
  if(!running.length){cont.html(`<div class="lss7-empty">Keine laufenden Schulungen.</div>`);return;}

  const grp={};
  running.forEach(s=>{const k=s.caption||"Unbekannte Schulung";grp[k]=(grp[k]||0)+1;});

  const sg=$(`<div class="sg sg2" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">Aktive Schulungen</span><span class="sv c-cy">${running.length}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Schulungsarten</span><span class="sv">${Object.keys(grp).length}</span></div>`);
  cont.append(sg);

  const listDiv=$(`<div></div>`);
  Object.entries(grp).sort((a,b)=>b[1]-a[1]).forEach(([name,cnt])=>{
    listDiv.append(`<div class="lrow">
      <span class="lrow-icon">Sch</span>
      <span class="lrow-name">${name}</span>
      <span class="lrow-val">${cnt}x</span></div>`);
  });
  cont.append(listDiv);
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

  const sg=$(`<div class="sg sg2" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">AAOs gesamt</span><span class="sv c-pu">${list.length}</span></div>`);
  const withHk=list.filter(a=>a.hotkey).length;
  sg.append(`<div class="sc"><span class="sl">Mit Hotkey</span><span class="sv">${withHk}</span></div>`);
  cont.append(sg);

  const sorted=[...list].sort((a,b)=>(a.column||0)-(b.column||0)||(a.caption||"").localeCompare(b.caption||""));
  sorted.forEach(a=>{
    const col=a.color||"#6b7280";
    const hk=a.hotkey?`<span class="arr-hk">${a.hotkey}</span>`:"";
    cont.append(`<div class="arr-row">
      <div class="arr-color" style="background:${col}"></div>
      <span class="arr-name">${a.caption||"-"}</span>
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
  if(!S.creditHist.length){cont.html(`<div class="lss7-empty">Noch keine Verlaufsdaten.</div>`);return;}

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
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  RENDER â€” TEAM TAB                                           â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderTeam(users){
  const cont=$("#lss7-team").empty();
  if(!users.length){cont.html(`<div class="lss7-empty">Keine Mitgliederdaten.</div>`);return;}

  const roles=[
    {f:u=>u.role_flags?.owner,  lbl:"Eigentuemer", dot:"#f59e0b", badge:"Owner",    bg:"var(--amber3)", col:"var(--amber)"},
    {f:u=>u.role_flags?.admin,  lbl:"Admins",      dot:"#3b82f6", badge:"Admin",    bg:"var(--blue3)",  col:"var(--blue)"},
    {f:u=>u.role_flags?.coadmin,lbl:"Co-Admins",   dot:"#22c55e", badge:"Co-Admin", bg:"var(--green3)", col:"var(--green)"},
  ];

  const shown=new Set();
  roles.forEach(({f,lbl,dot,badge,bg,col})=>{
    const ms=users.filter(f);if(!ms.length)return;
    const g=$(`<div><div class="tg-head">${lbl}</div></div>`);
    ms.forEach(u=>{
      shown.add(u.id);
      g.append(`<div class="tm-row">
        <div class="tm-dot" style="background:${dot}"></div>
        <a class="tm-link" href="${BASE}/profile/${u.id}" target="_blank">${u.name}</a>
        <span class="tm-badge" style="background:${bg};color:${col};border:1px solid ${col}44">${badge}</span>
      </div>`);
    });
    cont.append(g);
  });

  const others=users.filter(u=>!shown.has(u.id));
  if(others.length){
    const g=$(`<div><div class="tg-head">Mitglieder (${others.length})</div></div>`);
    others.slice(0,40).forEach(u=>{
      g.append(`<div class="tm-row">
        <div class="tm-dot" style="background:var(--t4)"></div>
        <a class="tm-link" href="${BASE}/profile/${u.id}" target="_blank">${u.name}</a>
      </div>`);
    });
    if(others.length>40)g.append(`<div class="lss7-empty" style="padding:6px 14px">+${others.length-40} weitere</div>`);
    cont.append(g);
  }
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  FOOTER                                                      â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function updateFooter(){ $("#lss7-upd").text(timeAgo(S.lastApiTs)); }

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  BUILD UI                                                    â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildUI(){
  const panel=$(`<div id="lss7"></div>`);

  // â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel.append(`
    <div id="lss7-hd">
      <div class="hd-row">
        <div class="hd-ring"><img src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="LSS"></div>
        <div>
          <div class="hd-title">Verband Statistik Pro</div>
          <div class="hd-sub">Das Dashbord für dein Verband!</div>
        </div>
        <div class="hd-meta">
          <div id="lss7-live" title="Live-Daten aktiv"></div>
          <span class="bd bd-blue">v${V}</span>
          <span id="lss7-premium" class="bd bd-gold" style="display:${S.settings.panelTheme==="premium"?"inline-flex":"none"}">PREMIUM</span>
          <button id="lss7-col" title="Ein-/Ausklappen">Ausgeklappt</button>
          <button id="lss7-x" title="Schliessen">×</button>
        </div>
      </div>
    </div>`);

  panel.append(`
    <div class="prof-strip">
      <div class="prof-row">
        <img id="prof-av" class="prof-av" src="${S.profile.avatar||"https://www.leitstellenspiel.de/images/user.png"}" alt="Profil">
        <div class="prof-meta">
          <span id="prof-name" class="prof-name">${S.profile.name}</span>
          <span id="prof-rank" class="prof-rank">Dienstgrad: ${S.profile.rank}</span>
          <span id="prof-reward" class="prof-reward"></span>
          <span id="prof-progress" class="prof-sub">${S.profile.progressText}</span>
          <div class="prof-bar"><div id="prof-fill" class="prof-fill" style="width:${S.profile.progress}%"></div></div>
        </div>
      </div>
    </div>`);

  // â”€â”€ Quick-Stats Strip (4 Zellen) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel.append(`
    <div id="lss7-qs">
      <div class="qs-cell">
        <span class="qs-lbl">Spielzeit</span>
        <span id="lss7-playtime" class="qs-val mono">${fmtHHMM(S.playtime)}</span>
      </div>
      <div class="qs-div"></div>
      <div class="qs-cell">
        <span class="qs-lbl">Eigene Credits</span>
        <span id="qs-credits" class="qs-val" style="color:var(--green)"><span class="lspin"></span></span>
      </div>
      <div class="qs-div"></div>
      <div class="qs-cell">
        <span class="qs-lbl">Tagesverd.</span>
        <span id="qs-daily" class="qs-val" style="color:var(--green)">${fmtMoney(S.dailyEarn)}</span>
      </div>
      <div class="qs-div"></div>
      <div class="qs-cell">
        <span class="qs-lbl">Uhrzeit</span>
        <span id="lss7-clock" class="qs-val sm">${fmtClock()}</span>
      </div>
    </div>`);

  // â”€â”€ Tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const TABS=[
    {id:"tp-overview",  icon:"", label:"Uebersicht"},
    {id:"tp-vehicles",  icon:"", label:"Fahrzeuge"},
    {id:"tp-schoolings",icon:"", label:"Schulungen"},
    {id:"tp-aao",       icon:"", label:"AAO"},
    {id:"tp-history",   icon:"", label:"Verlauf"},
    {id:"tp-team",      icon:"", label:"Team"},
    {id:"tp-settings",  icon:"", label:"Settings"},
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
      <div class="sc w2">
        <span class="sl">Verband</span>
        <span class="sv c-bl" id="sv-alliname"><span class="lspin"></span></span>
      </div>
      <div class="sc">
        <span class="sl">Credits gesamt</span>
        <span class="sv c-gr" id="sv-total">-</span>
      </div>
      <div class="sc">
        <span class="sl">Verbandskasse</span>
        <span class="sv c-gr" id="sv-kasse">-</span>
      </div>
      <div class="sc">
        <span class="sl">Rang</span>
        <span class="sv c-am" id="sv-rank">-</span>
        <span id="sv-rank-next">Ranking wird geladen...</span>
      </div>
      <div class="sc">
        <span class="sl">Mitglieder</span>
        <span class="sv" id="sv-members">-</span>
        <div class="prg"><div class="prg-fill" id="sv-members-bar" style="width:0%;background:var(--blue)"></div></div>
      </div>
      <div class="sc">
        <span class="sl">Coins</span>
        <span class="sv c-pu" id="sv-mycoins"><span class="lspin"></span></span>
      </div>
      <div class="sc">
        <span class="sl">Tagesverdienst</span>
        <span class="sv c-gr" id="sv-daily">${fmtMoney(S.dailyEarn)}</span>
      </div>
      <div class="sc w2" id="rank-board">
        <div class="rank-mini-head">
          <span class="rank-mini-title">Ranking Umfeld</span>
          <span class="rank-mini-note" id="rank-mini-note">Lade...</span>
        </div>
        <div class="rank-mini-list" id="rank-mini-list"></div>
      </div>
      <div class="sc w2" id="weather-board" style="display:none">
        <span class="sl">Wetter</span>
        <div class="weather-mini" id="wx-overview-view"><span class="w-l">Keine Wetterdaten</span><span class="w-r">-</span></div>
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

  // TAB: Fahrzeuge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tVeh=$(`<div id="tp-vehicles" class="lpanel"></div>`);
  tVeh.append(`
    <div id="donut-wrap">
      <div id="lss7-donut"></div>
      <div id="donut-leg"><div class="lss7-empty"><span class="lspin"></span> Lade...</div></div>
    </div>
    <div class="lss7-div"></div>
    <div class="vb-wrap" id="lss7-vbars"><div class="lss7-empty"><span class="lspin"></span> Lade...</div></div>`);
  body.append(tVeh);

  // TAB: Schulungen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tSch=$(`<div id="tp-schoolings" class="lpanel"></div>`);
  tSch.append(`<div id="lss7-sch"><div class="lss7-empty"><span class="lspin"></span> Lade Schulungen...</div></div>`);
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
    <div id="lss7-hist"></div>`);
  body.append(tHist);

  // TAB: Team â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tTeam=$(`<div id="tp-team" class="lpanel"><div id="lss7-team"><div class="lss7-empty"><span class="lspin"></span> Lade Team...</div></div></div>`);
  body.append(tTeam);

  // TAB: Settings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const tSet=$(`<div id="tp-settings" class="lpanel"></div>`);
  const setWrap=$(`<div class="set-wrap"></div>`);

  const grpAct=$(`<div class="set-group"><div class="set-head">Aktionen</div></div>`);
  grpAct.append(mkBtn("Akt.","Alle Daten jetzt aktualisieren","id='sb-refresh' class='lbtn prime'"));
  setWrap.append(grpAct);

  const grpOpt=$(`<div class="set-group"><div class="set-head">Optionen</div></div>`);
  grpOpt.append(mkToggle("tog-notif","Browser-Benachrichtigungen","notifications"));
  grpOpt.append(mkToggle("tog-coins","Coins anzeigen","coins"));
  grpOpt.append(mkPlacementSelect());
  grpOpt.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Menü-Modus</span>
    <select id="sb-panel-mode" class="lss7-select">
      <option value="floating"${S.settings.panelMode==="floating"?" selected":""}>Floating</option>
      <option value="embedded"${S.settings.panelMode==="embedded"?" selected":""}>Layout-Box</option>
    </select>
  </label>`);
  grpOpt.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Panel-Größe</span>
    <select id="sb-size" class="lss7-select">
      <option value="small"${S.settings.panelSize==="small"?" selected":""}>Klein</option>
      <option value="normal"${S.settings.panelSize==="normal"?" selected":""}>Normal</option>
      <option value="large"${S.settings.panelSize==="large"?" selected":""}>Groß</option>
    </select>
  </label>`);
  grpOpt.append(`<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Panel-Theme</span>
    <select id="sb-theme" class="lss7-select">
      <option value="dark"${S.settings.panelTheme==="dark"?" selected":""}>Dark</option>
      <option value="light"${S.settings.panelTheme==="light"?" selected":""}>Light</option>
      <option value="midnight"${S.settings.panelTheme==="midnight"?" selected":""}>Midnight Blue</option>
      <option value="emerald"${S.settings.panelTheme==="emerald"?" selected":""}>Emerald Ops</option>
      <option value="sunset"${S.settings.panelTheme==="sunset"?" selected":""}>Sunset Neon</option>
      <option value="slate"${S.settings.panelTheme==="slate"?" selected":""}>Slate Pro</option>
      <option value="premium"${S.settings.panelTheme==="premium"?" selected":""}>Premium Gold</option>
    </select>
  </label>`);
  setWrap.append(grpOpt);

  const grpWx=$(`<div class="set-group"><div class="set-head">Wetter</div></div>`);
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
  grpWx.append(`<div class="set-note"><div class="weather-mini" id="wx-settings-view"><span class="w-l">Keine Wetterdaten</span><span class="w-r">-</span></div></div>`);
  setWrap.append(grpWx);

  const grpInfo=$(`<div class="set-group"><div class="set-head">Informationen</div></div>`);
  grpInfo.append(`<div class="set-note">${infoHTML()}</div>`);
  setWrap.append(grpInfo);

  const grpContact=$(`<div class="set-group"><div class="set-head">Kontakt</div></div>`);
  grpContact.append(`<div class="set-note">
    Bug gefunden, Feedback oder Verbesserungsvorschlag? Dann melde dich gern direkt im Spiel.
    <div style="margin-top:8px">
      <a class="lbtn prime" href="https://www.leitstellenspiel.de/profile/687089" target="_blank" rel="noopener">Kontakt aufnehmen</a>
    </div>
  </div>`);
  setWrap.append(grpContact);

  const grpPn=$(`<div class="set-group"><div class="set-head">Patch-Notes</div></div>`);
  grpPn.append(`<div class="set-note"><b>v5.8.3</b><br>Layout-Einbindung in den Einstellungen hinzugefügt, Banner im Layout ein-/ausklappbar, Profil-Informationen ergänzt, Wettervorhersage von 4 auf 7 Stunden erweitert, mehrere Fehler behoben inkl. Update-Überschreiben.</div>`);
  setWrap.append(grpPn);

  tSet.append(setWrap);
  body.append(tSet);
  panel.append(body);

  panel.append(mkAccordion("PN","Patch-Notes v5.8.3",patchHTML()));

  // â”€â”€ Footer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  panel.append(`
    <div id="lss7-ft">
      <span class="ft-l">(c) 2025 Fabian (Capt.BobbyNash)</span>
      <span class="ft-r">Aktualisiert: <span id="lss7-upd">-</span></span>
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
    if(id==="tp-vehicles"  && !panel.data("lv")){panel.data("lv",1);fetchVehicleStates();}
    if(id==="tp-schoolings"&& !panel.data("ls")){panel.data("ls",1);fetchSchoolings();}
    if(id==="tp-aao"       && !panel.data("la")){panel.data("la",1);fetchAAOs();}
    if(id==="tp-history"){renderHistTab();}
    if(id==="tp-overview"){setTimeout(drawChart,50);}
  });

  // Settings buttons
  panel.on("click","#sb-refresh",  e=>{ e.stopPropagation(); fetchAllData(); });
  panel.on("change","#sb-placement",e=>{
    e.stopPropagation();
    const v=String($(e.currentTarget).val()||"default");
    S.settings.panelPlacement=v;
    save();
    applyPanelMode();
  });
  panel.on("change","#sb-panel-mode",e=>{
    S.settings.panelMode=String($(e.currentTarget).val()||"floating");
    save();applyPanelMode();
  });
  panel.on("change","#sb-size",e=>{
    S.settings.panelSize=String($(e.currentTarget).val()||"normal");
    save();applyPanelMode();
  });
  panel.on("change","#sb-theme",e=>{
    S.settings.panelTheme=String($(e.currentTarget).val()||"dark");
    save();applyPanelMode();
  });
  panel.on("click","#lss7-col",e=>{
    e.stopPropagation();e.preventDefault();
    S.settings.panelCollapsed=!S.settings.panelCollapsed;
    save();applyPanelMode();
  });
  panel.on("change","#sb-weather-mode",e=>{
    S.settings.weatherMode=String($(e.currentTarget).val()||"off");
    save();renderWeather();
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

  // Close button
  panel.on("click","#lss7-x",      e=>{ e.stopPropagation(); togglePanel(false); });

  // Accordions
  panel.on("click",".lacc-hd",function(e){ e.stopPropagation(); $(this).closest(".lacc").toggleClass("open"); });

  // Toggles
  panel.on("click",".tog-row",function(e){
    e.stopPropagation();
    const key=$(this).data("key");
    S.settings[key]=!S.settings[key];save();
    $(this).find(".tog-track").toggleClass("on",S.settings[key]);
  });

  $("body").append(panel);
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
function mkPlacementSelect(){
  const cur=S.settings.panelPlacement||"default";
  const opts=[
    ["default","Normales Menü"],
    ["top-right","Oben rechts"],
    ["top-left","Oben links"],
    ["bottom-right","Unten rechts"],
    ["bottom-left","Unten links"],
  ];
  return `<label class="tog-row" style="justify-content:space-between;">
    <span class="tog-lbl">Menü-Position</span>
    <select id="sb-placement" class="lss7-select">
      ${opts.map(([v,l])=>`<option value="${v}"${cur===v?" selected":""}>${l}</option>`).join("")}
    </select>
  </label>`;
}
function getLayoutAnchor(){
  const rowMain=$("#row-main-template").first();
  const mapOuter=$("#map_outer").first();
  if(rowMain.length) return {el:rowMain, where:"before"};
  if(mapOuter.length) return {el:mapOuter, where:"before"};
  return {el:$("body"), where:"prepend"};
}
function applyPanelMode(){
  const panel=$("#lss7");
  const btnLi=$("#lss7-btn").closest("li");
  if(!panel.length) return;
  if(!panel.parent().is("body")) $("body").append(panel);
  panel.removeClass("layout align-right align-left emb-collapsed");
  btnLi.show();

  const mode=S.settings.panelMode||"floating";
  if(mode==="embedded"){
    const p=getLayoutAnchor();
    if(p.el && p.el.length){
      if(p.where==="before") p.el.before(panel);
      else if(p.where==="after") p.el.after(panel);
      else if(p.where==="prepend") p.el.prepend(panel);
      else p.el.append(panel);
    }
    panel.addClass("layout");
    if(S.settings.panelCollapsed) panel.addClass("emb-collapsed");
    panel.css({top:"auto",bottom:"auto",right:"auto",left:"auto",width:"100%",height:"auto"});
  } else {
    if(!panel.parent().is("body")) $("body").append(panel);
    const p=S.settings.panelPlacement||"default";
    const top=(p==="default"||p.startsWith("top")) ? "52px" : "auto";
    const bottom=(p.startsWith("bottom")) ? "14px" : "auto";
    const right=(p==="default"||p.endsWith("right")) ? "14px" : "auto";
    const left=(p.endsWith("left")) ? "14px" : "auto";
    const sz=S.settings.panelSize||"normal";
    const sizeMap={small:{w:440,h:620},normal:{w:500,h:760},large:{w:620,h:860}};
    const sm=sizeMap[sz]||sizeMap.normal;
    panel.css({top,bottom,right,left,width:`${sm.w}px`,height:`min(${sm.h}px, calc(100vh - 68px))`});
  }
  panel.removeClass("theme-dark theme-light theme-midnight theme-emerald theme-sunset theme-slate theme-premium");
  const th=String(S.settings.panelTheme||"dark");
  panel.addClass(`theme-${th}`);
  $("#lss7-premium").toggle(th==="premium");
  $("#lss7-col").text(S.settings.panelCollapsed?"Eingeklappt":"Ausgeklappt");
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
  // Strong fallback by credits (very close to allianceinfo credits)
  if(idx<0 && S.allianceCredits){
    const mine=Number(S.allianceCredits)||0;
    let bestIdx=-1,bestDiff=Number.POSITIVE_INFINITY;
    list.forEach((x,i)=>{
      const d=Math.abs((Number(x.credits)||0)-mine);
      if(d<bestDiff){bestDiff=d;bestIdx=i;}
    });
    const rel=mine>0?(bestDiff/mine):1;
    if(bestIdx>=0 && rel<=0.02) idx=bestIdx;
  }
  // Fallback chain if strict ID match is not available in the ranking rows
  if(idx<0 && S.allianceName){
    const n=norm(S.allianceName);
    idx=list.findIndex(x=>norm(x.name)===n);
  }
  if(idx<0 && S.allianceCredits){
    const mine=Number(S.allianceCredits)||0;
    let bestIdx=-1,bestDiff=Number.POSITIVE_INFINITY;
    list.forEach((x,i)=>{
      const d=Math.abs((Number(x.credits)||0)-mine);
      if(d<bestDiff){bestDiff=d;bestIdx=i;}
    });
    if(bestIdx>=0) idx=bestIdx;
  }
  if(idx<0 && S.allianceRank && S.allianceCredits){
    const r=Number(S.allianceRank);
    const mine=Number(S.allianceCredits)||0;
    const byRank=list.find(x=>Number(x.rank)===r);
    if(byRank){
      const d=Math.abs((Number(byRank.credits)||0)-mine);
      const rel=mine>0?(d/mine):1;
      if(rel<=0.02 || d<=10000000) idx=list.indexOf(byRank);
    }
  }
  // Final fallback: anchor by API rank to always render a useful neighborhood.
  if(idx<0 && S.allianceRank){
    const r=Number(S.allianceRank);
    const byRank=list.find(x=>Number(x.rank)===r);
    if(byRank) idx=list.indexOf(byRank);
  }
  if(idx<0){
    const domRank=readAllianceRankFromDom();
    const anchorRank=domRank || (S.allianceRank?Number(S.allianceRank):null);
    if(anchorRank && anchorRank>0){
      idx=Math.max(0,Math.min(list.length-1,anchorRank-1));
    }
  }
  if(idx<0) idx=Math.max(0,Math.floor(list.length/2));
  if(idx<0) return null;
  const me=list[idx];
  const above=idx>0?list[idx-1]:null;
  const needed=above?Math.max(0,Math.floor(above.credits-me.credits+1)):0;
  const start=Math.max(0,idx-2), end=Math.min(list.length-1,idx+2);
  const slice=list.slice(start,end+1);
  return {idx,me,above,needed,slice};
}
function renderRankSummary(ctx){
  if(!ctx){ setV("#sv-rank-next","Ranking nicht gefunden"); return; }
  if(!ctx.above){ setV("#sv-rank-next","Top-Rang erreicht"); return; }
  setV("#sv-rank-next",`Bis Rang ${ctx.above.rank}: ${fmtMoney(ctx.needed)}`);
}
function renderRankMini(ctx){
  if(!ctx){
    $("#rank-mini-note").text("Ranking nicht verfuegbar");
    $("#rank-mini-list").html("");
    return;
  }
  $("#rank-mini-note").text(ctx.above
    ? `Bis naechster Rang fehlen ${fmtMoney(ctx.needed)}`
    : "Top-Rang erreicht");
  const rows=ctx.slice.map(x=>{
    const isMe=x===ctx.me;
    const rankTxt=isMe && S.allianceRank ? `#${S.allianceRank}` : `#${x.rank}`;
    return `<div class="rank-mini-row ${isMe?"me":""}">
      <div class="rank-mini-r">${rankTxt}</div>
      <div class="rank-mini-n">${x.name}</div>
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

  // Primary path: browser-native fetch with session cookies
  fetch(API.alliancesPage,{credentials:"include"})
    .then(r=>r.ok?r.text():Promise.reject(new Error(`HTTP ${r.status}`)))
    .then(html=>{
      const first=applyRankHtml(html,1,25);
      const r=Number(S.allianceRank)||0;
      const targetPage=r>0?Math.floor((r-1)/(first.pageSize||25))+1:1;
      if(first.foundById) return;
      if(targetPage<=1){ if(!first.ok) $("#rank-mini-note").text("Ranking geladen (Fallback-Zuordnung aktiv)"); return; }
      fetch(`${API.alliancesPage}?page=${targetPage}`,{credentials:"include"})
        .then(rr=>rr.ok?rr.text():Promise.reject(new Error(`HTTP ${rr.status}`)))
        .then(h2=>{
          const second=applyRankHtml(h2,targetPage,first.pageSize||25);
          if(!second.foundById && !second.ok) $("#rank-mini-note").text("Ranking geladen (Fallback-Zuordnung aktiv)");
        })
        .catch(()=>{ if(!first.ok) $("#rank-mini-note").text("Ranking geladen (Fallback-Zuordnung aktiv)"); });
    })
    .catch(()=>{
      pageGet(API.alliancesPage,raw=>{
        const first=applyRankHtml(raw,1,25);
        const r=Number(S.allianceRank)||0;
        const targetPage=r>0?Math.floor((r-1)/(first.pageSize||25))+1:1;
        if(first.foundById) return;
        if(targetPage<=1){ if(!first.ok) $("#rank-mini-note").text("Ranking geladen (Fallback-Zuordnung aktiv)"); return; }
        pageGet(`${API.alliancesPage}?page=${targetPage}`,h2=>{
          const second=applyRankHtml(h2,targetPage,first.pageSize||25);
          if(!second.foundById && !second.ok) $("#rank-mini-note").text("Ranking geladen (Fallback-Zuordnung aktiv)");
        },()=>{ if(!first.ok) $("#rank-mini-note").text("Ranking geladen (Fallback-Zuordnung aktiv)"); });
      },()=>{
        renderRankSummary(null);
        renderRankMini(null);
      });
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
  const items=[
    "Neu: Menü kann in den Einstellungen als Layout-Box eingebunden werden (unter dem Header).",
    "Layout-Box kann per sichtbarem Banner-Button ein- und ausgeklappt werden.",
    "Profil-Informationen ergänzt und Darstellung verbessert.",
    "Wettervorhersage von 4 auf 7 Stunden erweitert.",
    "Mehrere Fehler behoben, inklusive Update-Problem beim Überschreiben der alten Version.",
    "Falls Update weiterhin nicht korrekt überschreibt: bitte Feedback über Kontakt senden.",
  ];
  return `<div style="color:var(--blue);font-weight:700;font-size:11px;margin-bottom:10px">
    v5.8.3 — Layout, Profil, Wetter & Update Fix</div>
    ${items.map(t=>`<div class="patch-i"><span class="patch-b">→</span><span>${t}</span></div>`).join("")}`;
}
function infoHTML(){
  const rows=[
    ["Ersteller","Fabian (Capt.BobbyNash)"],
    ["Supporter","m75e, twoyears"],
    ["Version",V],
    ["APIs","allianceinfo · userinfo · vehicle_states · buildings · alliance_schoolings · v2/vehicles · v1/vehicle_distances · v1/aaos"],
    ["Panel-Typ","Floating, Bootstrap-unabhängig"],
    ["Alliance-Interval","60s"],
    ["Fahrzeugstatus","90s"],
    ["Gebäude/Schulungen","300s"],
    ["Kilometer/AAO","300s (Lazy)"],
  ];
  return rows.map(([k,v])=>`<div class="info-r"><span class="info-k">${k}</span><span class="info-v">${v}</span></div>`).join("");
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  NAV TRIGGER                                                 â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function buildTrigger(){
  const li=$(`<li></li>`);
  const a=$(`
    <a href="#" id="lss7-btn">
      <img src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="LSS">
      <span class="lss7-nav-lbl">Verband</span>
      <div id="lss7-live"></div>
      <span class="lss7-nav-arr">v</span>
    </a>`);
  a.on("click",function(e){ e.preventDefault();e.stopPropagation();togglePanel(); });
  li.append(a);

  const nb=$("#navbar-main-collapse .navbar-nav");
  if(nb.length)nb.append(li);
  else console.error("[LSS7] Navbar nicht gefunden.");
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
function checkUpdate(){
  const cmpVer=(a,b)=>{
    const pa=String(a||"0").split(".").map(x=>parseInt(x,10)||0);
    const pb=String(b||"0").split(".").map(x=>parseInt(x,10)||0);
    const n=Math.max(pa.length,pb.length);
    for(let i=0;i<n;i++){
      const da=pa[i]||0, db=pb[i]||0;
      if(da>db) return 1;
      if(da<db) return -1;
    }
    return 0;
  };
  GM_xmlhttpRequest({
    method:"GET",url:`${UPDATE_URL}?t=${Date.now()}`,
    onload(r){
      if(r.status!==200)return;
      const m=r.responseText.match(/@version\s+([\d.]+)/);
      if(m && cmpVer(m[1],V)>0) showUpdate(m[1]);
    }
  });
}
function showUpdate(nv){
  const o=$(`
    <div id="lss7-uo">
      <div id="lss7-ub">
        <button class="ub-x" id="ub-x" title="Schliessen">×</button>
        <div class="ub-tag">NEUES UPDATE</div>
        <h2>Update verfuegbar</h2>
        <p>Es ist eine neue Version verfuegbar.</p>
        <div class="ub-vers">
          <span>Neu: <strong>v${nv}</strong></span>
          <span>Aktuell: <strong>v${V}</strong></span>
        </div>
        <div class="ub-row">
          <button class="ub-btn ub-sk" id="ub-skip">Spaeter</button>
          <a class="ub-btn ub-ok" id="ub-update" href="${UPDATE_URL}" target="_blank">Aktualisieren</a>
        </div>
      </div>
    </div>`);
  $("body").append(o);
  o.on("click","#ub-skip",()=>o.remove());
  o.on("click","#ub-x",()=>o.remove());
  o.on("click","#ub-update",()=>{
    o.remove();
    setTimeout(()=>window.location.reload(),450);
  });
  o.on("click",e=>{if($(e.target).is(o))o.remove();});
}

// â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
// â•‘  INIT                                                        â•‘
// â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
$(document).ready(()=>{
  load();
  buildUI();
  buildTrigger();
  applyPanelMode();

  // Initialer Fetch
  fetchAlliance();
  fetchUserinfo();
  fetchProfileCard();
  fetchDailyEarnFromOverview();
  fetchWeather();
  renderWeather();

  // Intervals
  setInterval(tickTimer,          ITV.timer);
  setInterval(tickClock,          ITV.clock);
  setInterval(checkMidnight,      ITV.midnight);
  setInterval(fetchAlliance,      ITV.alliance);
  setInterval(fetchUserinfo,      ITV.userinfo);
  setInterval(fetchProfileCard,   ITV.profile);
  setInterval(fetchVehicleStates, ITV.vstates);
  setInterval(fetchSchoolings,    ITV.schools);
  setInterval(fetchDailyEarnFromOverview, ITV.dailyEarn);
  setInterval(fetchWeather,       ITV.weather);
  setInterval(updateFooter,       ITV.footer);

  // Daily-Earnings quick-stat sync
  setInterval(()=>setV("#qs-daily",fmtMoney(S.dailyEarn)), 5000);

  checkUpdate();
});

window.addEventListener("beforeunload", save);

})();

