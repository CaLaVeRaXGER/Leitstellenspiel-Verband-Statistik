// ==UserScript==
// @name         Leitstellenspiel Verband Statistik Pro
// @namespace    http://tampermonkey.net/
// @version      5.0.1
// @description  Professionelles Dashboard für den Verband: Live-Statistiken, Fahrzeugstatus, Kreditverlauf, Spielzeit-Tracking, Team-Übersicht und mehr. Nutzt mehrere LSS-APIs gleichzeitig.
// @author       Fabian (Capt.BobbyNash)
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @updateURL    https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// @downloadURL  https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js
// ==/UserScript==

(function () {
    "use strict";

    // ═══════════════════════════════════════════════════════════════════════════
    //  KONSTANTEN
    // ═══════════════════════════════════════════════════════════════════════════
    const VERSION        = "5.0.0";
    const UPDATE_URL = "https://raw.githubusercontent.com/CaLaVeRaXGER/Leitstellenspiel-Verband-Statistik/main/Leitstellenspiel%20Verband%20Statistik%20Close%20BETA-1.03CloseBETA.user.js";
    const BASE           = "https://www.leitstellenspiel.de";

    const API = {
        alliance:       `${BASE}/api/allianceinfo`,
        userinfo:       `${BASE}/api/userinfo`,
        vehicleStates:  `${BASE}/api/vehicle_states`,
        schoolings:     `${BASE}/api/alliance_schoolings`,
    };

    const INTERVAL = {
        fast:   5_000,    // Uhrzeit / Timer
        normal: 60_000,   // Hauptdaten
        slow:   300_000,  // Schulungen / Team
        mid:    120_000,  // Fahrzeugstatus
    };

    const VEHICLE_STATUS_LABELS = {
        1: { label: "Einsatzbereit (Wache)",   color: "#10b981" },
        2: { label: "Einsatzbereit (Funk)",     color: "#34d399" },
        3: { label: "Im Einsatz",               color: "#f59e0b" },
        4: { label: "Einsatz übernommen",       color: "#fb923c" },
        5: { label: "Sprechwunsch",             color: "#ef4444" },
        6: { label: "Nicht einsatzbereit",      color: "#6b7280" },
        7: { label: "Rettungsdienst Bereit",    color: "#60a5fa" },
        9: { label: "Sonderfahrt",              color: "#a78bfa" },
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  STYLES
    // ═══════════════════════════════════════════════════════════════════════════
    GM_addStyle(`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');

        /* ── CSS Custom Properties ───────────────────────────────────────── */
        #lss-pro-root {
            --bg0:       #0d1117;
            --bg1:       #161b22;
            --bg2:       #1c2128;
            --bg3:       #21262d;
            --bg-hover:  #2d333b;
            --border:    rgba(240,246,252,0.10);
            --border2:   rgba(240,246,252,0.16);
            --blue:      #388bfd;
            --blue-dim:  rgba(56,139,253,0.15);
            --green:     #3fb950;
            --green-dim: rgba(63,185,80,0.12);
            --amber:     #d29922;
            --red:       #f85149;
            --purple:    #bc8cff;
            --cyan:      #79c0ff;
            --muted:     #8b949e;
            --text:      #e6edf3;
            --text2:     #c9d1d9;
            --r:         8px;
            --r-sm:      5px;
            --font:      'Inter', system-ui, sans-serif;
            --mono:      'JetBrains Mono', monospace;
        }

        /* ── Dropdown Wrapper ───────────────────────────────────────────── */
        #lss-pro-root {
            min-width: 420px;
            max-width: 460px;
            background: var(--bg0);
            border: 1px solid var(--border2);
            border-radius: 12px;
            box-shadow:
                0 0 0 1px rgba(255,255,255,0.03) inset,
                0 24px 72px rgba(0,0,0,0.8),
                0 8px 24px rgba(0,0,0,0.5);
            color: var(--text);
            font-family: var(--font);
            overflow: hidden;
            margin-top: 8px;
        }

        /* ── Header ─────────────────────────────────────────────────────── */
        #lss-header {
            background: linear-gradient(160deg, #0f2744 0%, #0d1117 60%);
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-bottom: 1px solid var(--border);
            position: relative;
            overflow: hidden;
        }
        #lss-header::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(ellipse at 80% 50%, rgba(56,139,253,0.08) 0%, transparent 70%);
            pointer-events: none;
        }
        #lss-logo-ring {
            width: 34px; height: 34px;
            border-radius: 9px;
            background: var(--blue-dim);
            border: 1px solid rgba(56,139,253,0.4);
            display: flex; align-items: center; justify-content: center;
            font-size: 17px; flex-shrink: 0;
        }
        .lss-htitle { font-size: 13px; font-weight: 700; color: var(--text); line-height: 1.2; }
        .lss-hsub   { font-size: 10px; color: var(--muted); margin-top: 1px; }
        #lss-badge-wrap { margin-left: auto; display: flex; align-items: center; gap: 6px; }
        .lss-badge {
            font-size: 10px; font-weight: 700; padding: 2px 8px;
            border-radius: 20px; letter-spacing: 0.5px; white-space: nowrap;
        }
        .lss-badge-blue   { color: var(--blue);  background: var(--blue-dim);  border: 1px solid rgba(56,139,253,0.3); }
        .lss-badge-green  { color: var(--green); background: var(--green-dim); border: 1px solid rgba(63,185,80,0.3); }
        .lss-badge-amber  { color: var(--amber); background: rgba(210,153,34,0.12); border: 1px solid rgba(210,153,34,0.3); }
        #lss-live-dot {
            width: 7px; height: 7px; border-radius: 50%;
            background: var(--green);
            box-shadow: 0 0 6px var(--green);
            animation: lss-pulse 2s ease-in-out infinite;
        }
        @keyframes lss-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(0.7)} }

        /* ── Ticker-Bar (Zeit + persönliche Credits) ───────────────────── */
        #lss-ticker {
            display: grid;
            grid-template-columns: 1fr 1px 1fr 1px 1fr;
            background: var(--bg1);
            border-bottom: 1px solid var(--border);
        }
        #lss-ticker-sep { background: var(--border); }
        .lss-ticker-cell {
            padding: 9px 12px;
            display: flex; flex-direction: column; gap: 2px;
        }
        .lss-ticker-lbl {
            font-size: 9px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px;
            color: var(--muted);
        }
        .lss-ticker-val {
            font-size: 13px; font-weight: 600; color: var(--text);
        }
        #lss-playtime-val {
            font-family: var(--mono);
            font-size: 13px; font-weight: 600;
            color: var(--green); letter-spacing: 1.5px;
        }
        #lss-datetime-val {
            font-size: 11px; font-weight: 500;
            color: var(--text2); letter-spacing: 0.2px;
        }

        /* ── Tabs ────────────────────────────────────────────────────────── */
        #lss-tabs {
            display: flex;
            background: var(--bg1);
            border-bottom: 1px solid var(--border);
            overflow-x: auto;
            scrollbar-width: none;
        }
        #lss-tabs::-webkit-scrollbar { display: none; }
        .lss-tab {
            flex-shrink: 0;
            padding: 9px 14px;
            font-size: 11px; font-weight: 600;
            color: var(--muted);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.15s;
            display: flex; align-items: center; gap: 5px;
            white-space: nowrap;
            user-select: none;
        }
        .lss-tab:hover { color: var(--text2); }
        .lss-tab.active {
            color: var(--blue);
            border-bottom-color: var(--blue);
        }
        .lss-tab-icon { font-size: 12px; }

        /* ── Tab-Panels ──────────────────────────────────────────────────── */
        .lss-panel { display: none; }
        .lss-panel.active { display: block; }

        /* ── Stat-Grid ───────────────────────────────────────────────────── */
        .lss-grid-2 {
            display: grid; grid-template-columns: 1fr 1fr;
            gap: 1px; background: var(--border);
        }
        .lss-grid-3 {
            display: grid; grid-template-columns: 1fr 1fr 1fr;
            gap: 1px; background: var(--border);
        }
        .lss-cell {
            background: var(--bg0);
            padding: 11px 13px;
            display: flex; flex-direction: column; gap: 3px;
            transition: background 0.12s;
        }
        .lss-cell:hover { background: var(--bg-hover); }
        .lss-cell.span2 { grid-column: span 2; }
        .lss-cell.span3 { grid-column: span 3; }
        .lss-cell-lbl {
            font-size: 9px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1px; color: var(--muted);
        }
        .lss-cell-val {
            font-size: 16px; font-weight: 700;
            color: var(--text); letter-spacing: -0.3px;
        }
        .lss-cell-sub {
            font-size: 10px; color: var(--muted); margin-top: 1px;
        }
        .c-green   { color: var(--green)  !important; }
        .c-blue    { color: var(--blue)   !important; }
        .c-amber   { color: var(--amber)  !important; }
        .c-red     { color: var(--red)    !important; }
        .c-purple  { color: var(--purple) !important; }
        .c-cyan    { color: var(--cyan)   !important; }
        .c-muted   { color: var(--muted)  !important; }
        .lss-cell-val a { color: var(--blue); text-decoration: none; }
        .lss-cell-val a:hover { text-decoration: underline; }

        /* ── Kreditverlauf Mini-Chart ─────────────────────────────────────── */
        #lss-credit-chart-wrap {
            padding: 12px 14px 10px;
            border-bottom: 1px solid var(--border);
        }
        #lss-chart-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 8px;
        }
        #lss-chart-title {
            font-size: 11px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted);
        }
        #lss-chart-meta {
            font-size: 10px; color: var(--muted);
        }
        #lss-credit-chart {
            width: 100%; height: 52px; display: block;
        }

        /* ── Fahrzeugstatus Bars ─────────────────────────────────────────── */
        #lss-vehicle-panel {
            padding: 12px 14px;
        }
        .lss-vstate-row {
            display: flex; align-items: center; gap: 8px;
            margin-bottom: 7px;
        }
        .lss-vstate-dot {
            width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }
        .lss-vstate-label { font-size: 11px; color: var(--text2); min-width: 160px; }
        .lss-vstate-bar-wrap {
            flex: 1; height: 5px; border-radius: 3px;
            background: rgba(255,255,255,0.06); overflow: hidden;
        }
        .lss-vstate-bar {
            height: 100%; border-radius: 3px;
            transition: width 0.5s ease;
        }
        .lss-vstate-count {
            font-family: var(--mono); font-size: 11px; font-weight: 600;
            color: var(--text2); min-width: 30px; text-align: right;
        }
        .lss-total-row {
            display: flex; justify-content: space-between; align-items: center;
            margin-top: 10px; padding-top: 8px;
            border-top: 1px solid var(--border);
            font-size: 11px; color: var(--muted);
        }
        .lss-total-val {
            font-family: var(--mono); font-weight: 700; font-size: 13px; color: var(--text);
        }

        /* ── Schulungen ──────────────────────────────────────────────────── */
        #lss-school-list { padding: 4px 0; }
        .lss-school-item {
            display: flex; align-items: center; gap: 10px;
            padding: 8px 14px;
            border-bottom: 1px solid var(--border);
            font-size: 12px;
            transition: background 0.12s;
        }
        .lss-school-item:last-child { border-bottom: none; }
        .lss-school-item:hover { background: var(--bg-hover); }
        .lss-school-icon { font-size: 14px; flex-shrink: 0; }
        .lss-school-name { flex: 1; color: var(--text2); font-weight: 500; }
        .lss-school-count {
            font-family: var(--mono); font-size: 11px; font-weight: 700;
            color: var(--cyan);
            background: rgba(121,192,255,0.1);
            border: 1px solid rgba(121,192,255,0.2);
            border-radius: 4px; padding: 1px 7px;
        }
        .lss-empty {
            padding: 20px; text-align: center;
            font-size: 12px; color: var(--muted);
        }

        /* ── Team ────────────────────────────────────────────────────────── */
        #lss-team-panel { padding: 0; }
        .lss-team-section { padding: 6px 0; }
        .lss-team-section-title {
            font-size: 9px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 1.2px;
            color: var(--muted); padding: 0 14px 4px;
        }
        .lss-member {
            display: flex; align-items: center; gap: 8px;
            padding: 5px 14px;
            transition: background 0.12s;
        }
        .lss-member:hover { background: var(--bg-hover); }
        .lss-member-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .lss-member-link {
            font-size: 12px; font-weight: 500;
            color: var(--text2); text-decoration: none;
        }
        .lss-member-link:hover { color: var(--text); }
        .lss-member-badge {
            margin-left: auto; font-size: 9px; font-weight: 700;
            padding: 1px 6px; border-radius: 4px; letter-spacing: 0.5px;
        }

        /* ── Einstellungen ───────────────────────────────────────────────── */
        #lss-settings-panel { padding: 14px; display: flex; flex-direction: column; gap: 8px; }
        .lss-setting-group { display: flex; flex-direction: column; gap: 4px; }
        .lss-setting-label {
            font-size: 10px; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.8px; color: var(--muted);
            margin-bottom: 2px;
        }
        .lss-btn {
            display: flex; align-items: center; gap: 8px;
            padding: 9px 12px;
            font-size: 12px; font-weight: 600; font-family: var(--font);
            color: var(--text2);
            background: rgba(255,255,255,0.04);
            border: 1px solid var(--border);
            border-radius: var(--r-sm);
            cursor: pointer; transition: all 0.15s; text-align: left;
        }
        .lss-btn:hover {
            background: rgba(255,255,255,0.08); color: var(--text);
            border-color: var(--border2);
        }
        .lss-btn.danger:hover {
            background: rgba(248,81,73,0.1); color: var(--red);
            border-color: rgba(248,81,73,0.3);
        }
        .lss-btn-icon { font-size: 13px; }

        /* ── Akkordeon Info/Patch ─────────────────────────────────────────── */
        .lss-accordion { border-top: 1px solid var(--border); }
        .lss-acc-head {
            display: flex; align-items: center; gap: 8px;
            padding: 10px 14px;
            cursor: pointer; font-size: 11px; font-weight: 600;
            color: var(--muted); transition: all 0.15s; user-select: none;
        }
        .lss-acc-head:hover { background: var(--bg-hover); color: var(--text2); }
        .lss-acc-chevron { margin-left: auto; font-size: 9px; transition: transform 0.2s; }
        .lss-accordion.open .lss-acc-chevron { transform: rotate(180deg); }
        .lss-acc-body { display: none; background: var(--bg1); border-top: 1px solid var(--border); }
        .lss-accordion.open .lss-acc-body { display: block; }
        .lss-acc-content {
            padding: 12px 14px;
            font-size: 11px; color: var(--text2); line-height: 1.8;
        }
        .lss-info-row {
            display: flex; justify-content: space-between;
            padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
            font-size: 11px;
        }
        .lss-info-row:last-child { border-bottom: none; }
        .lss-info-key { color: var(--muted); }
        .lss-info-val { color: var(--text2); font-weight: 500; }
        .lss-patch-entry {
            display: flex; gap: 8px; margin-bottom: 5px; font-size: 11px;
        }
        .lss-patch-bullet { color: var(--blue); flex-shrink: 0; }

        /* ── Update Popup ────────────────────────────────────────────────── */
        #lss-overlay {
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.75);
            backdrop-filter: blur(6px);
            z-index: 99999;
            display: flex; align-items: center; justify-content: center;
        }
        #lss-popup {
            background: var(--bg1);
            border: 1px solid var(--border2);
            border-radius: 14px;
            padding: 28px 24px;
            width: 320px;
            text-align: center;
            box-shadow: 0 32px 80px rgba(0,0,0,0.8);
            font-family: var(--font);
            color: var(--text);
            animation: lss-popin 0.22s cubic-bezier(.34,1.56,.64,1) both;
        }
        @keyframes lss-popin {
            from { opacity:0; transform: scale(0.88) translateY(-8px); }
        }
        #lss-popup .p-icon  { font-size: 40px; margin-bottom: 14px; }
        #lss-popup h2       { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
        #lss-popup p        { font-size: 13px; color: var(--muted); line-height: 1.6; margin: 0 0 20px; }
        .lss-popup-row      { display: flex; gap: 8px; }
        .lss-popup-btn {
            flex: 1; padding: 10px 0; font-size: 12px; font-weight: 700;
            border-radius: var(--r-sm); border: none; cursor: pointer;
            font-family: var(--font); transition: all 0.15s; text-decoration: none;
            display: block;
        }
        .lss-popup-btn.primary { background: var(--blue); color: #fff; }
        .lss-popup-btn.primary:hover { background: #58a6ff; }
        .lss-popup-btn.ghost {
            background: rgba(255,255,255,0.06); color: var(--text2);
            border: 1px solid var(--border);
        }
        .lss-popup-btn.ghost:hover { background: rgba(255,255,255,0.1); color: var(--text); }

        /* ── Nav-Trigger ─────────────────────────────────────────────────── */
        #lss-nav-btn {
            display: flex !important;
            align-items: center; gap: 5px;
            padding: 5px 10px;
            border-radius: 6px;
            transition: background 0.15s;
        }
        #lss-nav-btn:hover { background: rgba(255,255,255,0.07) !important; }
        #lss-nav-btn img   { height: 17px; width: auto; vertical-align: middle; }
        .lss-nav-label { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.8); }
        .lss-nav-arrow { font-size: 8px; color: rgba(255,255,255,0.4); transition: transform 0.2s; }
        .open > #lss-nav-btn .lss-nav-arrow { transform: rotate(180deg); }

        /* ── Flash-Animation ─────────────────────────────────────────────── */
        @keyframes lss-flash { from { opacity:.3; } to { opacity:1; } }
        .lss-flash { animation: lss-flash 0.35s ease-out; }

        /* ── Divider ─────────────────────────────────────────────────────── */
        .lss-divider { height: 1px; background: var(--border); }

        /* ── Loading Spinner ─────────────────────────────────────────────── */
        .lss-spinner {
            display: inline-block; width: 12px; height: 12px;
            border: 2px solid rgba(255,255,255,0.1);
            border-top-color: var(--blue);
            border-radius: 50%;
            animation: lss-spin 0.7s linear infinite;
            vertical-align: middle; margin-right: 4px;
        }
        @keyframes lss-spin { to { transform: rotate(360deg); } }

        /* ── Footer-Credits ──────────────────────────────────────────────── */
        #lss-footer {
            padding: 8px 14px;
            background: var(--bg1);
            border-top: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
        }
        #lss-footer-left { font-size: 10px; color: var(--muted); }
        #lss-footer-right { font-size: 10px; color: var(--muted); }
        #lss-last-update { color: var(--muted); }
    `);

    // ═══════════════════════════════════════════════════════════════════════════
    //  STATE
    // ═══════════════════════════════════════════════════════════════════════════
    const state = {
        playtime:        0,
        lastTimestamp:   Date.now(),
        lastCreditsTotal: 0,
        dailyEarnings:   0,
        lastDate:        todayStr(),
        creditHistory:   [],   // [{ts, value}] letzte 24 Einträge (alle 5 Min)
        lastApiUpdate:   null,
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  PERSISTENCE
    // ═══════════════════════════════════════════════════════════════════════════
    function save() {
        const today = todayStr();
        GM_setValue("playtime",        state.playtime);
        GM_setValue("lastTimestamp",   state.lastTimestamp);
        GM_setValue("lastCredits",     state.lastCreditsTotal);
        GM_setValue("dailyEarnings",   state.dailyEarnings);
        GM_setValue("lastDate",        today);
        GM_setValue("creditHistory",   JSON.stringify(state.creditHistory));
    }

    function load() {
        const today   = todayStr();
        const saved   = GM_getValue("lastDate", today);
        const newDay  = saved !== today;

        state.playtime         = newDay ? 0 : (GM_getValue("playtime",      0));
        state.lastCreditsTotal = newDay ? 0 : (GM_getValue("lastCredits",   0));
        state.dailyEarnings    = newDay ? 0 : (GM_getValue("dailyEarnings", 0));
        state.lastTimestamp    = GM_getValue("lastTimestamp", Date.now());
        state.lastDate         = today;

        try {
            state.creditHistory = JSON.parse(GM_getValue("creditHistory", "[]")) || [];
        } catch { state.creditHistory = []; }

        if (newDay) save();
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  UTILITIES
    // ═══════════════════════════════════════════════════════════════════════════
    function todayStr() {
        return new Date().toISOString().split("T")[0];
    }

    function fmt(n, unit = "") {
        if (typeof n !== "number") return n;
        return n.toLocaleString("de-DE") + (unit ? " " + unit : "");
    }

    function fmtTime(s) {
        const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
        return [h, m, sec].map(x => String(x).padStart(2, "0")).join(":");
    }

    function fmtClock() {
        return new Date().toLocaleString("de-DE", {
            weekday: "short", day: "2-digit", month: "2-digit",
            year: "numeric",  hour: "2-digit", minute: "2-digit", second: "2-digit",
        }).replace(",", "");
    }

    function timeAgo(ts) {
        if (!ts) return "—";
        const d = Math.round((Date.now() - ts) / 1000);
        if (d < 60)   return `vor ${d}s`;
        if (d < 3600) return `vor ${Math.floor(d/60)}m`;
        return `vor ${Math.floor(d/3600)}h`;
    }

    function flash(selector) {
        const el = $(selector);
        el.removeClass("lss-flash");
        void el[0]?.offsetWidth; // reflow
        el.addClass("lss-flash");
    }

    function setVal(selector, value, doFlash = true) {
        const el = $(selector);
        if (el.text() !== String(value)) {
            el.text(value);
            if (doFlash) flash(selector);
        }
    }

    function apiGet(url, cb, errCb) {
        GM_xmlhttpRequest({
            method: "GET", url,
            onload(r) {
                if (r.status === 200) {
                    try { cb(JSON.parse(r.responseText)); }
                    catch (e) { console.error("[LSS-Pro] JSON parse error:", e); }
                } else {
                    errCb && errCb(r.status);
                }
            },
            onerror() { errCb && errCb(-1); },
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  TIMER / CLOCK
    // ═══════════════════════════════════════════════════════════════════════════
    function tickTimer() {
        const now = Date.now();
        const el  = Math.floor((now - state.lastTimestamp) / 1000);
        if (el > 0) {
            state.playtime    += el;
            state.lastTimestamp = now;
            $("#lss-playtime-val").text(fmtTime(state.playtime));
            save();
        }
    }

    function tickClock() {
        $("#lss-datetime-val").text(fmtClock());
    }

    function checkMidnight() {
        if (todayStr() !== state.lastDate) {
            state.playtime = 0; state.dailyEarnings = 0;
            state.lastCreditsTotal = 0; state.lastDate = todayStr();
            save();
            $("#lss-playtime-val").text(fmtTime(0));
            setVal("#lss-daily-val", fmt(0));
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  KREDITVERLAUF
    // ═══════════════════════════════════════════════════════════════════════════
    function pushCreditHistory(value) {
        const now = Date.now();
        const h   = state.creditHistory;
        // Nur alle ~5 Minuten einen neuen Punkt
        if (h.length === 0 || now - h[h.length - 1].ts > 290_000) {
            h.push({ ts: now, value });
            if (h.length > 24) h.shift(); // max 24 Punkte (~2h)
            save();
            drawCreditChart();
        }
    }

    function drawCreditChart() {
        const canvas = document.getElementById("lss-credit-chart");
        if (!canvas) return;
        const h = state.creditHistory;
        if (h.length < 2) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }

        const W = canvas.offsetWidth || 392;
        const H = 52;
        canvas.width  = W;
        canvas.height = H;

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, W, H);

        const values = h.map(p => p.value);
        const min    = Math.min(...values);
        const max    = Math.max(...values);
        const range  = max - min || 1;

        const pad = { l: 4, r: 4, t: 4, b: 4 };
        const cw  = W - pad.l - pad.r;
        const ch  = H - pad.t - pad.b;

        const pts = h.map((p, i) => ({
            x: pad.l + (i / (h.length - 1)) * cw,
            y: pad.t + (1 - (p.value - min) / range) * ch,
        }));

        // Gradient fill
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "rgba(56,139,253,0.25)");
        grad.addColorStop(1, "rgba(56,139,253,0)");
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const cx = (pts[i - 1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
        }
        ctx.lineTo(pts[pts.length - 1].x, H);
        ctx.lineTo(pts[0].x, H);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();

        // Line
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
            const cx = (pts[i - 1].x + pts[i].x) / 2;
            ctx.bezierCurveTo(cx, pts[i - 1].y, cx, pts[i].y, pts[i].x, pts[i].y);
        }
        ctx.strokeStyle = "#388bfd";
        ctx.lineWidth   = 1.5;
        ctx.stroke();

        // Last dot
        const last = pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
        ctx.fillStyle   = "#58a6ff";
        ctx.fill();

        // Update meta
        const diff = h.length >= 2 ? h[h.length - 1].value - h[h.length - 2].value : 0;
        const sign = diff > 0 ? "+" : "";
        const color = diff >= 0 ? "#3fb950" : "#f85149";
        $("#lss-chart-meta").html(
            `<span style="color:${color};font-weight:700">${sign}${fmt(diff)}</span>&nbsp;letzte Änderung`
        );
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  API-CALLS
    // ═══════════════════════════════════════════════════════════════════════════
    function fetchAll() {
        fetchAlliance();
        fetchUserInfo();
    }

    function fetchAlliance() {
        apiGet(API.alliance, data => {
            state.lastApiUpdate = Date.now();
            updateDailyEarnings(data.credits_total || 0);
            pushCreditHistory(data.credits_total || 0);
            renderAllianceTab(data);
            renderTeam(data.users || []);
            $("#lss-last-update").text(timeAgo(state.lastApiUpdate));
        });
    }

    function fetchUserInfo() {
        apiGet(API.userinfo, data => {
            const credits = data.credits || 0;
            const coins   = data.coins   || 0;
            setVal("#lss-user-credits", fmt(credits));
            setVal("#lss-user-coins",   fmt(coins));
        });
    }

    function fetchVehicleStates() {
        apiGet(API.vehicleStates, data => {
            renderVehicleStates(data);
        });
    }

    function fetchSchoolings() {
        apiGet(API.schoolings, data => {
            renderSchoolings(Array.isArray(data) ? data : []);
        });
    }

    function updateDailyEarnings(current) {
        if (state.lastCreditsTotal > 0 && current > state.lastCreditsTotal) {
            state.dailyEarnings += current - state.lastCreditsTotal;
        }
        state.lastCreditsTotal = current;
        save();
        setVal("#lss-daily-val", fmt(state.dailyEarnings));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  RENDER — Verband-Tab
    // ═══════════════════════════════════════════════════════════════════════════
    function renderAllianceTab(d) {
        const id   = d.id            || "#";
        const name = d.name          || "Unbekannt";
        const link = `<a href="${BASE}/alliances/${id}" target="_blank">${name}</a>`;

        if (!$("#lss-pro-root").length) {
            buildSkeleton(d);
            return;
        }

        $("#lss-val-alliance").html(link);
        setVal("#lss-val-total",   fmt(d.credits_total   || 0));
        setVal("#lss-val-kasse",   fmt(d.credits_current || 0));
        setVal("#lss-val-members", d.user_count || 0);
        setVal("#lss-val-rank",    d.rank       || "—");
        setVal("#lss-daily-val",   fmt(state.dailyEarnings));
        $("#lss-last-update").text(timeAgo(state.lastApiUpdate));
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  RENDER — Fahrzeugstatus
    // ═══════════════════════════════════════════════════════════════════════════
    function renderVehicleStates(data) {
        const container = $("#lss-vehicle-panel");
        if (!container.length) return;
        container.empty();

        const total = Object.values(data).reduce((s, v) => s + (v || 0), 0);
        if (total === 0) {
            container.html(`<div class="lss-empty">Keine Fahrzeugdaten verfügbar.</div>`);
            return;
        }

        const statusKeys = Object.keys(VEHICLE_STATUS_LABELS).map(Number);
        statusKeys.forEach(key => {
            const count = data[key] || 0;
            if (count === 0) return;
            const { label, color } = VEHICLE_STATUS_LABELS[key];
            const pct = Math.round((count / total) * 100);
            container.append(`
                <div class="lss-vstate-row">
                    <div class="lss-vstate-dot" style="background:${color}"></div>
                    <span class="lss-vstate-label">${label}</span>
                    <div class="lss-vstate-bar-wrap">
                        <div class="lss-vstate-bar" style="width:${pct}%;background:${color}"></div>
                    </div>
                    <span class="lss-vstate-count">${count}</span>
                </div>
            `);
        });

        // Nicht in der Liste
        const knownKeys = statusKeys;
        Object.keys(data).forEach(k => {
            if (!knownKeys.includes(Number(k)) && data[k] > 0) {
                container.append(`
                    <div class="lss-vstate-row">
                        <div class="lss-vstate-dot" style="background:var(--muted)"></div>
                        <span class="lss-vstate-label">Status ${k}</span>
                        <div class="lss-vstate-bar-wrap">
                            <div class="lss-vstate-bar" style="width:${Math.round(data[k]/total*100)}%;background:var(--muted)"></div>
                        </div>
                        <span class="lss-vstate-count">${data[k]}</span>
                    </div>
                `);
            }
        });

        container.append(`
            <div class="lss-total-row">
                <span>Fahrzeuge gesamt</span>
                <span class="lss-total-val">${total}</span>
            </div>
        `);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  RENDER — Schulungen
    // ═══════════════════════════════════════════════════════════════════════════
    function renderSchoolings(list) {
        const container = $("#lss-school-list");
        if (!container.length) return;
        container.empty();

        const running = list.filter(s => !s.dismissed);
        if (!running.length) {
            container.html(`<div class="lss-empty">Keine laufenden Schulungen.</div>`);
            return;
        }

        // Gruppieren nach Typ
        const groups = {};
        running.forEach(s => {
            const key = s.caption || "Unbekannte Schulung";
            groups[key] = (groups[key] || 0) + 1;
        });

        Object.entries(groups)
            .sort((a, b) => b[1] - a[1])
            .forEach(([name, count]) => {
                container.append(`
                    <div class="lss-school-item">
                        <span class="lss-school-icon">🎓</span>
                        <span class="lss-school-name">${name}</span>
                        <span class="lss-school-count">${count}×</span>
                    </div>
                `);
            });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  RENDER — Team
    // ═══════════════════════════════════════════════════════════════════════════
    function renderTeam(users) {
        const panel = $("#lss-team-panel");
        if (!panel.length) return;
        panel.empty();

        const roles = [
            { filter: u => u.role_flags?.owner,   label: "Eigentümer",  dot: "#d29922", badge: "Owner",    badgeBg: "rgba(210,153,34,0.12)", badgeColor: "#d29922"   },
            { filter: u => u.role_flags?.admin,   label: "Admins",      dot: "#388bfd", badge: "Admin",    badgeBg: "rgba(56,139,253,0.12)", badgeColor: "#388bfd"   },
            { filter: u => u.role_flags?.coadmin, label: "Co-Admins",   dot: "#3fb950", badge: "Co-Admin", badgeBg: "rgba(63,185,80,0.12)",  badgeColor: "#3fb950"   },
        ];

        roles.forEach(({ filter, label, dot, badge, badgeBg, badgeColor }) => {
            const members = users.filter(filter);
            if (!members.length) return;
            const sec = $(`<div class="lss-team-section"><div class="lss-team-section-title">${label}</div></div>`);
            members.forEach(u => {
                sec.append(`
                    <div class="lss-member">
                        <div class="lss-member-dot" style="background:${dot}"></div>
                        <a class="lss-member-link" href="${BASE}/profile/${u.id}" target="_blank">${u.name}</a>
                        <span class="lss-member-badge"
                              style="background:${badgeBg};color:${badgeColor};border:1px solid ${badgeColor}33">
                            ${badge}
                        </span>
                    </div>
                `);
            });
            panel.append(sec);
        });

        // Restliche Mitglieder
        const shown  = new Set(roles.flatMap(r => users.filter(r.filter).map(u => u.id)));
        const others = users.filter(u => !shown.has(u.id));
        if (others.length) {
            const count = others.length;
            const sec = $(`<div class="lss-team-section"><div class="lss-team-section-title">Weitere Mitglieder (${count})</div></div>`);
            others.slice(0, 20).forEach(u => {
                sec.append(`
                    <div class="lss-member">
                        <div class="lss-member-dot" style="background:var(--muted)"></div>
                        <a class="lss-member-link" href="${BASE}/profile/${u.id}" target="_blank">${u.name}</a>
                    </div>
                `);
            });
            if (count > 20) {
                sec.append(`<div class="lss-empty" style="padding:6px 14px">... und ${count - 20} weitere</div>`);
            }
            panel.append(sec);
        }

        if (!panel.children().length) {
            panel.html(`<div class="lss-empty">Keine Team-Daten verfügbar.</div>`);
        }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  BUILD — Haupt-Skeleton
    // ═══════════════════════════════════════════════════════════════════════════
    function buildSkeleton(data) {
        const id   = data.id   || "#";
        const name = data.name || "Unbekannt";
        const link = `<a href="${BASE}/alliances/${id}" target="_blank">${name}</a>`;

        const navEntry = $('<li class="dropdown"></li>');
        const trigger  = $(`
            <a href="#" id="lss-nav-btn" class="dropdown-toggle"
               data-toggle="dropdown" role="button" aria-expanded="false">
                <img src="https://i.postimg.cc/hjsm7tQV/LSSS-Logo-fertig.png" alt="LSS">
                <span class="lss-nav-label">Verband</span>
                <span class="lss-nav-arrow">▼</span>
            </a>
        `);

        const root = $(`<ul id="lss-pro-root" class="dropdown-menu" role="menu"></ul>`);

        // ── Header
        root.append(`
            <li>
                <div id="lss-header">
                    <div id="lss-logo-ring">🏛</div>
                    <div>
                        <div class="lss-htitle">Verband Statistik Pro</div>
                        <div class="lss-hsub">Leitstellenspiel Dashboard</div>
                    </div>
                    <div id="lss-badge-wrap">
                        <div id="lss-live-dot" title="Live"></div>
                        <span class="lss-badge lss-badge-blue">v${VERSION}</span>
                    </div>
                </div>
            </li>
        `);

        // ── Ticker-Bar
        root.append(`
            <li>
                <div id="lss-ticker">
                    <div class="lss-ticker-cell">
                        <span class="lss-ticker-lbl">Spielzeit</span>
                        <span id="lss-playtime-val">${fmtTime(state.playtime)}</span>
                    </div>
                    <div id="lss-ticker-sep"></div>
                    <div class="lss-ticker-cell">
                        <span class="lss-ticker-lbl">Meine Credits</span>
                        <span class="lss-ticker-val c-green" id="lss-user-credits">
                            <span class="lss-spinner"></span>
                        </span>
                    </div>
                    <div id="lss-ticker-sep2" style="background:var(--border);"></div>
                    <div class="lss-ticker-cell" style="min-width:0">
                        <span class="lss-ticker-lbl">Datum / Uhrzeit</span>
                        <span id="lss-datetime-val">${fmtClock()}</span>
                    </div>
                </div>
            </li>
        `);

        // ── Tabs
        const tabs = [
            { id: "tab-alliance",  icon: "📊", label: "Verband"      },
            { id: "tab-vehicles",  icon: "🚒", label: "Fahrzeuge"    },
            { id: "tab-school",    icon: "🎓", label: "Schulungen"   },
            { id: "tab-team",      icon: "👥", label: "Team"         },
            { id: "tab-settings",  icon: "⚙️",  label: "Einstellungen"},
        ];
        const tabBar = $(`<li><div id="lss-tabs"></div></li>`);
        tabs.forEach((t, i) => {
            tabBar.find("#lss-tabs").append(
                `<div class="lss-tab${i === 0 ? " active" : ""}" data-tab="${t.id}">
                    <span class="lss-tab-icon">${t.icon}</span>${t.label}
                </div>`
            );
        });
        root.append(tabBar);

        // ── Panel: Verband
        const panelAlliance = $(`<li><div id="tab-alliance" class="lss-panel active"></div></li>`);
        panelAlliance.find("#tab-alliance").append(`
            <div class="lss-grid-2">
                <div class="lss-cell span2">
                    <span class="lss-cell-lbl">Verband</span>
                    <span class="lss-cell-val c-blue" id="lss-val-alliance">${link}</span>
                </div>
                <div class="lss-cell">
                    <span class="lss-cell-lbl">Credits gesamt</span>
                    <span class="lss-cell-val c-green" id="lss-val-total">${fmt(data.credits_total||0)}</span>
                </div>
                <div class="lss-cell">
                    <span class="lss-cell-lbl">Verbandskasse</span>
                    <span class="lss-cell-val c-green" id="lss-val-kasse">${fmt(data.credits_current||0)}</span>
                </div>
                <div class="lss-cell">
                    <span class="lss-cell-lbl">Mitglieder</span>
                    <span class="lss-cell-val" id="lss-val-members">${data.user_count||0}</span>
                </div>
                <div class="lss-cell">
                    <span class="lss-cell-lbl">Rang</span>
                    <span class="lss-cell-val c-amber" id="lss-val-rank">${data.rank||"—"}</span>
                </div>
                <div class="lss-cell">
                    <span class="lss-cell-lbl">Meine Coins</span>
                    <span class="lss-cell-val c-purple" id="lss-user-coins">
                        <span class="lss-spinner"></span>
                    </span>
                </div>
                <div class="lss-cell">
                    <span class="lss-cell-lbl">Tagesverdienst Verband</span>
                    <span class="lss-cell-val c-green" id="lss-daily-val">${fmt(state.dailyEarnings)}</span>
                </div>
            </div>
            <div id="lss-credit-chart-wrap">
                <div id="lss-chart-header">
                    <span id="lss-chart-title">Kreditverlauf (heute)</span>
                    <span id="lss-chart-meta" style="font-size:10px;color:var(--muted)">Sammle Daten…</span>
                </div>
                <canvas id="lss-credit-chart"></canvas>
            </div>
        `);
        root.append(panelAlliance);

        // ── Panel: Fahrzeuge
        const panelVehicles = $(`<li><div id="tab-vehicles" class="lss-panel"></div></li>`);
        panelVehicles.find("#tab-vehicles").append(`<div id="lss-vehicle-panel"><div class="lss-empty"><span class="lss-spinner"></span> Lade Fahrzeugstatus…</div></div>`);
        root.append(panelVehicles);

        // ── Panel: Schulungen
        const panelSchool = $(`<li><div id="tab-school" class="lss-panel"></div></li>`);
        panelSchool.find("#tab-school").append(`<div id="lss-school-list"><div class="lss-empty"><span class="lss-spinner"></span> Lade Schulungen…</div></div>`);
        root.append(panelSchool);

        // ── Panel: Team
        const panelTeam = $(`<li><div id="tab-team" class="lss-panel"></div></li>`);
        panelTeam.find("#tab-team").append(`<div id="lss-team-panel"><div class="lss-empty"><span class="lss-spinner"></span> Lade Team…</div></div>`);
        root.append(panelTeam);

        // ── Panel: Einstellungen
        const panelSettings = $(`<li><div id="tab-settings" class="lss-panel"></div></li>`);
        panelSettings.find("#tab-settings").append(`
            <div id="lss-settings-panel">
                <div class="lss-setting-group">
                    <div class="lss-setting-label">Zurücksetzen</div>
                    <button class="lss-btn danger" id="lss-btn-reset-time">
                        <span class="lss-btn-icon">⏱</span> Spielzeit zurücksetzen
                    </button>
                    <button class="lss-btn danger" id="lss-btn-reset-earnings">
                        <span class="lss-btn-icon">💰</span> Tagesverdienst zurücksetzen
                    </button>
                    <button class="lss-btn danger" id="lss-btn-reset-history">
                        <span class="lss-btn-icon">📈</span> Kreditverlauf zurücksetzen
                    </button>
                </div>
                <div class="lss-setting-group">
                    <div class="lss-setting-label">Aktionen</div>
                    <button class="lss-btn" id="lss-btn-refresh">
                        <span class="lss-btn-icon">🔄</span> Jetzt aktualisieren
                    </button>
                </div>
            </div>
        `);
        root.append(panelSettings);

        // ── Akkordeons: Patch-Notes + Info
        root.append(buildAccordion("📋", "Patch-Notes", buildPatchHTML()));
        root.append(buildAccordion("ℹ️", "Informationen", buildInfoHTML()));

        // ── Footer
        root.append(`
            <li>
                <div id="lss-footer">
                    <span id="lss-footer-left">© 2025 Fabian (Capt.BobbyNash)</span>
                    <span id="lss-footer-right">Aktualisiert: <span id="lss-last-update">—</span></span>
                </div>
            </li>
        `);

        // ── Events: Tabs
        root.on("click", ".lss-tab", function () {
            const target = $(this).data("tab");
            root.find(".lss-tab").removeClass("active");
            $(this).addClass("active");
            root.find(".lss-panel").removeClass("active");
            root.find(`#${target}`).addClass("active");

            // Lazy-load beim ersten Tab-Wechsel
            if (target === "tab-vehicles" && !root.data("vehicles-loaded")) {
                root.data("vehicles-loaded", true);
                fetchVehicleStates();
            }
            if (target === "tab-school" && !root.data("school-loaded")) {
                root.data("school-loaded", true);
                fetchSchoolings();
            }
        });

        // ── Events: Buttons
        root.on("click", "#lss-btn-reset-time", () => {
            state.playtime = 0; save();
            $("#lss-playtime-val").text(fmtTime(0));
        });
        root.on("click", "#lss-btn-reset-earnings", () => {
            state.dailyEarnings = 0; state.lastCreditsTotal = 0; save();
            setVal("#lss-daily-val", fmt(0));
        });
        root.on("click", "#lss-btn-reset-history", () => {
            state.creditHistory = []; save();
            drawCreditChart();
        });
        root.on("click", "#lss-btn-refresh", () => {
            fetchAll();
            fetchVehicleStates();
            fetchSchoolings();
        });

        // ── Events: Akkordeons
        root.on("click", ".lss-acc-head", function () {
            $(this).closest(".lss-accordion").toggleClass("open");
        });

        navEntry.append(trigger).append(root);
        const navbar = $("#navbar-main-collapse .navbar-nav");
        navbar.length ? navbar.append(navEntry)
                      : console.error("[LSS-Pro] Navbar nicht gefunden.");

        // Chart nach DOM-Insert zeichnen
        setTimeout(drawCreditChart, 100);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  HTML-BAUSTEINE
    // ═══════════════════════════════════════════════════════════════════════════
    function buildAccordion(icon, title, bodyHTML) {
        return `
            <li>
                <div class="lss-accordion">
                    <div class="lss-acc-head">
                        <span>${icon}</span><span>${title}</span>
                        <span class="lss-acc-chevron">▼</span>
                    </div>
                    <div class="lss-acc-body">
                        <div class="lss-acc-content">${bodyHTML}</div>
                    </div>
                </div>
            </li>
        `;
    }

    function buildPatchHTML() {
        return `
            <div style="color:var(--blue);font-weight:700;font-size:11px;margin-bottom:10px">
                v5.0.0 — Multi-API Pro Dashboard
            </div>
            ${[
                "Neues Tab-basiertes Interface für mehr Übersicht",
                "Echtzeit-Fahrzeugstatus aller eigenen Einheiten",
                "Kreditverlauf mit Canvas-Liniendiagramm",
                "Laufende Verbandsschulungen auf einen Blick",
                "Team-Panel mit Rollen und direkten Profillinks",
                "Persönliche Credits + Coins via /api/userinfo",
                "GM_setValue/getValue statt localStorage (robuster)",
                "Lazy-loading: Tabs laden nur bei Bedarf",
            ].map(t => `<div class="lss-patch-entry"><span class="lss-patch-bullet">→</span><span>${t}</span></div>`).join("")}
        `;
    }

    function buildInfoHTML() {
        return [
            ["Ersteller",     "Fabian (Capt.BobbyNash)"],
            ["Supporter",     "m75e, twoyears"],
            ["Version",       VERSION],
            ["APIs",          "allianceinfo, userinfo, vehicle_states, alliance_schoolings"],
            ["Haupt-Interval","60 Sek."],
            ["Fahrzeug-Int.", "120 Sek."],
            ["Schulungs-Int.","300 Sek."],
        ].map(([k, v]) => `
            <div class="lss-info-row">
                <span class="lss-info-key">${k}</span>
                <span class="lss-info-val">${v}</span>
            </div>
        `).join("");
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  UPDATE CHECK
    // ═══════════════════════════════════════════════════════════════════════════
    function checkUpdate() {
        apiGet(UPDATE_URL, null, null);
        GM_xmlhttpRequest({
            method: "GET", url: UPDATE_URL,
            onload(r) {
                if (r.status !== 200) return;
                const m = r.responseText.match(/@version\s+([\d.]+)/);
                if (m && m[1] !== VERSION) showUpdatePopup(m[1]);
            },
        });
    }

    function showUpdatePopup(newVer) {
        const overlay = $(`
            <div id="lss-overlay">
                <div id="lss-popup">
                    <div class="p-icon">🚀</div>
                    <h2>Update verfügbar</h2>
                    <p>Version <strong>${newVer}</strong> ist bereit.<br>Du nutzt aktuell v${VERSION}.</p>
                    <div class="lss-popup-row">
                        <button class="lss-popup-btn ghost" id="lss-skip">Später</button>
                        <a class="lss-popup-btn primary" href="${UPDATE_URL}" target="_blank">
                            Jetzt aktualisieren
                        </a>
                    </div>
                </div>
            </div>
        `);
        $("body").append(overlay);
        overlay.on("click", "#lss-skip",           () => overlay.remove());
        overlay.on("click", e => { if ($(e.target).is(overlay)) overlay.remove(); });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  INIT
    // ═══════════════════════════════════════════════════════════════════════════
    $(document).ready(() => {
        load();
        fetchAll();

        setInterval(tickTimer,          1_000);
        setInterval(tickClock,          1_000);
        setInterval(checkMidnight,      INTERVAL.normal);
        setInterval(fetchAll,           INTERVAL.normal);
        setInterval(fetchVehicleStates, INTERVAL.mid);
        setInterval(fetchSchoolings,    INTERVAL.slow);
        setInterval(() => $("#lss-last-update").text(timeAgo(state.lastApiUpdate)), 15_000);

        checkUpdate();
    });

    window.addEventListener("beforeunload", save);

})();
