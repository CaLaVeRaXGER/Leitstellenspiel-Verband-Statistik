// ==UserScript==
// @name         LSS Verband Statistik Pro
// @namespace    http://tampermonkey.net/
// @version      5.2.0
// @description  Ultimate Premium Dashboard: Floating Panel, 8 APIs, Live-Charts, Fahrzeugstatus-Donut, Kilometerstand, ARR-Übersicht, Gebäude, Schulungen, Verlaufshistorie, Team, Dark-Design.
// @author       Fabian (Capt.BobbyNash)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://github.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// @downloadURL  https://github.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// ==/UserScript==

(function () {
"use strict";

// ╔══════════════════════════════════════════════════════════════╗
// ║  KONFIGURATION                                               ║
// ╚══════════════════════════════════════════════════════════════╝
const V   = "7.0.0";
const BASE = "https://www.leitstellenspiel.de";
const UPDATE_URL = "https://github.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/raw/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js";

const API = {
  alliance:    `${BASE}/api/allianceinfo`,
  userinfo:    `${BASE}/api/userinfo`,
  vStates:     `${BASE}/api/vehicle_states`,
  buildings:   `${BASE}/api/buildings`,
  schoolings:  `${BASE}/api/alliance_schoolings`,
  vehicles:    `${BASE}/api/v2/vehicles`,
  vDistances:  `${BASE}/api/v1/vehicle_distances.json`,
  aaos:        `${BASE}/api/v1/aaos`,
};

const ITV = {
  clock:    1000,
  timer:    1000,
  alliance: 60000,
  userinfo: 60000,
  vstates:  90000,
  buildings:300000,
  schools:  300000,
  vehicles: 300000,
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

const BICONS = {0:"🚒",1:"🔑",2:"🚑",3:"🚓",4:"🏥",5:"🛬",6:"🚒",7:"🏫",
  8:"🦟",9:"🚑",11:"🏗️",12:"🛟",13:"🏗️",14:"🚁",15:"🚢",
  18:"🏛️",20:"🚃",21:"🧱",25:"🏪"};

// ╔══════════════════════════════════════════════════════════════╗
// ║  CSS — DESIGN SYSTEM                                         ║
// ╚══════════════════════════════════════════════════════════════╝
GM_addStyle(`
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

/* ── Tokens ─────────────────────────────────────────────────── */
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
  --sh:0 0 0 1px rgba(255,255,255,0.03) inset,
       0 4px 24px rgba(0,0,0,0.5),
       0 20px 60px rgba(0,0,0,0.6),
       0 0 80px rgba(0,0,0,0.4);
}

/* ── Floating Panel ──────────────────────────────────────────── */
#lss7 {
  position:fixed; top:52px; right:14px;
  width:500px; max-height:calc(100vh - 68px);
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
  animation:lss7-in .18s cubic-bezier(.4,0,.2,1) both;
}
#lss7.open { display:flex; }
@keyframes lss7-in {
  from{opacity:0;transform:translateY(-8px) scale(.98)}
  to  {opacity:1;transform:translateY(0)   scale(1)}
}

/* ── Nav Trigger ─────────────────────────────────────────────── */
#lss7-btn {
  display:inline-flex !important;
  align-items:center; gap:6px;
  padding:5px 10px; border-radius:6px;
  cursor:pointer; transition:background .15s;
  user-select:none; text-decoration:none !important;
}
#lss7-btn:hover { background:rgba(255,255,255,0.07) !important; }
#lss7-btn img   { height:17px; width:auto; opacity:.9; }
.lss7-nav-lbl   { font-size:11.5px; font-weight:600; color:rgba(255,255,255,.8); }
.lss7-nav-arr   { font-size:8px; color:rgba(255,255,255,.35); transition:transform .2s; }
#lss7-btn.open .lss7-nav-arr { transform:rotate(180deg); }
#lss7-live {
  width:6px; height:6px; border-radius:50%;
  background:var(--green); box-shadow:0 0 5px var(--green);
  animation:lpulse 2.4s ease-in-out infinite;
}
@keyframes lpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.3;transform:scale(.65)}}

/* ── Header ──────────────────────────────────────────────────── */
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

/* Close */
#lss7-x {
  width:26px;height:26px;border-radius:7px;flex-shrink:0;
  background:rgba(255,255,255,.04);border:1px solid var(--b1);
  color:var(--t3);font-size:12px;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:all .15s;
}
#lss7-x:hover{background:var(--red3);color:var(--red);border-color:rgba(239,68,68,.4);}

/* ── Quick-Stats Strip ───────────────────────────────────────── */
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

/* ── Notification Banner ─────────────────────────────────────── */
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

/* ── Tabs ────────────────────────────────────────────────────── */
#lss7-tabs{
  flex-shrink:0;display:flex;
  background:var(--bg1);border-bottom:1px solid var(--b1);
  overflow-x:auto;scrollbar-width:none;
}
#lss7-tabs::-webkit-scrollbar{display:none;}
.ltab{
  flex-shrink:0;padding:8px 12px;cursor:pointer;user-select:none;
  font-size:11px;font-weight:600;color:var(--t4);
  border-bottom:2px solid transparent;
  display:flex;align-items:center;gap:4px;white-space:nowrap;
  transition:all .14s;
}
.ltab:hover{color:var(--t2);background:rgba(255,255,255,.03);}
.ltab.active{color:var(--blue);border-bottom-color:var(--blue);background:rgba(59,130,246,.05);}

/* ── Scrollable Content ──────────────────────────────────────── */
#lss7-body{
  flex:1;overflow-y:auto;
  scrollbar-width:thin;scrollbar-color:var(--b2) transparent;
}
#lss7-body::-webkit-scrollbar{width:3px;}
#lss7-body::-webkit-scrollbar-thumb{background:var(--b2);border-radius:2px;}

.lpanel{display:none;}
.lpanel.active{display:block;}

/* ── Section Label ───────────────────────────────────────────── */
.lss7-sec{
  padding:6px 14px 3px;
  font-size:9px;font-weight:700;text-transform:uppercase;
  letter-spacing:1.2px;color:var(--t4);
  border-top:1px solid var(--b1);margin-top:2px;
}
.lss7-sec:first-child{border-top:none;margin-top:0;}

/* ── Stat Grid ───────────────────────────────────────────────── */
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

/* ── Progress Bar ────────────────────────────────────────────── */
.prg{height:3px;border-radius:2px;background:var(--b1);overflow:hidden;margin-top:5px;}
.prg-fill{height:100%;border-radius:2px;transition:width .6s ease;}

/* ── Chart ───────────────────────────────────────────────────── */
#cv-wrap{padding:12px 14px 10px;border-top:1px solid var(--b1);}
.cv-hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.cv-title{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--t4);}
.cv-meta{font-size:10px;color:var(--t4);}
#lss7-chart{width:100%;height:60px;display:block;}

/* ── Donut ───────────────────────────────────────────────────── */
#donut-wrap{display:flex;align-items:center;gap:14px;padding:14px 14px 10px;}
#lss7-donut{width:88px;height:88px;flex-shrink:0;}
#donut-leg{flex:1;display:flex;flex-direction:column;gap:4px;}
.dl-row{display:flex;align-items:center;gap:6px;font-size:11px;}
.dl-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.dl-lbl{color:var(--t3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;}
.dl-val{font-family:var(--mono);font-size:10px;font-weight:600;color:var(--t2);min-width:26px;text-align:right;}
.dl-pct{font-size:9px;color:var(--t4);min-width:30px;text-align:right;}

/* ── Vehicle Bars ────────────────────────────────────────────── */
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

/* ── List Rows ───────────────────────────────────────────────── */
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

/* ── Credit History ──────────────────────────────────────────── */
.hist-row{
  display:flex;gap:8px;padding:5px 14px;
  border-bottom:1px solid var(--b0);font-size:11px;align-items:center;
}
.hist-row:last-child{border-bottom:none;}
.hist-t{color:var(--t4);min-width:54px;font-family:var(--mono);font-size:10px;}
.hist-v{flex:1;font-weight:600;color:var(--t2);font-family:var(--mono);}
.hist-d{min-width:72px;text-align:right;font-family:var(--mono);font-size:10px;font-weight:700;}

/* ── KM-Tabelle ──────────────────────────────────────────────── */
.km-row{
  display:flex;align-items:center;gap:8px;
  padding:5px 14px;border-bottom:1px solid var(--b0);font-size:11px;
}
.km-row:last-child{border-bottom:none;}
.km-name{flex:1;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.km-total{font-family:var(--mono);font-size:10px;font-weight:700;color:var(--t2);min-width:60px;text-align:right;}
.km-30d  {font-family:var(--mono);font-size:10px;color:var(--green);min-width:58px;text-align:right;}

/* ── ARR Table ───────────────────────────────────────────────── */
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

/* ── Team ────────────────────────────────────────────────────── */
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

/* ── Settings ────────────────────────────────────────────────── */
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
  background:var(--bg2);border:1px solid var(--b3);border-radius:16px;
  padding:30px 26px;width:330px;text-align:center;
  box-shadow:0 40px 100px rgba(0,0,0,.85);font-family:var(--font);color:var(--t1);
  animation:popin .22s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes popin{from{opacity:0;transform:scale(.86) translateY(-10px)}}
.ub-icon{font-size:42px;margin-bottom:14px;}
#lss7-ub h2{font-size:19px;font-weight:700;margin:0 0 8px;}
#lss7-ub p {font-size:13px;color:var(--t4);line-height:1.6;margin:0 0 22px;}
.ub-row{display:flex;gap:8px;}
.ub-btn{
  flex:1;padding:10px;font-size:12px;font-weight:700;
  border-radius:var(--rsm);border:none;cursor:pointer;
  font-family:var(--font);transition:all .15s;text-decoration:none;display:block;
}
.ub-ok{background:var(--blue);color:#fff;}
.ub-ok:hover{background:var(--blueh);}
.ub-sk{background:rgba(255,255,255,.06);color:var(--t3);border:1px solid var(--b2);}
.ub-sk:hover{background:rgba(255,255,255,.1);color:var(--t1);}

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
`);

// ╔══════════════════════════════════════════════════════════════╗
// ║  STATE                                                       ║
// ╚══════════════════════════════════════════════════════════════╝
const S = {
  playtime:0, lastTs:Date.now(),
  lastAlliCreds:0, dailyEarn:0,
  lastDate:todayStr(),
  creditHist:[],     // [{ts,v}]
  userCredits:0, userCoins:0,
  lastApiTs:null,
  settings:{ notifications:true, coins:true, compact:false },
};

// ╔══════════════════════════════════════════════════════════════╗
// ║  PERSISTENCE                                                 ║
// ╚══════════════════════════════════════════════════════════════╝
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
  if(newDay)save();
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  UTILITIES                                                   ║
// ╚══════════════════════════════════════════════════════════════╝
function todayStr(){return new Date().toISOString().split("T")[0];}
function fmt(n,u=""){return typeof n==="number"?n.toLocaleString("de-DE")+(u?" "+u:""):"—";}
function fmtMoney(n){return typeof n==="number"?n.toLocaleString("de-DE")+" ₡":"—";}
function fmtKm(n){
  if(typeof n!=="number")return "—";
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
  if(!ts)return "—";
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  TIMER / CLOCK                                               ║
// ╚══════════════════════════════════════════════════════════════╝
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
  }
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  CREDIT HISTORY                                              ║
// ╚══════════════════════════════════════════════════════════════╝
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
  const W=canvas.offsetWidth||460,H=60;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext("2d");
  ctx.clearRect(0,0,W,H);

  if(h.length<2){
    ctx.fillStyle="rgba(255,255,255,.03)";
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle="rgba(255,255,255,.12)";
    ctx.font="11px Inter,sans-serif";ctx.textAlign="center";
    ctx.fillText("Daten werden gesammelt…",W/2,H/2+4);
    return;
  }

  const vals=h.map(p=>p.v),mn=Math.min(...vals),mx=Math.max(...vals),rng=mx-mn||1;
  const p={l:2,r:2,t:7,b:5};
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
  setH("#cv-meta",`<span style="color:${col};font-weight:700">${diff>=0?"+":""}${fmt(diff)} ₡</span> letzte Änderung`);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  DONUT CHART                                                 ║
// ╚══════════════════════════════════════════════════════════════╝
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  API — FETCH FUNCTIONS                                       ║
// ╚══════════════════════════════════════════════════════════════╝
function fetchAlliance(){
  apiGet(API.alliance,d=>{
    S.lastApiTs=Date.now();
    const tot=d.credits_total||0;
    if(S.lastAlliCreds>0&&tot>S.lastAlliCreds)S.dailyEarn+=tot-S.lastAlliCreds;
    S.lastAlliCreds=tot;save();
    pushHist(tot);
    renderOverview(d);
    renderTeam(d.users||[]);
    updateFooter();
  });
}

function fetchUserinfo(){
  apiGet(API.userinfo,d=>{
    S.userCredits=d.credits||0;S.userCoins=d.coins||0;
    setV("#qs-credits",fmtMoney(S.userCredits));
    setV("#sv-mycoins",fmt(S.userCoins));
  });
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
  fetchBuildings(); fetchSchoolings(); fetchVehicleDistances(); fetchAAOs();
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — OVERVIEW TAB                                       ║
// ╚══════════════════════════════════════════════════════════════╝
function renderOverview(d){
  const id=d.id||"#",name=d.name||"Unbekannt";
  const link=`<a href="${BASE}/alliances/${id}" target="_blank">${name}</a>`;
  setH("#sv-alliname",link);
  setV("#sv-total",   fmtMoney(d.credits_total||0));
  setV("#sv-kasse",   fmtMoney(d.credits_current||0));
  setV("#sv-members", d.user_count||0);
  setV("#sv-rank",    d.rank||"—");
  setV("#sv-daily",   fmtMoney(S.dailyEarn));

  const mc=d.user_count||0,maxM=100;
  const pct=Math.min(100,Math.round(mc/maxM*100));
  $("#sv-members-bar").css({width:pct+"%",background:pct>80?"var(--amber)":"var(--blue)"});
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — VEHICLES TAB                                       ║
// ╚══════════════════════════════════════════════════════════════╝
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — BUILDINGS TAB                                      ║
// ╚══════════════════════════════════════════════════════════════╝
function renderBuildings(list){
  const cont=$("#lss7-bld").empty();
  setV("#sv-bld-total", list.length);
  if(!list.length){cont.html(`<div class="lss7-empty">Keine Gebäudedaten.</div>`);return;}

  const grp={};
  list.forEach(b=>{
    const t=b.building_type||0,icon=BICONS[t]||"🏢";
    if(!grp[t])grp[t]={icon,name:b.caption||`Typ ${t}`,count:0};
    grp[t].count++;
  });

  const sorted=Object.values(grp).sort((a,b)=>b.count-a.count);

  // Summary grid
  const sg=$(`<div class="sg sg3" style="margin-bottom:1px"></div>`);
  sg.append(`<div class="sc"><span class="sl">Gebäude gesamt</span><span class="sv c-cy" id="sv-bld-total-inner">${list.length}</span></div>`);
  sg.append(`<div class="sc"><span class="sl">Typen</span><span class="sv">${sorted.length}</span></div>`);
  const maxCount=sorted[0]?.count||0;
  sg.append(`<div class="sc"><span class="sl">Häufigster Typ</span><span class="sv-sm c-bl">${sorted[0]?.icon||""} ${maxCount}×</span></div>`);
  cont.append(sg);

  const listDiv=$(`<div></div>`);
  sorted.forEach(g=>{
    listDiv.append(`<div class="lrow">
      <span class="lrow-icon">${g.icon}</span>
      <span class="lrow-name">${g.name}</span>
      <span class="lrow-val">${g.count}×</span></div>`);
  });
  cont.append(listDiv);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — SCHOOLINGS TAB                                     ║
// ╚══════════════════════════════════════════════════════════════╝
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
      <span class="lrow-icon">🎓</span>
      <span class="lrow-name">${name}</span>
      <span class="lrow-val">${cnt}×</span></div>`);
  });
  cont.append(listDiv);
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — DISTANCES TAB                                      ║
// ╚══════════════════════════════════════════════════════════════╝
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — AAO TAB                                            ║
// ╚══════════════════════════════════════════════════════════════╝
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
      <span class="arr-name">${a.caption||"—"}</span>
      ${hk}
    </div>`);
  });
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — HISTORY TAB                                        ║
// ╚══════════════════════════════════════════════════════════════╝
function renderHistTab(){
  const cont=$("#lss7-hist").empty();
  setV("#sv-hist-cnt",S.creditHist.length);
  if(!S.creditHist.length){cont.html(`<div class="lss7-empty">Noch keine Verlaufsdaten.</div>`);return;}

  const h=[...S.creditHist].reverse();

  const hdr=$(`<div class="sort-hdr" style="grid-template-columns:54px 1fr 80px">
    <span>Zeit</span><span>Credits</span><span style="text-align:right">Änderung</span>
  </div>`);
  cont.append(hdr);

  h.forEach((p,i)=>{
    const prev=h[i+1];
    const diff=prev?p.v-prev.v:0;
    const sign=diff>0?"+":"";
    const col=diff>0?"var(--green)":diff<0?"var(--red)":"var(--t4)";
    cont.append(`<div class="hist-row">
      <span class="hist-t">${fmtShortTime(p.ts)}</span>
      <span class="hist-v">${fmt(p.v)} ₡</span>
      <span class="hist-d" style="color:${col}">${diff!==0?sign+fmt(diff):""}</span>
    </div>`);
  });
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  RENDER — TEAM TAB                                           ║
// ╚══════════════════════════════════════════════════════════════╝
function renderTeam(users){
  const cont=$("#lss7-team").empty();
  if(!users.length){cont.html(`<div class="lss7-empty">Keine Mitgliederdaten.</div>`);return;}

  const roles=[
    {f:u=>u.role_flags?.owner,  lbl:"👑 Eigentümer", dot:"#f59e0b", badge:"Owner",    bg:"var(--amber3)", col:"var(--amber)"},
    {f:u=>u.role_flags?.admin,  lbl:"🔷 Admins",     dot:"#3b82f6", badge:"Admin",    bg:"var(--blue3)",  col:"var(--blue)"},
    {f:u=>u.role_flags?.coadmin,lbl:"🟢 Co-Admins",  dot:"#22c55e", badge:"Co-Admin", bg:"var(--green3)", col:"var(--green)"},
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
    const g=$(`<div><div class="tg-head">👤 Mitglieder (${others.length})</div></div>`);
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  FOOTER                                                      ║
// ╚══════════════════════════════════════════════════════════════╝
function updateFooter(){ $("#lss7-upd").text(timeAgo(S.lastApiTs)); }

// ╔══════════════════════════════════════════════════════════════╗
// ║  BUILD UI                                                    ║
// ╚══════════════════════════════════════════════════════════════╝
function buildUI(){
  const panel=$(`<div id="lss7"></div>`);

  // ── Header ─────────────────────────────────────────────────
  panel.append(`
    <div id="lss7-hd">
      <div class="hd-row">
        <div class="hd-ring">🏛</div>
        <div>
          <div class="hd-title">Verband Statistik Pro</div>
          <div class="hd-sub">Leitstellenspiel Ultimate Dashboard</div>
        </div>
        <div class="hd-meta">
          <div id="lss7-live" title="Live-Daten aktiv"></div>
          <span class="bd bd-blue">v${V}</span>
          <button id="lss7-x" title="Schließen">✕</button>
        </div>
      </div>
    </div>`);

  // ── Quick-Stats Strip (4 Zellen) ────────────────────────────
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

  // ── Tabs ────────────────────────────────────────────────────
  const TABS=[
    {id:"tp-overview",  icon:"📊", label:"Übersicht"},
    {id:"tp-vehicles",  icon:"🚒", label:"Fahrzeuge"},
    {id:"tp-buildings", icon:"🏢", label:"Gebäude"},
    {id:"tp-schoolings",icon:"🎓", label:"Schulungen"},
    {id:"tp-km",        icon:"🛣️",  label:"Kilometer"},
    {id:"tp-aao",       icon:"📋", label:"AAO"},
    {id:"tp-history",   icon:"📈", label:"Verlauf"},
    {id:"tp-team",      icon:"👥", label:"Team"},
    {id:"tp-settings",  icon:"⚙️",  label:"Settings"},
  ];
  const tabBar=$(`<div id="lss7-tabs"></div>`);
  TABS.forEach((t,i)=>tabBar.append(
    `<div class="ltab${i===0?" active":""}" data-tab="${t.id}">${t.icon} ${t.label}</div>`
  ));
  panel.append(tabBar);

  // ── Body ────────────────────────────────────────────────────
  const body=$(`<div id="lss7-body"></div>`);

  // TAB: Übersicht ─────────────────────────────────────────────
  const tOver=$(`<div id="tp-overview" class="lpanel active"></div>`);
  tOver.append(`
    <div class="sg sg2">
      <div class="sc w2">
        <span class="sl">Verband</span>
        <span class="sv c-bl" id="sv-alliname"><span class="lspin"></span></span>
      </div>
      <div class="sc">
        <span class="sl">Credits gesamt</span>
        <span class="sv c-gr" id="sv-total">—</span>
      </div>
      <div class="sc">
        <span class="sl">Verbandskasse</span>
        <span class="sv c-gr" id="sv-kasse">—</span>
      </div>
      <div class="sc">
        <span class="sl">Rang</span>
        <span class="sv c-am" id="sv-rank">—</span>
      </div>
      <div class="sc">
        <span class="sl">Mitglieder</span>
        <span class="sv" id="sv-members">—</span>
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
      <div class="sc">
        <span class="sl">Gebäude</span>
        <span class="sv c-cy" id="sv-bld-total">—</span>
      </div>
    </div>
    <div id="cv-wrap">
      <div class="cv-hdr">
        <span class="cv-title">Kreditverlauf (heute)</span>
        <span class="cv-meta" id="cv-meta">Sammle Daten…</span>
      </div>
      <canvas id="lss7-chart"></canvas>
    </div>`);
  body.append(tOver);

  // TAB: Fahrzeuge ─────────────────────────────────────────────
  const tVeh=$(`<div id="tp-vehicles" class="lpanel"></div>`);
  tVeh.append(`
    <div id="donut-wrap">
      <div id="lss7-donut"></div>
      <div id="donut-leg"><div class="lss7-empty"><span class="lspin"></span> Lade…</div></div>
    </div>
    <div class="lss7-div"></div>
    <div class="vb-wrap" id="lss7-vbars"><div class="lss7-empty"><span class="lspin"></span> Lade…</div></div>`);
  body.append(tVeh);

  // TAB: Gebäude ───────────────────────────────────────────────
  const tBld=$(`<div id="tp-buildings" class="lpanel"></div>`);
  tBld.append(`<div id="lss7-bld"><div class="lss7-empty"><span class="lspin"></span> Lade Gebäude…</div></div>`);
  body.append(tBld);

  // TAB: Schulungen ────────────────────────────────────────────
  const tSch=$(`<div id="tp-schoolings" class="lpanel"></div>`);
  tSch.append(`<div id="lss7-sch"><div class="lss7-empty"><span class="lspin"></span> Lade Schulungen…</div></div>`);
  body.append(tSch);

  // TAB: Kilometer ─────────────────────────────────────────────
  const tKm=$(`<div id="tp-km" class="lpanel"></div>`);
  tKm.append(`<div id="lss7-km"><div class="lss7-empty"><span class="lspin"></span> Lade Kilometerdaten…</div></div>`);
  body.append(tKm);

  // TAB: AAO ───────────────────────────────────────────────────
  const tAAO=$(`<div id="tp-aao" class="lpanel"></div>`);
  tAAO.append(`<div id="lss7-aao"><div class="lss7-empty"><span class="lspin"></span> Lade AAOs…</div></div>`);
  body.append(tAAO);

  // TAB: Verlauf ───────────────────────────────────────────────
  const tHist=$(`<div id="tp-history" class="lpanel"></div>`);
  tHist.append(`
    <div class="sg sg2">
      <div class="sc">
        <span class="sl">Verlaufspunkte</span>
        <span class="sv" id="sv-hist-cnt">${S.creditHist.length}</span>
      </div>
      <div class="sc">
        <span class="sl">Erster Eintrag</span>
        <span class="sv-sm">${S.creditHist.length?fmtShortTime(S.creditHist[0].ts):"—"}</span>
      </div>
    </div>
    <div id="lss7-hist"></div>`);
  body.append(tHist);

  // TAB: Team ──────────────────────────────────────────────────
  const tTeam=$(`<div id="tp-team" class="lpanel"><div id="lss7-team"><div class="lss7-empty"><span class="lspin"></span> Lade Team…</div></div></div>`);
  body.append(tTeam);

  // TAB: Settings ──────────────────────────────────────────────
  const tSet=$(`<div id="tp-settings" class="lpanel"></div>`);
  const setWrap=$(`<div class="set-wrap"></div>`);

  const grpAct=$(`<div class="set-group"><div class="set-head">Aktionen</div></div>`);
  grpAct.append(mkBtn("🔄","Alle Daten jetzt aktualisieren","id='sb-refresh' class='lbtn prime'"));
  setWrap.append(grpAct);

  const grpRst=$(`<div class="set-group"><div class="set-head">Zurücksetzen</div></div>`);
  grpRst.append(mkBtn("⏱","Spielzeit zurücksetzen","id='sb-timer' class='lbtn danger'"));
  grpRst.append(mkBtn("💰","Tagesverdienst zurücksetzen","id='sb-earn' class='lbtn danger'"));
  grpRst.append(mkBtn("📈","Kreditverlauf löschen","id='sb-hist' class='lbtn danger'"));
  setWrap.append(grpRst);

  const grpOpt=$(`<div class="set-group"><div class="set-head">Optionen</div></div>`);
  grpOpt.append(mkToggle("tog-notif","Browser-Benachrichtigungen","notifications"));
  grpOpt.append(mkToggle("tog-coins","Coins anzeigen","coins"));
  setWrap.append(grpOpt);

  tSet.append(setWrap);
  body.append(tSet);
  panel.append(body);

  // ── Accordions ──────────────────────────────────────────────
  panel.append(mkAccordion("📋","Patch-Notes v7.0",patchHTML()));
  panel.append(mkAccordion("ℹ️","Informationen",infoHTML()));

  // ── Footer ──────────────────────────────────────────────────
  panel.append(`
    <div id="lss7-ft">
      <span class="ft-l">© 2025 Fabian (Capt.BobbyNash)</span>
      <span class="ft-r">Aktualisiert: <span id="lss7-upd">—</span></span>
    </div>`);

  // ── EVENTS: stopPropagation auf allem im Panel ───────────────
  // Dies verhindert dass Bootstrap oder LSS den Click abfängt
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

    // Lazy fetch beim ersten Öffnen
    if(id==="tp-vehicles"  && !panel.data("lv")){panel.data("lv",1);fetchVehicleStates();}
    if(id==="tp-buildings" && !panel.data("lb")){panel.data("lb",1);fetchBuildings();}
    if(id==="tp-schoolings"&& !panel.data("ls")){panel.data("ls",1);fetchSchoolings();}
    if(id==="tp-km"        && !panel.data("lk")){panel.data("lk",1);fetchVehicleDistances();}
    if(id==="tp-aao"       && !panel.data("la")){panel.data("la",1);fetchAAOs();}
    if(id==="tp-history"){renderHistTab();}
    if(id==="tp-overview"){setTimeout(drawChart,50);}
  });

  // Settings buttons
  panel.on("click","#sb-refresh",  e=>{ e.stopPropagation(); fetchAllData(); });
  panel.on("click","#sb-timer",    e=>{ e.stopPropagation(); S.playtime=0;save();$("#lss7-playtime").text(fmtHHMM(0)); });
  panel.on("click","#sb-earn",     e=>{ e.stopPropagation(); S.dailyEarn=0;S.lastAlliCreds=0;save();setV("#sv-daily",fmtMoney(0));setV("#qs-daily",fmtMoney(0)); });
  panel.on("click","#sb-hist",     e=>{ e.stopPropagation(); S.creditHist=[];save();drawChart();renderHistTab(); });

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

// ─── Helpers ─────────────────────────────────────────────────
function mkBtn(icon,label,attrs){
  return `<button ${attrs}><span class="lbtn-i">${icon}</span>${label}</button>`;
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
    <div class="lacc-hd"><span>${icon}</span><span>${title}</span><span class="lacc-arr">▼</span></div>
    <div class="lacc-body"><div class="lacc-content">${body}</div></div>
  </div>`;
}
function patchHTML(){
  const items=[
    "Floating Panel — schließt sich NICHT mehr beim Klicken auf Buttons",
    "8 APIs gleichzeitig: allianceinfo, userinfo, vehicle_states, buildings, alliance_schoolings, v2/vehicles, v1/vehicle_distances, v1/aaos",
    "Neu: Kilometer-Tab mit Gesamtkilometern & 30-Tage-Wert pro Fahrzeug",
    "Neu: AAO-Tab mit allen automatischen Alarmstichworten und Hotkeys",
    "Donut-Chart für Fahrzeugstatus mit %-Anzeige in Legende",
    "Quick-Stats-Strip mit Spielzeit, Credits, Tagesverdienst, Uhr",
    "Kreditverlauf-Tabelle mit Zeitstempel und Differenz-Spalte",
    "Canvas-Liniendiagramm mit Bezier-Kurven und Gradient-Fill",
    "Fortschrittsbalken für Mitgliederkapazität",
    "Alle Werte mit Flash-Animation bei Aktualisierung",
    "GM_setValue/getValue für robuste Persistenz",
    "Lazy-Loading: Tabs laden erst bei Bedarf",
    "stopPropagation() auf allen Panel-Events",
  ];
  return `<div style="color:var(--blue);font-weight:700;font-size:11px;margin-bottom:10px">
    v7.0.0 — 8-API Ultimate Dashboard</div>
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

// ╔══════════════════════════════════════════════════════════════╗
// ║  NAV TRIGGER                                                 ║
// ╚══════════════════════════════════════════════════════════════╝
function buildTrigger(){
  const li=$(`<li></li>`);
  const a=$(`
    <a href="#" id="lss7-btn">
      <img src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="LSS">
      <span class="lss7-nav-lbl">Verband</span>
      <div id="lss7-live"></div>
      <span class="lss7-nav-arr">▼</span>
    </a>`);
  a.on("click",function(e){ e.preventDefault();e.stopPropagation();togglePanel(); });
  li.append(a);

  const nb=$("#navbar-main-collapse .navbar-nav");
  if(nb.length)nb.append(li);
  else console.error("[LSS7] Navbar nicht gefunden.");
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  PANEL TOGGLE                                                ║
// ╚══════════════════════════════════════════════════════════════╝
let panelOpen=false;
function togglePanel(force){
  panelOpen = force!==undefined ? !!force : !panelOpen;
  $("#lss7").toggleClass("open",panelOpen);
  $("#lss7-btn").toggleClass("open",panelOpen);
  if(panelOpen) setTimeout(drawChart,80);
}

// Außerhalb klicken → schließen
$(document).on("click.lss7",function(e){
  if(panelOpen && !$(e.target).closest("#lss7,#lss7-btn").length){
    togglePanel(false);
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  UPDATE CHECK                                                ║
// ╚══════════════════════════════════════════════════════════════╝
function checkUpdate(){
  GM_xmlhttpRequest({
    method:"GET",url:UPDATE_URL,
    onload(r){
      if(r.status!==200)return;
      const m=r.responseText.match(/@version\s+([\d.]+)/);
      if(m&&m[1]!==V)showUpdate(m[1]);
    }
  });
}
function showUpdate(nv){
  const o=$(`
    <div id="lss7-uo">
      <div id="lss7-ub">
        <div class="ub-icon">🚀</div>
        <h2>Update verfügbar</h2>
        <p>Version <strong>${nv}</strong> ist bereit.<br>Du nutzt aktuell v${V}.</p>
        <div class="ub-row">
          <button class="ub-btn ub-sk" id="ub-skip">Später</button>
          <a class="ub-btn ub-ok" href="${UPDATE_URL}" target="_blank">Jetzt aktualisieren</a>
        </div>
      </div>
    </div>`);
  $("body").append(o);
  o.on("click","#ub-skip",()=>o.remove());
  o.on("click",e=>{if($(e.target).is(o))o.remove();});
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  INIT                                                        ║
// ╚══════════════════════════════════════════════════════════════╝
$(document).ready(()=>{
  load();
  buildUI();
  buildTrigger();

  // Initialer Fetch
  fetchAlliance();
  fetchUserinfo();

  // Intervals
  setInterval(tickTimer,          ITV.timer);
  setInterval(tickClock,          ITV.clock);
  setInterval(checkMidnight,      ITV.midnight);
  setInterval(fetchAlliance,      ITV.alliance);
  setInterval(fetchUserinfo,      ITV.userinfo);
  setInterval(fetchVehicleStates, ITV.vstates);
  setInterval(fetchBuildings,     ITV.buildings);
  setInterval(fetchSchoolings,    ITV.schools);
  setInterval(updateFooter,       ITV.footer);

  // Daily-Earnings quick-stat sync
  setInterval(()=>setV("#qs-daily",fmtMoney(S.dailyEarn)), 5000);

  checkUpdate();
});

window.addEventListener("beforeunload", save);

})();
