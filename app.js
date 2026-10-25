// FPL Private League Admin Engine — v3 with UI Enhancements
(function () {
  // App State
  const state = {
    viewMode: 'overall',
    currentGw: 3,
    seasonGw: 3,
    maxGw: 3,
    entryFee: 3,
    showMotmBadge: false,
    showMotsBadge: false,
    theme: localStorage.getItem('fpl_admin_theme') || 'light',
    showAba: (() => { try { return localStorage.getItem('fpl_show_aba') !== '0'; } catch (e) { return true; } })(),
    lastSyncedAt: null,
    renderedLeagueId: null,
    motsPrizePool: 50,
    dataset: JSON.parse(JSON.stringify(window.DEMO_DATA)),
    eventStatuses: {},
    statusFilter: 'recent',
    chartInstance: null,
    perfChartInstance: null,
    standingsSortColumn: null,
    standingsSortDir: 'desc',
    activeLeagueId: '389585',
    fetchCounter: 0,
    motmSelectedMonth: null
  };

  // DOM Elements
  const elements = {
    gwDisplay:              document.getElementById('gwDisplay'),
    prevGwBtn:              document.getElementById('prevGwBtn'),
    nextGwBtn:              document.getElementById('nextGwBtn'),
    standingsBody:          document.getElementById('standingsBody'),
    winLossTableContainer:  document.getElementById('winLossTableContainer'),
    seasonMatrixContainer:  document.getElementById('seasonMatrixContainer'),
    matrixLegendCurrent:    document.getElementById('matrixLegendCurrent'),
    chipTrackerContainer:   document.getElementById('chipTrackerContainer'),
    gwSpotlightContainer:   document.getElementById('gwSpotlightContainer'),
    gwStatusMatrix:         document.getElementById('gwStatusMatrix'),
    statusCounters:         document.getElementById('statusCounters'),
    statusTabs:             document.getElementById('statusTabs'),
    toggleMotmBtn:          document.getElementById('toggleMotmBtn'),
    motmMonthSelect:        document.getElementById('motmMonthSelect'),
    toggleMotsBtn:          document.getElementById('toggleMotsBtn'),
    themeToggleBtns:        document.querySelectorAll('[data-theme-btn]'),
    leagueNameHeader:       document.getElementById('leagueNameHeader'),
    leagueIdInput:          document.getElementById('leagueIdInput'),
    syncFplBtn:             document.getElementById('syncFplBtn'),
    syncStatusTag:          document.getElementById('syncStatusTag'),
    memberCountBadge:       document.getElementById('memberCountBadge'),
    standingsGwBadge:       document.getElementById('standingsGwBadge'),
    viewModeSelect:         document.getElementById('viewModeSelect'),
    leagueNameDisplay:      document.getElementById('leagueNameDisplay')
  };

  // ===================== ABA BANK ACCOUNTS =====================
  const ABA_ACCOUNTS = {
    2023789: '001 335 048', // Monor Noem
    2026484: '000 971 427', // Bora Chhe
    2023013: '000 790 069', // នរសិង្ហ កន្សៃ
    2067578: '002 157 778', // Kun Phaktra
    2024611: '077 767 949', // Vibol Dang
    2019453: '085 897 968', // Seyha ly
    2026160: '007 043 391', // Piseth Nhim
    145847: ''              // Hokheng Ker (blank)
  };

  // ===================== ICONS =====================
  const ICON_PATHS = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    loader: '<path d="M21 12a9 9 0 1 1-6.22-8.56"/>',
    trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
    swap: '<path d="M7 16V4M3 8l4-4 4 4M17 8v12M21 16l-4 4-4-4"/>',
    arrowRight: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    plus: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    minus: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    wallet: '<path d="M20 7H5a2 2 0 0 1 0-4h13v4"/><path d="M3 5v14a2 2 0 0 0 2 2h15V7"/><path d="M16 14h.01"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    shirt: '<path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z"/>',
    bench: '<path d="M4 10h16M6 10V6h12v4M5 10v8M19 10v8M5 14h14"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>'
  };

  function icon(name, size = 14) {
    return `<svg class="ico ico-${name}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
  }

  const CHART_FONT = "'Inter', 'Kantumruy Pro', sans-serif";

  // ===================== MANAGER IDENTITY =====================
  // Same palette and order as the rank chart, so a manager keeps one colour everywhere
  const MANAGER_COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#64748b'];

  function getManagerColor(managerId) {
    const idx = (state.dataset.managers || []).findIndex(m => m.id === managerId);
    return MANAGER_COLORS[(idx < 0 ? 0 : idx) % MANAGER_COLORS.length];
  }

  function getManagerInitials(name) {
    const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(w => Array.from(w)[0]).join('').toUpperCase() || '?';
  }

  // Team badges saved by scripts/sync-badges.py (entry id -> { file, v })
  let teamBadges = {};

  function getBadgeUrl(managerId) {
    const b = teamBadges[String(managerId)];
    return b && b.file ? `${b.file}?v=${b.v || ''}` : null;
  }

  function loadTeamBadges() {
    return fetch(`badges/index.json?t=${Date.now()}`)
      .then(r => (r.ok ? r.json() : {}))
      .then(data => { teamBadges = data || {}; })
      .catch(() => { teamBadges = {}; });
  }

  function managerAvatarHtml(managerId, name) {
    const badge = getBadgeUrl(managerId);
    if (badge) return `<img class="mgr-avatar mgr-badge" src="${badge}" alt="" loading="lazy">`;
    return `<span class="mgr-avatar" style="background:${getManagerColor(managerId)}">${getManagerInitials(name)}</span>`;
  }

  // Manager cell used across tables: coloured avatar + name + team
  function managerCellHtml(m, extraNameHtml = '', extraBelowHtml = '') {
    return `
      <div class="manager-cell">
        ${managerAvatarHtml(m.id, m.name)}
        <div class="manager-info">
          <span class="manager-name">${m.name}${extraNameHtml}</span>
          <span class="team-name">${m.teamName}</span>
          ${extraBelowHtml}
        </div>
      </div>`;
  }

  // ===================== SEASON POSITION MOVEMENT =====================
  function getSeasonRankMap(gw) {
    const map = {};
    if (gw < 1) return map;
    const standings = getGameweekStandings(gw);
    standings.forEach(m => {
      map[m.id] = 1 + standings.filter(o => (o.seasonTotalNet || 0) > (m.seasonTotalNet || 0)).length;
    });
    return map;
  }

  function seasonMoveHtml(managerId, nowMap, prevMap) {
    const now = nowMap[managerId];
    const prev = prevMap[managerId];
    if (!now || !prev) return '';
    const diff = prev - now;
    if (diff > 0) return `<span class="rank-move up" title="Up ${diff} in the season table">${icon('up', 11)}${diff}</span>`;
    if (diff < 0) return `<span class="rank-move down" title="Down ${-diff} in the season table">${icon('down', 11)}${-diff}</span>`;
    return `<span class="rank-move same" title="No change in the season table">–</span>`;
  }

  // ===================== ANIMATED NUMBER COUNTER =====================
  function animateNumber(element, endVal, duration = 400, prefix = '', suffix = '') {
    if (!element) return;
    const startVal = parseFloat(element.dataset.curVal || '0');
    if (isNaN(startVal) || startVal === endVal) {
      element.dataset.curVal = endVal;
      element.textContent = `${prefix}${endVal}${suffix}`;
      return;
    }

    const startTime = performance.now();
    element.dataset.curVal = endVal;

    function update(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * ease;
      
      const formatted = Number.isInteger(endVal) ? Math.round(current) : current.toFixed(2);
      element.textContent = `${prefix}${formatted}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        const finalFormatted = Number.isInteger(endVal) ? endVal : endVal.toFixed(2);
        element.textContent = `${prefix}${finalFormatted}${suffix}`;
      }
    }
    requestAnimationFrame(update);
  }



  // ===================== SEASON AWARDS =====================
  function renderSeasonAwards() {
    const container = document.getElementById('seasonAwardsContainer');
    if (!container) return;
    container.innerHTML = '';

    const managers = state.dataset.managers;
    if (!managers || managers.length === 0) return;

    // Calculate totals across GW 1..currentGw
    const stats = managers.map(m => {
      let benchPts = 0;
      let hitCost = 0;
      let captainPts = 0;
      let grossPts = 0;
      let payouts = 0;

      for (let g = 1; g <= state.currentGw; g++) {
        const standings = getGameweekStandings(g);
        const item = standings.find(x => x.id === m.id);
        if (item) {
          benchPts += item.bench;
          hitCost += item.hitCost;
          captainPts += item.captain;
          grossPts += item.grossScore;
          payouts += item.payout;
        }
      }
      return { id: m.id, name: m.name, benchPts, hitCost, captainPts, grossPts, payouts };
    });

    const benchKing = [...stats].sort((a, b) => b.benchPts - a.benchPts)[0];
    const bigSpender = [...stats].sort((a, b) => b.hitCost - a.hitCost)[0];
    const captainAmerica = [...stats].sort((a, b) => b.captainPts - a.captainPts)[0];
    const unluckiest = [...stats].sort((a, b) => (b.grossPts - b.payouts * 10) - (a.grossPts - a.payouts * 10))[0];

    const awards = [
      {
        cls: 'bench',
        icon: '👑',
        title: 'King of Bench',
        winner: benchKing?.name || '-',
        stat: `${benchKing?.benchPts || 0} Bench Pts Left`
      },
      {
        cls: 'spender',
        icon: '💸',
        title: 'Big Spender',
        winner: bigSpender?.name || '-',
        stat: `-${bigSpender?.hitCost || 0} Pts Spent on Hits`
      },
      {
        cls: 'captain',
        icon: '🎯',
        title: 'Captain America',
        winner: captainAmerica?.name || '-',
        stat: `${captainAmerica?.captainPts || 0} Captain Pts Scored`
      },
      {
        cls: 'unlucky',
        icon: '⚡',
        title: 'Unluckiest Manager',
        winner: unluckiest?.name || '-',
        stat: `${unluckiest?.grossPts || 0} Gross Pts (${unluckiest?.payouts >= 0 ? '+' : ''}$${unluckiest?.payouts || 0})`
      }
    ];

    awards.forEach(a => {
      const card = document.createElement('div');
      card.className = `award-card ${a.cls}`;
      card.innerHTML = `
        <div class="award-icon-box">${a.icon}</div>
        <div class="award-title">${a.title}</div>
        <div class="award-winner-name">${a.winner}</div>
        <div class="award-stat-badge">${a.stat}</div>
      `;
      container.appendChild(card);
    });
  }

  // ===================== INITIALIZE APPLICATION =====================
  function init() {
    applyTheme(state.theme);
    if (typeof Chart !== 'undefined') Chart.defaults.font.family = CHART_FONT;

    // If pre-bundled live static data exists, initialize immediately with real league 389585
    const staticData = window.FPL_LIVE_STATIC || {};
    if (staticData.leagues && staticData.leagues['389585']) {
      const lData = staticData.leagues['389585'];
      state.dataset = {
        leagueName: lData.leagueName || 'Clash of Elite 2026-2027',
        entryFee: 3.00,
        chipTypes: window.DEMO_DATA ? window.DEMO_DATA.chipTypes : [],
        managers: lData.managers || [],
        months: lData.months || (window.DEMO_DATA ? window.DEMO_DATA.months : []),
        gameweeks: lData.gameweeks || [],
        players: staticData.players || {},
        playerGwPoints: staticData.playerGwPoints || {},
        playerGwExplain: staticData.playerGwExplain || {},
        squadPicks: staticData.squadPicks || {},
        transfersHistory: staticData.transfersHistory || {},
        teams: staticData.teams || {}
      };
      if (lData.currentGw) {
        state.seasonGw = lData.currentGw;
        state.currentGw = lData.currentGw;
        state.maxGw = lData.currentGw;
      }
      if (staticData.eventStatuses) {
        state.eventStatuses = staticData.eventStatuses;
      }
      if (staticData.fixtures) {
        state.fixtures = staticData.fixtures;
        if (state.dataset) state.dataset.fixtures = staticData.fixtures;
      }
      if (elements.leagueNameHeader) elements.leagueNameHeader.textContent = lData.leagueName;
      if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = lData.leagueName;
    }

    populateGwSelect();
    populateViewModeSelect();
    bindEvents();
    changeGw(state.currentGw);
    initChart();
    initPerformanceChart();
    initCollapsibles();
    initSquadPanelGestures();
    updateMemberCountBadge();

    // Swap initials for team badges once the badge index has loaded
    loadTeamBadges().then(() => { if (Object.keys(teamBadges).length) renderAll(); });

    // Default to real league Clash of Elite 2026-2027 (389585) on load
    if (elements.leagueIdInput) {
      elements.leagueIdInput.value = '389585';
      syncLiveFplLeague();
    }

    // Auto-sync live scores every 60 seconds while on a live league
    setInterval(() => {
      const code = elements.leagueIdInput ? elements.leagueIdInput.value.trim() : '';
      if (code && code.toLowerCase() !== 'demo' && !document.hidden) {
        fetchLeagueData(code);
      }
    }, 60000);
  }

  // ===================== THEME =====================
  function applyTheme(themeName) {
    state.theme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('fpl_admin_theme', themeName);
    elements.themeToggleBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.themeBtn === themeName);
    });
    if (state.chartInstance) updateChartTheme();
    if (state.perfChartInstance) updatePerformanceChartTheme();
  }

  // ===================== #3 MEMBER COUNT BADGE =====================
  function updateMemberCountBadge() {
    const count = state.dataset.managers.length;
    if (elements.memberCountBadge) {
      elements.memberCountBadge.textContent = `${count} Member${count !== 1 ? 's' : ''}`;
    }
  }

  // ===================== GW & VIEW MODE SELECTOR =====================
  // The gameweek strip is the gameweek picker; rebuild it when the season length changes
  function populateGwSelect() {
    renderGwStrip();
  }

  function populateViewModeSelect() {
    if (!elements.viewModeSelect) return;
    elements.viewModeSelect.innerHTML = '<option value="overall">Overall Standings</option>';
    if (state.dataset.months) {
      state.dataset.months.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.name.toLowerCase();
        opt.textContent = m.name; // Clean month name e.g. "August"
        elements.viewModeSelect.appendChild(opt);
      });
    }
  }

  function populateMotmMonthSelect() {
    if (!elements.motmMonthSelect) return;
    const months = state.dataset.months || [];
    const activeSeasonGw = state.seasonGw || state.maxGw || (state.dataset && state.dataset.currentGw) || 1;
    const currentDefaultMonth = (state.motmSelectedMonth) || (state.viewMode !== 'overall' ? state.viewMode : (getCurrentGwMonth(state.currentGw)?.name || 'September'));

    elements.motmMonthSelect.innerHTML = '';
    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m.name;
      const maxMonthGw = Math.max(...m.gws);
      const isFin = activeSeasonGw > maxMonthGw;
      const isInProg = activeSeasonGw >= Math.min(...m.gws) && activeSeasonGw <= maxMonthGw;
      const tag = isFin ? ' (Finalized)' : (isInProg ? ' (Active)' : '');
      opt.textContent = `${m.name}${tag}`;
      if (m.name.toLowerCase() === currentDefaultMonth.toLowerCase()) {
        opt.selected = true;
      }
      elements.motmMonthSelect.appendChild(opt);
    });
  }

  // ===================== EVENTS =====================
  function bindEvents() {
    elements.prevGwBtn.addEventListener('click', () => {
      state.viewMode = 'overall';
      if (elements.viewModeSelect) elements.viewModeSelect.value = 'overall';
      changeGw(state.currentGw - 1);
    });
    elements.nextGwBtn.addEventListener('click', () => {
      state.viewMode = 'overall';
      if (elements.viewModeSelect) elements.viewModeSelect.value = 'overall';
      changeGw(state.currentGw + 1);
    });

    if (elements.viewModeSelect) {
      elements.viewModeSelect.addEventListener('change', e => {
        state.viewMode = e.target.value;
        renderGwStrip();
        renderStandingsTable();
      });
    }

    // #7 — "Latest GW" Quick Jump
    const stripTiles = document.getElementById('gwStripTiles');
    if (stripTiles) {
      stripTiles.addEventListener('click', e => {
        const tile = e.target.closest('[data-gw]');
        if (!tile || tile.disabled) return;
        state.viewMode = 'overall';
        if (elements.viewModeSelect) elements.viewModeSelect.value = 'overall';
        changeGw(Number(tile.dataset.gw));
      });
    }

    if (elements.toggleMotmBtn) {
      elements.toggleMotmBtn.addEventListener('click', () => {
        state.showMotmBadge = !state.showMotmBadge;
        elements.toggleMotmBtn.classList.toggle('active', state.showMotmBadge);
        if (elements.motmMonthSelect) {
          elements.motmMonthSelect.style.display = state.showMotmBadge ? 'inline-block' : 'none';
          if (state.showMotmBadge) populateMotmMonthSelect();
        }
        renderStandingsTable();
      });
    }

    if (elements.motmMonthSelect) {
      elements.motmMonthSelect.addEventListener('change', e => {
        state.motmSelectedMonth = e.target.value;
        renderStandingsTable();
      });
    }

    if (elements.toggleMotsBtn) {
      elements.toggleMotsBtn.addEventListener('click', () => {
        state.showMotsBadge = !state.showMotsBadge;
        elements.toggleMotsBtn.classList.toggle('active', state.showMotsBadge);
        renderStandingsTable();
      });
    }

    elements.themeToggleBtns.forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.themeBtn));
    });

    // Saved League Pills — quick switch
    document.querySelectorAll('.league-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const code = pill.dataset.leagueCode;
        const name = pill.dataset.leagueName;
        
        // Update active state
        document.querySelectorAll('.league-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        if (code === 'demo') {
          elements.leagueIdInput.value = '';
          if (name && elements.leagueNameHeader) elements.leagueNameHeader.textContent = name;
          if (name && elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = name;
          state.activeLeagueId = 'demo';
          state.fetchCounter++; // ignore any live sync still in flight for the previous league
          state.dataset = JSON.parse(JSON.stringify(window.DEMO_DATA));
          state.maxGw = 10;
          state.currentGw = 10;
          state.lastSyncedAt = null;
          updateSyncAgo();
          elements.syncStatusTag.className = 'sync-status-tag live';
          elements.syncStatusTag.textContent = 'DEMO MODE';
          populateGwSelect();
          changeGw(10);
          updateMemberCountBadge();
          renderAll();
        } else {
          elements.leagueIdInput.value = code;
          if (name && elements.leagueNameHeader) elements.leagueNameHeader.textContent = name;
          // Auto-sync
          syncLiveFplLeague();
        }
      });
    });

    if (elements.syncFplBtn) {
      elements.syncFplBtn.addEventListener('click', syncLiveFplLeague);
    }

    const thSeasonPts = document.getElementById('thSeasonPts');
    if (thSeasonPts) {
      thSeasonPts.addEventListener('click', () => {
        if (state.standingsSortColumn !== 'seasonTotalNet') {
          state.standingsSortColumn = 'seasonTotalNet';
          state.standingsSortDir = 'desc';
        } else if (state.standingsSortDir === 'desc') {
          state.standingsSortDir = 'asc';
        } else {
          state.standingsSortColumn = null;
          state.standingsSortDir = 'desc';
        }
        renderStandingsTable();
      });
    }

  }

  // ===================== #8 COLLAPSIBLE SECTIONS =====================
  function initCollapsibles() {
    document.querySelectorAll('.collapse-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const content = document.getElementById(targetId);
        if (!content) return;
        const isCollapsed = content.classList.toggle('collapsed');
        btn.textContent = isCollapsed ? 'Show' : 'Hide';
        btn.setAttribute('aria-expanded', String(!isCollapsed));
      });
    });
  }

  // ===================== LIVE FPL SYNC =====================
  // Our own Cloudflare Worker relay (cloudflare/fpl-proxy-worker.js), tried first.
  // Leave empty to use only the public proxies.
  const FPL_PROXY_BASE = 'https://fpl-proxy.lyseyha.workers.dev';

  function fplProxyBase() {
    try { return (localStorage.getItem('fpl_proxy_base') || FPL_PROXY_BASE).replace(/\/+$/, ''); } catch (e) { return FPL_PROXY_BASE; }
  }

  async function fetchFplWithTimeout(targetUrl, timeoutMs = 8000) {
    const proxies = [
      `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
      `https://corsproxy.io/?${targetUrl}`,
      `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`,
      `https://thingproxy.freeboard.io/fetch/${targetUrl}`,
      targetUrl // direct attempt
    ];

    function isValidFplPayload(data) {
      if (!data || typeof data !== 'object') return false;
      if (data.error || data.message === 'Not found') return false;
      return Boolean(
        data.standings ||
        data.league ||
        data.events ||
        data.elements ||
        data.entry_history ||
        data.picks ||
        data.current ||
        data.status ||
        data.chips ||
        Array.isArray(data)
      );
    }

    const fetchSingleProxy = async (proxyUrl) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch(proxyUrl, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const text = await resp.text();
          if (text) {
            const data = JSON.parse(text);
            if (isValidFplPayload(data)) {
              return data;
            }
          }
        }
      } catch (e) {
        clearTimeout(timeoutId);
      }
      throw new Error('Proxy failed or returned invalid data');
    };

    // 1. Our own relay: same path, different host
    const relay = fplProxyBase();
    if (relay) {
      try {
        return await fetchSingleProxy(targetUrl.replace('https://fantasy.premierleague.com', relay));
      } catch (e) {
        console.warn('FPL relay failed, trying public proxies:', targetUrl);
      }
    }

    try {
      // 2. Fallback: race the public proxies — fastest valid one wins
      return await Promise.any(proxies.map(p => fetchSingleProxy(p)));
    } catch (allErr) {
      return null;
    }
  }

  async function syncLiveFplLeague() {
    let inputCode = elements.leagueIdInput.value.trim();
    if (!inputCode) return;

    // Automatic Join Code mapping fallback for pre-season join codes
    if (inputCode.toLowerCase() === '8d70fl') inputCode = '389585';
    if (inputCode.toLowerCase() === '0m27ty') inputCode = '390100';
    
    if (!inputCode) {
      alert('Please enter a valid FPL League ID or Join Code.');
      return;
    }

    await fetchLeagueData(inputCode);
  }

  async function fetchLeagueData(inputCode) {
    if (!inputCode) return;

    if (inputCode.toLowerCase() === 'demo') {
      const demoPill = document.querySelector('.league-pill[data-league-code="demo"]');
      if (demoPill) demoPill.click();
      return;
    }

    // Switching to a different league: show placeholders instead of the previous league's table
    if (state.renderedLeagueId !== String(inputCode)) showStandingsSkeleton();

    state.activeLeagueId = String(inputCode);
    const fetchId = ++state.fetchCounter;

    // Highlight active pill
    document.querySelectorAll('.league-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.leagueCode === String(inputCode));
    });

    elements.syncStatusTag.className = 'sync-status-tag pending';
    elements.syncStatusTag.textContent = `Syncing #${inputCode}...`;

    let dataLoadedSuccessfully = false;

    // 1. Load initial cached/bundled data from window.FPL_LIVE_STATIC and live_data.json
    try {
      if (window.FPL_LIVE_STATIC) {
        state.dataset.players = window.FPL_LIVE_STATIC.players || {};
        state.dataset.squadPicks = window.FPL_LIVE_STATIC.squadPicks || {};
        state.dataset.transfersHistory = window.FPL_LIVE_STATIC.transfersHistory || {};
        state.dataset.playerGwExplain = window.FPL_LIVE_STATIC.playerGwExplain || {};
        state.dataset.teams = window.FPL_LIVE_STATIC.teams || {};
        if (window.FPL_LIVE_STATIC.eventStatuses) {
          state.eventStatuses = window.FPL_LIVE_STATIC.eventStatuses;
        }
        if (window.FPL_LIVE_STATIC.leagues && window.FPL_LIVE_STATIC.leagues[inputCode]) {
          const lData = window.FPL_LIVE_STATIC.leagues[inputCode];
          state.dataset.managers = lData.managers || [];
          state.dataset.gameweeks = lData.gameweeks || [];
          if (lData.months) state.dataset.months = lData.months;
          if (lData.leagueName) {
            if (elements.leagueNameHeader) elements.leagueNameHeader.textContent = lData.leagueName;
            if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = lData.leagueName;
          }
          if (lData.currentGw) {
            state.currentGw = lData.currentGw;
            state.maxGw = lData.currentGw;
          }
          populateGwSelect();
          changeGw(state.currentGw);
          updateMemberCountBadge();
          renderAll();
          dataLoadedSuccessfully = true;
          elements.syncStatusTag.className = 'sync-status-tag live';
          elements.syncStatusTag.textContent = `SYNCED (${state.dataset.managers.length} Members)`; markSynced();
        }
      }

      const resp = await fetch(`./live_data.json?t=${Date.now()}`);
      if (resp.ok) {
        const liveJson = await resp.json();
        if (liveJson && liveJson.leagues && liveJson.leagues[inputCode]) {
          const lData = liveJson.leagues[inputCode];
          state.dataset.managers = lData.managers || [];
          state.dataset.gameweeks = lData.gameweeks || [];
          if (lData.months) state.dataset.months = lData.months;
          if (lData.leagueName) {
            if (elements.leagueNameHeader) elements.leagueNameHeader.textContent = lData.leagueName;
            if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = lData.leagueName;
          }
          if (lData.currentGw) {
            state.seasonGw = lData.currentGw;
            state.currentGw = lData.currentGw;
            state.maxGw = lData.currentGw;
          }
          if (liveJson.players) state.dataset.players = liveJson.players;
          if (liveJson.playerGwPoints) state.dataset.playerGwPoints = liveJson.playerGwPoints;
          if (liveJson.playerGwExplain) state.dataset.playerGwExplain = liveJson.playerGwExplain;
          if (liveJson.squadPicks) state.dataset.squadPicks = liveJson.squadPicks;
          if (liveJson.transfersHistory) state.dataset.transfersHistory = liveJson.transfersHistory;
          if (liveJson.teams) state.dataset.teams = liveJson.teams;
          if (liveJson.eventStatuses) {
            state.eventStatuses = liveJson.eventStatuses;
          }
          if (liveJson.fixtures) {
            state.fixtures = liveJson.fixtures;
            if (state.dataset) state.dataset.fixtures = liveJson.fixtures;
          }

          populateGwSelect();
          changeGw(state.currentGw);
          updateMemberCountBadge();
          renderAll();
          dataLoadedSuccessfully = true;
          elements.syncStatusTag.className = 'sync-status-tag live';
          elements.syncStatusTag.textContent = `SYNCED (${state.dataset.managers.length} Members)`; markSynced();
        }
      }
    } catch (e) {
      console.warn('live_data.json load notice:', e);
    }

    // 2. Check local cache (only if live_data.json was not loaded)
    try {
      const cached = localStorage.getItem(`fpl_live_cache_${inputCode}`);
      if (cached && !dataLoadedSuccessfully) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.managers && parsed.managers.length > 0) {
          state.dataset.managers = parsed.managers;
          if (parsed.gameweeks) state.dataset.gameweeks = parsed.gameweeks;
          if (parsed.leagueName) {
            if (elements.leagueNameHeader) elements.leagueNameHeader.textContent = parsed.leagueName;
            if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = parsed.leagueName;
          }
          if (parsed.currentGw) {
            state.currentGw = parsed.currentGw;
            state.maxGw = parsed.currentGw;
          }
          if (parsed.eventStatuses) {
            state.eventStatuses = parsed.eventStatuses;
          }
          populateGwSelect();
          changeGw(state.currentGw);
          updateMemberCountBadge();
          renderAll();
          dataLoadedSuccessfully = true;
        }
      }
    } catch (cErr) {}

    // If still no data at all (first visit with no network), set clean pre-season template
    if (!dataLoadedSuccessfully && (!state.dataset.managers || state.dataset.managers.length === 0)) {
      if (inputCode === '390100') {
        if (elements.leagueNameHeader) elements.leagueNameHeader.textContent = "Fantasy with Heng";
        if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = "Fantasy with Heng";
        state.dataset.managers = [
          { id: 145847, name: "Hokheng Ker", teamName: "Undefeated", avatar: "HK" },
          { id: 2019453, name: "Seyha ly", teamName: "The Red Devil", avatar: "SL" }
        ];
      } else if (inputCode === '389585') {
        if (elements.leagueNameHeader) elements.leagueNameHeader.textContent = "Clash of Elite 2026-2027";
        if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = "Clash of Elite 2026-2027";
        state.dataset.managers = [
          { id: 2023789, name: "Monor Noem", teamName: "NORA FC", avatar: "MO" },
          { id: 2023013, name: "នរ សិង្ហ កន្សៃ", teamName: "G.O.A.T", avatar: "នរ" },
          { id: 2026484, name: "Bora Chhe", teamName: "Bora's Team", avatar: "BO" },
          { id: 2067578, name: "Kun Phaktra", teamName: "The Blue Warriors", avatar: "KU" },
          { id: 2026160, name: "Piseth Nhim", teamName: "DESSTRo", avatar: "PI" },
          { id: 2019453, name: "Seyha ly", teamName: "The Red Devil", avatar: "SE" },
          { id: 2024611, name: "Vibol Dang", teamName: "The White Emperor", avatar: "VI" }
        ];
      } else {
        state.dataset.managers = [];
      }
      state.dataset.gameweeks = Array.from({ length: 38 }, (_, i) => ({
        gw: i + 1, scores: {}, hits: {}, transfers: {}, benchPoints: {}, captainPoints: {}, chipsUsed: {}, seasonTotals: {}
      }));
      updateMemberCountBadge();
      renderAll();
    }

    // 3. Attempt direct real-time API fetch
    try {
      const standingsUrl = `https://fantasy.premierleague.com/api/leagues-classic/${inputCode}/standings/`;
      const data = await fetchFplWithTimeout(standingsUrl, 8000);
      if (fetchId !== state.fetchCounter) return;
      if (!data) throw new Error(`Could not reach live API for #${inputCode}`);

      if (data && data.league && data.league.name) {
        elements.leagueNameHeader.textContent = data.league.name;
        if (elements.leagueNameDisplay) elements.leagueNameDisplay.textContent = data.league.name;
      }

      let fetchedResults = [];
      if (data && data.standings && data.standings.results && data.standings.results.length > 0) {
        fetchedResults = data.standings.results;
      } else if (data && data.new_entries && data.new_entries.results && data.new_entries.results.length > 0) {
        fetchedResults = data.new_entries.results;
      }

      if (fetchedResults.length > 0) {
        const count = fetchedResults.length;
        elements.syncStatusTag.className = 'sync-status-tag live';
        elements.syncStatusTag.textContent = `LIVE (${count} Members)`; markSynced();

        const realManagerMap = {
          145847: { name: "Hokheng Ker", teamName: "Undefeated" },
          2019453: { name: "Seyha ly", teamName: "The Red Devil" },
          2067578: { name: "Kun Phaktra", teamName: "The Blue Warriors" },
          2026160: { name: "Piseth Nhim", teamName: "DESSTRo" },
          2026484: { name: "Bora Chhe", teamName: "Bora's Team" },
          2024611: { name: "Vibol Dang", teamName: "The White Emperor" },
          2023789: { name: "Monor Noem", teamName: "NORA FC" },
          2023013: { name: "នរ សិង្ហ កន្សៃ", teamName: "G.O.A.T" }
        };

        state.dataset.managers = fetchedResults.map(r => ({
          id: r.entry,
          name: realManagerMap[r.entry]?.name || (r.player_name ? r.player_name : `${r.player_first_name || ''} ${r.player_last_name || ''}`.trim() || r.entry_name),
          teamName: realManagerMap[r.entry]?.teamName || r.entry_name,
          avatar: (realManagerMap[r.entry]?.name || r.player_name || r.entry_name).substring(0, 2).toUpperCase()
        }));

        state.dataset.months = [
          { name: "August", gws: [1, 2] },
          { name: "September", gws: [3, 4, 5] },
          { name: "October", gws: [6, 7, 8, 9] },
          { name: "November", gws: [10, 11, 12] },
          { name: "December", gws: [13, 14, 15, 16, 17, 18] },
          { name: "January", gws: [19, 20, 21, 22, 23] },
          { name: "February", gws: [24, 25, 26, 27] },
          { name: "March", gws: [28, 29, 30] },
          { name: "April", gws: [31, 32, 33] },
          { name: "May", gws: [34, 35, 36, 37, 38] }
        ];

        // Maintain or initialize 38 gameweeks
        if (!state.dataset.gameweeks || state.dataset.gameweeks.length < 38) {
          state.dataset.gameweeks = Array.from({ length: 38 }, (_, i) => ({
            gw: i + 1, scores: {}, hits: {}, transfers: {}, benchPoints: {}, captainPoints: {}, chipsUsed: {}, seasonTotals: {}
          }));
        }

        // Fetch Live FPL Gameweek & Event Status with Multi-Proxy Fallback
        let detectedGw = state.currentGw || 1;
        try {
          const bsTargetUrl = 'https://fantasy.premierleague.com/api/bootstrap-static/';
          const bsData = await fetchFplWithTimeout(bsTargetUrl, 6000);

          if (bsData && bsData.events) {
            bsData.events.forEach(ev => {
              state.eventStatuses[ev.id] = {
                gw: ev.id,
                finished: ev.finished,
                data_checked: ev.data_checked,
                is_current: ev.is_current,
                is_previous: ev.is_previous,
                is_next: ev.is_next,
                deadline_time: ev.deadline_time,
                bonus_added: ev.finished || ev.data_checked,
                leagues: ev.data_checked ? 'Updated' : 'Updating'
              };
            });

            if (bsData.elements && Array.isArray(bsData.elements)) {
              window.PL_PLAYER_MAP = {};
              if (!state.dataset.players) state.dataset.players = {};
              bsData.elements.forEach(el => {
                window.PL_PLAYER_MAP[el.id] = el.web_name || `${el.first_name} ${el.second_name}`;
                if (!state.dataset.players[el.id]) {
                  state.dataset.players[el.id] = {
                    id: el.id,
                    web_name: el.web_name,
                    element_type: el.element_type,
                    event_points: el.event_points || 0,
                    code: el.code
                  };
                } else {
                  state.dataset.players[el.id].event_points = el.event_points || 0;
                  if (el.code) state.dataset.players[el.id].code = el.code;
                }
              });
            }

            const activeEv = bsData.events.find(e => e.is_current);
            const nextEv = bsData.events.find(e => e.is_next);
            const prevEv = bsData.events.filter(e => e.finished).pop();

            if (activeEv) detectedGw = activeEv.id;
            else if (prevEv) detectedGw = prevEv.id;
            else if (nextEv) detectedGw = Math.max(1, nextEv.id - 1);
          }

          // Populate current GW baseline from standings
          fetchedResults.forEach(r => {
            if (state.dataset.gameweeks[detectedGw - 1]) {
              state.dataset.gameweeks[detectedGw - 1].scores[r.entry] = r.event_total !== undefined ? r.event_total : 0;
              state.dataset.gameweeks[detectedGw - 1].seasonTotals[r.entry] = r.total !== undefined ? r.total : (r.event_total || 0);
            }
          });

          // Fetch Event Status, Fixtures & Live Player Stats to accurately determine match status
          const [stData, fixData, liveEventData] = await Promise.all([
            fetchFplWithTimeout('https://fantasy.premierleague.com/api/event-status/', 3500),
            fetchFplWithTimeout(`https://fantasy.premierleague.com/api/fixtures/?event=${detectedGw}`, 3500),
            fetchFplWithTimeout(`https://fantasy.premierleague.com/api/event/${detectedGw}/live/`, 3500)
          ]);

          const elStatsMap = {};
          if (liveEventData && liveEventData.elements && Array.isArray(liveEventData.elements)) {
            const liveExplain = {};
            liveEventData.elements.forEach(el => {
              if (el && el.id && el.stats) {
                elStatsMap[el.id] = el.stats;
              }
              if (el && el.id && el.explain) liveExplain[String(el.id)] = compactExplain(el.explain);
            });
            state.dataset.playerGwExplain = Object.assign({}, state.dataset.playerGwExplain, { [String(detectedGw)]: liveExplain });

            // Live points per player for this gameweek (the saved copy from the
            // GitHub sync can be hours old and would otherwise win in the squad panel)
            const livePoints = {};
            liveEventData.elements.forEach(el => {
              if (el && el.id && el.stats) livePoints[String(el.id)] = el.stats.total_points || 0;
            });
            state.dataset.playerGwPoints = Object.assign({}, state.dataset.playerGwPoints, { [String(detectedGw)]: livePoints });
          }

          if (fixData && Array.isArray(fixData)) {
            state.fixturesByGw = Object.assign({}, state.fixturesByGw, { [detectedGw]: fixData });
            state.fixtures = fixData;
            if (state.dataset) state.dataset.fixtures = fixData;
          }

          if (fixData && Array.isArray(fixData) && state.dataset.players) {
            const teamFixMap = {};
            fixData.forEach(f => {
              teamFixMap[f.team_h] = f;
              teamFixMap[f.team_a] = f;
            });

            // Also map by team short name if team_id not present
            const teamsMap = state.dataset.teams || (window.FPL_LIVE_STATIC && window.FPL_LIVE_STATIC.teams) || {};
            const teamCodeMap = {};
            Object.entries(teamsMap).forEach(([tId, tObj]) => {
              if (tObj && tObj.short_name) teamCodeMap[tObj.short_name] = Number(tId);
            });

            Object.values(state.dataset.players).forEach(pl => {
              const teamId = pl.team_id || teamCodeMap[pl.team] || pl.team;
              const fix = teamFixMap[teamId] || {};
              const st = elStatsMap[pl.id] || {};

              const fixStarted = fix.started === true;
              const fixFinished = fix.finished === true || (fix.minutes || 0) >= 90;
              const minutesPlayed = st.minutes !== undefined ? st.minutes : (pl.minutes || 0);
              const playedFlag = st.played === true || minutesPlayed > 0;

              // Determine Opponent & Fixture Difficulty Rating (FDR)
              let oppShort = '-';
              let difficulty = 3;
              if (fix && (fix.team_h || fix.team_a)) {
                const isHome = (Number(teamId) === Number(fix.team_h));
                const oppId = isHome ? fix.team_a : fix.team_h;
                difficulty = isHome ? (fix.team_h_difficulty || 3) : (fix.team_a_difficulty || 3);
                const oppTeamObj = teamsMap[oppId] || Object.values(teamsMap).find(t => t.id === oppId) || {};
                oppShort = oppTeamObj.short_name || oppTeamObj.name || (oppId ? `Team #${oppId}` : '-');
              }

              pl.opponent = oppShort;
              pl.opponent_short = oppShort;
              pl.difficulty = difficulty || 3;

              if (st.total_points !== undefined) {
                pl.event_points = st.total_points;
              }
              pl.minutes = minutesPlayed;

              if (!fixStarted) {
                pl.match_status = 'yet_to_play';
                pl.status_label = '⏳ Yet to Play';
              } else if (playedFlag || minutesPlayed > 0) {
                if (fixFinished) {
                  pl.match_status = 'played';
                  pl.status_label = '✓ Played';
                } else {
                  pl.match_status = 'live';
                  pl.status_label = `🟢 Live (${fix.minutes || 0}')`;
                }
              } else {
                if (fixFinished) {
                  pl.match_status = 'dnp';
                  pl.status_label = '✕ DNP (0m)';
                } else {
                  pl.match_status = 'live';
                  pl.status_label = `🟢 Live (${fix.minutes || 0}')`;
                }
              }
            });
          }

          if (stData && stData.status) {
            stData.status.forEach(st => {
              if (state.eventStatuses[st.event]) {
                state.eventStatuses[st.event].bonus_added = st.bonus_added;
                state.eventStatuses[st.event].points = st.points;
              }
            });
            if (state.eventStatuses[detectedGw]) {
              state.eventStatuses[detectedGw].daily_status = stData.status.filter(s => s.event === detectedGw);
              state.eventStatuses[detectedGw].leagues = stData.leagues || '';
            }
          }
        } catch (stErr) {
          console.warn('FPL Event Status fetch notice:', stErr);
        }

        state.currentGw = detectedGw;
        state.maxGw = detectedGw;
        if (!state.fixturesGw) state.fixturesGw = state.currentGw;
        if (!state.weeklyGw) state.weeklyGw = state.currentGw;
        if (!state.statusGw) state.statusGw = state.currentGw;

        // Fetch detailed manager history & picks in parallel
        try {
          elements.syncStatusTag.textContent = `Syncing Details...`;
          const managerPromises = state.dataset.managers.map(async (m) => {
            try {
              const histUrl = `https://fantasy.premierleague.com/api/entry/${m.id}/history/`;
              const histData = await fetchFplWithTimeout(histUrl, 3500);

              const picksUrl = `https://fantasy.premierleague.com/api/entry/${m.id}/event/${detectedGw}/picks/`;
              const picksData = await fetchFplWithTimeout(picksUrl, 3500);

              return { id: m.id, histData, picksData };
            } catch (e) {
              return { id: m.id, histData: null, picksData: null };
            }
          });

          const managerDetails = await Promise.all(managerPromises);

          managerDetails.forEach(({ id, histData, picksData }) => {
            const liveRes = fetchedResults.find(r => r.entry === id);

            if (histData && histData.current && Array.isArray(histData.current) && histData.current.length > 0) {
              histData.current.forEach(h => {
                const gNum = h.event;
                if (gNum >= 1 && gNum <= 38) {
                  const gwObj = state.dataset.gameweeks[gNum - 1];
                  gwObj.scores[id] = h.points || 0;
                  gwObj.hits[id] = h.event_transfers_cost || 0;
                  gwObj.transfers[id] = h.event_transfers || 0;
                  gwObj.benchPoints[id] = h.points_on_bench || 0;
                  gwObj.seasonTotals[id] = h.total_points || 0;
                }
              });
            } else {
              const gwObj = state.dataset.gameweeks[detectedGw - 1];
              if (gwObj && liveRes) {
                gwObj.scores[id] = liveRes.event_total || 0;
                gwObj.seasonTotals[id] = liveRes.total || liveRes.event_total || 0;
              }
            }

            if (histData && histData.chips && Array.isArray(histData.chips)) {
              histData.chips.forEach(c => {
                const gNum = c.event;
                if (gNum >= 1 && gNum <= 38) {
                  state.dataset.gameweeks[gNum - 1].chipsUsed[id] = c.name;
                }
              });
            }

            if (picksData) {
              const currGwObj = state.dataset.gameweeks[detectedGw - 1];
              if (currGwObj) {
                if (picksData.active_chip) {
                  currGwObj.chipsUsed[id] = picksData.active_chip;
                }
                if (picksData.entry_history) {
                  if (picksData.entry_history.points !== undefined) currGwObj.scores[id] = picksData.entry_history.points;
                  if (picksData.entry_history.event_transfers_cost !== undefined) currGwObj.hits[id] = picksData.entry_history.event_transfers_cost;
                  if (picksData.entry_history.event_transfers !== undefined) currGwObj.transfers[id] = picksData.entry_history.event_transfers;
                  if (picksData.entry_history.points_on_bench !== undefined) currGwObj.benchPoints[id] = picksData.entry_history.points_on_bench;
                  if (picksData.entry_history.total_points !== undefined) currGwObj.seasonTotals[id] = picksData.entry_history.total_points;
                }
              }
            }
          });
        } catch (detailErr) {
          console.warn('Manager detail sync notice:', detailErr);
        }

        if (fetchId !== state.fetchCounter) return;

        try {
          localStorage.setItem(`fpl_live_cache_${inputCode}`, JSON.stringify({
            leagueName: (data && data.league && data.league.name) ? data.league.name : "Clash of Elite 2026-2027",
            managers: state.dataset.managers,
            gameweeks: state.dataset.gameweeks,
            currentGw: state.currentGw,
            eventStatuses: state.eventStatuses
          }));
        } catch (saveErr) {}

        populateGwSelect();
        changeGw(state.currentGw);
        updateMemberCountBadge();
        renderAll();
        elements.syncStatusTag.className = 'sync-status-tag live';
        elements.syncStatusTag.textContent = `LIVE (${state.dataset.managers.length} Members)`; markSynced();
        refreshOpenManagerModal();
        refreshMatchCentre();
      } else {
        throw new Error('No live standings found');
      }
    } catch (err) {
      console.warn('Live API direct proxy fetch not reachable, maintaining verified synced dataset:', err);
      if (state.dataset.managers && state.dataset.managers.length > 0) {
        elements.syncStatusTag.className = 'sync-status-tag live';
        elements.syncStatusTag.textContent = `SYNCED (${state.dataset.managers.length} Members)`; markSynced();
        populateGwSelect();
        changeGw(state.currentGw || 1);
        updateMemberCountBadge();
        renderAll();
      }
    }
  }

  // ===================== GW STRIP =====================
  const GW_STRIP_VISIBLE = 5;
  // Every gameweek as a tile in a bar that shows five at a time and scrolls
  // sideways (two-finger swipe on a trackpad). The next, unplayed gameweek is greyed out.
  function renderGwStrip() {
    const wrap = document.getElementById('gwStripTiles');
    if (!wrap) return;
    const maxGw = state.maxGw || 1;
    const cur = state.currentGw || maxGw;
    let html = '';
    for (let g = 1; g <= maxGw; g++) {
      const on = g === cur && state.viewMode === 'overall';
      html += `<button class="gw-tile${on ? ' is-on' : ''}${g === maxGw ? ' is-latest' : ''}" data-gw="${g}" aria-pressed="${on}" title="Gameweek ${g}${g === maxGw ? ' (latest)' : ''}">${g}</button>`;
    }
    if (maxGw < 38) {
      html += `<button class="gw-tile is-future" data-gw="${maxGw + 1}" disabled title="Gameweek ${maxGw + 1} hasn't started">${maxGw + 1}</button>`;
    }
    wrap.innerHTML = html;

    // Show the selected gameweek in the middle of the visible five (tile + gap = 36px)
    const tiles = wrap.children.length;
    const firstVisible = Math.max(0, Math.min(cur - 3, tiles - GW_STRIP_VISIBLE));
    wrap.scrollTo({ left: firstVisible * 36, behavior: 'auto' });
  }

  // ===================== GW NAVIGATION =====================
  function changeGw(newGw) {
    if (newGw < 1 || newGw > state.maxGw) return;
    state.currentGw = newGw;
    elements.gwDisplay.textContent = `Gameweek ${newGw}`;
    
    if (elements.standingsGwBadge) {
      elements.standingsGwBadge.textContent = `Gameweek ${newGw}`;
    }

    elements.prevGwBtn.disabled = newGw === 1;
    elements.nextGwBtn.disabled = newGw === state.maxGw;
    renderGwStrip();
    renderAll();
  }

  // ===================== DATA HELPERS =====================
  function getCurrentGwMonth(gw) {
    return state.dataset.months.find(m => m.gws.includes(gw)) || state.dataset.months[0];
  }

  function getMonthlyMotmLeader(monthIdentifier) {
    let activeMonth = null;
    const months = state.dataset.months || [];
    if (typeof monthIdentifier === 'string') {
      activeMonth = months.find(m => m.name.toLowerCase() === monthIdentifier.toLowerCase());
    } else if (typeof monthIdentifier === 'number') {
      activeMonth = getCurrentGwMonth(monthIdentifier);
    }
    if (!activeMonth) {
      activeMonth = months[0] || { name: 'August', gws: [1, 2] };
    }

    const monthGws = activeMonth.gws || [];
    const startGw = monthGws.length > 0 ? Math.min(...monthGws) : 1;
    const endGw = monthGws.length > 0 ? Math.max(...monthGws) : 1;

    const activeSeasonGw = state.seasonGw || state.maxGw || (state.dataset && state.dataset.currentGw) || 1;
    const isFinalized = activeSeasonGw > endGw;
    const gwsToCalculate = monthGws.filter(g => g <= activeSeasonGw);
    const managers = state.dataset.managers || [];

    const totals = managers.map(m => {
      let netPts = 0, grossPts = 0, benchPts = 0, captainPts = 0, hitCost = 0;
      gwsToCalculate.forEach(g => {
        const gwData = state.dataset.gameweeks.find(x => x.gw === g);
        if (gwData) {
          const gScore = (g < activeSeasonGw)
            ? (gwData.scores[m.id] || 0)
            : getManagerLiveScore(m.id, g);
          const hCost = gwData.hits ? (gwData.hits[m.id] || 0) : 0;
          netPts += (gScore - hCost);
          grossPts += gScore;
          benchPts += (gwData.benchPoints[m.id] || 0);
          captainPts += gwData.captainPoints ? (gwData.captainPoints[m.id] || 0) : 0;
          hitCost += hCost;
        }
      });
      return { id: m.id, name: m.name, teamName: m.teamName, netPts, grossPts, benchPts, captainPts, hitCost };
    });

    totals.sort((a, b) => {
      if (b.netPts !== a.netPts) return b.netPts - a.netPts;
      if (b.benchPts !== a.benchPts) return b.benchPts - a.benchPts;
      if (b.captainPts !== a.captainPts) return b.captainPts - a.captainPts;
      return a.hitCost - b.hitCost;
    });

    const topScore = (totals.length > 0 && gwsToCalculate.length > 0) ? totals[0].netPts : 0;
    const leaders = (totals.length > 0 && gwsToCalculate.length > 0)
      ? totals.filter(m => m.netPts === topScore)
      : [];
    const isTied = leaders.length > 1;

    return {
      activeMonth,
      leaders,
      leader: leaders[0] || null,
      isTied,
      topScore,
      totals,
      isFinalized,
      startGw,
      endGw,
      hasGames: gwsToCalculate.length > 0
    };
  }

  function getSeasonLeaders(gw) {
    const managers = state.dataset.managers;
    if (!managers || managers.length === 0) return [];
    
    const totals = managers.map(m => {
      let totalNetPts = 0;
      for (let g = 1; g <= gw; g++) {
        const gwData = state.dataset.gameweeks.find(x => x.gw === g);
        if (gwData) totalNetPts += (gwData.scores[m.id] || 0) - (gwData.hits ? (gwData.hits[m.id] || 0) : 0);
      }
      return { id: m.id, name: m.name, totalNetPts };
    });
    totals.sort((a, b) => b.totalNetPts - a.totalNetPts);
    
    const maxPts = totals[0].totalNetPts;
    return totals.filter(t => t.totalNetPts === maxPts);
  }

  function getManagerSeasonNetUpToGw(managerId, upToGw) {
    let sum = 0;
    const staticData = window.FPL_LIVE_STATIC || {};
    const squadPicksMap = (state.dataset.squadPicks && Object.keys(state.dataset.squadPicks).length > 0)
      ? state.dataset.squadPicks
      : (staticData.squadPicks || {});
    const mgrPicks = squadPicksMap[String(managerId)] || squadPicksMap[Number(managerId)];

    for (let g = 1; g <= upToGw; g++) {
      const gwData = state.dataset.gameweeks.find(x => x.gw === g);
      const gross = getManagerLiveScore(managerId, g);
      const squadData = (mgrPicks && (mgrPicks[String(g)] || mgrPicks[Number(g)])) || null;

      let hits = 0;
      if (squadData && squadData.entry_history && typeof squadData.entry_history.event_transfers_cost === 'number') {
        hits = squadData.entry_history.event_transfers_cost;
      } else if (gwData && gwData.hits) {
        hits = gwData.hits[managerId] || 0;
      }
      sum += (gross - hits);
    }
    return sum;
  }

  function getChipColorClass(chipName) {
    if (!chipName) return '';
    const n = chipName.toLowerCase();
    if (n.includes('wildcard') || n.includes('wc')) return 'chip-wildcard';
    if (n.includes('free hit') || n.includes('freehit') || n.includes('fh')) return 'chip-free-hit';
    if (n.includes('bench boost') || n.includes('bboost') || n.includes('bb')) return 'chip-bench-boost';
    if (n.includes('triple captain') || n.includes('3xc') || n.includes('tc')) return 'chip-triple-captain';
    return '';
  }

  // Short display label — always includes the set number (e.g. "WC 1", "FH 2")
  function getChipLabel(chipName) {
    if (!chipName) return '';
    const n = chipName.toLowerCase();
    const num = chipName.match(/\d+/)?.[0] || '1';
    if (n.includes('wildcard') || n.includes('wc')) return `WC ${num}`;
    if (n.includes('free hit') || n.includes('freehit') || n.includes('fh')) return `FH ${num}`;
    if (n.includes('bench boost') || n.includes('bboost') || n.includes('bb')) return `BB ${num}`;
    if (n.includes('triple captain') || n.includes('3xc') || n.includes('tc')) return `TC ${num}`;
    return chipName.toUpperCase();
  }

  // ===================== AUTO-SUBSTITUTIONS CALCULATION ENGINE =====================
  function computeAutoSubs(picks, automaticSubs, pMap, isBenchBoost) {
    if (isBenchBoost || !picks || picks.length === 0) return [];

    // 1. Official automatic_subs from FPL API
    if (automaticSubs && automaticSubs.length > 0) {
      return automaticSubs.map(s => ({
        element_in: s.element_in,
        element_out: s.element_out,
        is_official: true
      }));
    }

    // 2. Intelligent Auto-Subs when Gameweek / Matches are Finished (0 Remaining)
    if (!pMap || Object.keys(pMap).length === 0) return [];

    const starters = picks.filter(p => p.position <= 11);
    const bench = picks.filter(p => p.position > 11).sort((a, b) => a.position - b.position);

    // Identify DNP starters (matches finished with 0 minutes)
    const dnpStarters = starters.filter(p => {
      const pl = pMap[p.element];
      return pl && pl.match_status === 'dnp';
    });

    if (dnpStarters.length === 0) return [];

    // Check if all squad/gameweek matches are finished (0 remaining) or bench candidates have played
    const allMatchesFinished = picks.every(p => {
      const pl = pMap[p.element];
      return !pl || pl.match_status === 'played' || pl.match_status === 'dnp';
    });

    const computed = [];
    const usedBenchIds = new Set();

    // Formation tracking: 1: GK, 2: DEF, 3: MID, 4: FWD
    const currentFormation = { 1: 0, 2: 0, 3: 0, 4: 0 };
    starters.forEach(p => {
      const pl = pMap[p.element];
      const type = pl?.element_type || (p.position === 1 ? 1 : 2);
      currentFormation[type] = (currentFormation[type] || 0) + 1;
    });

    // 1. Goalkeeper Auto-Sub
    const gkStarter = dnpStarters.find(p => p.position === 1);
    if (gkStarter) {
      const benchGk = bench.find(p => p.position === 12);
      if (benchGk) {
        const plGk = pMap[benchGk.element];
        const isEligible = plGk && (plGk.match_status === 'played' || (allMatchesFinished && plGk.match_status !== 'dnp'));
        if (isEligible) {
          computed.push({
            element_in: benchGk.element,
            element_out: gkStarter.element,
            is_official: false
          });
          usedBenchIds.add(benchGk.element);
        }
      }
    }

    // 2. Outfield Auto-Subs (positions 2..11)
    const outfieldDnps = dnpStarters.filter(p => p.position > 1);
    const outfieldBench = bench.filter(p => p.position > 12);

    for (const dnpStarter of outfieldDnps) {
      const pOutInfo = pMap[dnpStarter.element];
      const outType = pOutInfo?.element_type || 2;

      for (const benchPick of outfieldBench) {
        if (usedBenchIds.has(benchPick.element)) continue;

        const pInInfo = pMap[benchPick.element];
        if (!pInInfo) continue;

        const isEligible = pInInfo.match_status === 'played' || (allMatchesFinished && pInInfo.match_status !== 'dnp');
        if (!isEligible) continue;

        const inType = pInInfo.element_type || 2;
        const testFormation = { ...currentFormation };
        testFormation[outType]--;
        testFormation[inType]++;

        // Valid FPL formation: 1 GK, 3-5 DEF, 2-5 MID, 1-3 FWD
        const isValid = testFormation[1] === 1 &&
                        testFormation[2] >= 3 && testFormation[2] <= 5 &&
                        testFormation[3] >= 2 && testFormation[3] <= 5 &&
                        testFormation[4] >= 1 && testFormation[4] <= 3;

        if (isValid) {
          computed.push({
            element_in: benchPick.element,
            element_out: dnpStarter.element,
            is_official: false
          });
          usedBenchIds.add(benchPick.element);
          currentFormation[outType]--;
          currentFormation[inType]++;
          break;
        }
      }
    }

    return computed;
  }

  function getManagerLiveScore(mId, gw) {
    const gwData = state.dataset.gameweeks.find(g => g.gw === gw);
    let fallbackScore = (gwData && gwData.scores) ? (gwData.scores[mId] || 0) : 0;

    const staticData = window.FPL_LIVE_STATIC || {};
    const squadPicksMap = (state.dataset.squadPicks && Object.keys(state.dataset.squadPicks).length > 0)
      ? state.dataset.squadPicks
      : (staticData.squadPicks || {});
    const playersMap = (state.dataset.players && Object.keys(state.dataset.players).length > 0)
      ? state.dataset.players
      : (staticData.players || {});

    const mgrPicks = squadPicksMap[String(mId)] || squadPicksMap[Number(mId)];
    const squadData = (mgrPicks && (mgrPicks[String(gw)] || mgrPicks[Number(gw)])) || null;

    const activeSeasonGw = state.seasonGw || state.maxGw || (state.dataset && state.dataset.currentGw) || 1;

    // For any past / finalized gameweek (gw < activeSeasonGw), ALWAYS use official recorded points
    // NEVER dynamically re-calculate past gameweeks against current live playersMap
    if (gw < activeSeasonGw) {
      if (squadData && squadData.entry_history && typeof squadData.entry_history.points === 'number') {
        return squadData.entry_history.points;
      }
      if (fallbackScore > 0) {
        return fallbackScore;
      }
    }

    if (!squadData || !squadData.picks || squadData.picks.length === 0 || !playersMap || Object.keys(playersMap).length === 0) {
      if (squadData && squadData.entry_history && typeof squadData.entry_history.points === 'number') {
        return squadData.entry_history.points;
      }
      return fallbackScore;
    }

    // Only compute live squad points dynamically against playersMap if gw is the current active GW
    if (gw !== activeSeasonGw && squadData.entry_history && typeof squadData.entry_history.points === 'number') {
      return squadData.entry_history.points;
    }

    const activeChip = squadData.active_chip ? getChipLabel(squadData.active_chip) : null;
    const isBenchBoost = Boolean(activeChip && (activeChip.toLowerCase().includes('bb') || activeChip.toLowerCase().includes('bench boost')));

    const autoSubs = computeAutoSubs(squadData.picks, squadData.automatic_subs, playersMap, isBenchBoost);
    const subInIds = new Set(autoSubs.map(s => s.element_in));
    const subOutIds = new Set(autoSubs.map(s => s.element_out));

    let liveSum = 0;
    let hasPlayerPoints = false;

    squadData.picks.forEach(p => {
      const pl = playersMap[p.element];
      const pts = pl ? (pl.event_points || 0) : 0;
      if (pts > 0) hasPlayerPoints = true;
      const multiplier = p.multiplier || 1;

      if (isBenchBoost) {
        liveSum += pts * multiplier;
      } else if (p.position <= 11) {
        if (!subOutIds.has(p.element)) {
          liveSum += pts * multiplier;
        }
      } else if (subInIds.has(p.element)) {
        liveSum += pts * multiplier;
      }
    });

    if (hasPlayerPoints) return liveSum;
    if (squadData && squadData.entry_history && typeof squadData.entry_history.points === 'number') {
      return squadData.entry_history.points;
    }
    return fallbackScore;
  }

  // ===================== STANDINGS ENGINE =====================
  function getGameweekStandings(gw) {
    const gwData = state.dataset.gameweeks.find(g => g.gw === gw);
    if (!gwData) return [];

    const activeManagers = state.dataset.managers;
    const total = activeManagers.length;

    const staticData = window.FPL_LIVE_STATIC || {};
    const squadPicksMap = (state.dataset.squadPicks && Object.keys(state.dataset.squadPicks).length > 0)
      ? state.dataset.squadPicks
      : (staticData.squadPicks || {});
    const playersMap = (state.dataset.players && Object.keys(state.dataset.players).length > 0)
      ? state.dataset.players
      : (staticData.players || {});

    const activeSeasonGw = state.seasonGw || state.maxGw || (state.dataset && state.dataset.currentGw) || 1;
    const isPastGw = gw < activeSeasonGw;

    let managers = activeManagers.map(m => {
      const mgrPicks = squadPicksMap[String(m.id)] || squadPicksMap[Number(m.id)];
      const squadData = (mgrPicks && (mgrPicks[String(gw)] || mgrPicks[Number(gw)])) || null;

      const grossScore    = getManagerLiveScore(m.id, gw);
      let hitCost = 0;
      if (squadData && squadData.entry_history && typeof squadData.entry_history.event_transfers_cost === 'number') {
        hitCost = squadData.entry_history.event_transfers_cost;
      } else if (gwData && gwData.hits && gwData.hits[m.id] !== undefined) {
        hitCost = gwData.hits[m.id];
      }

      let transfers = 0;
      const transfersHistoryMap = (state.dataset.transfersHistory && Object.keys(state.dataset.transfersHistory).length > 0)
        ? state.dataset.transfersHistory
        : (staticData.transfersHistory || {});
      const mTransfers = transfersHistoryMap[String(m.id)] || transfersHistoryMap[Number(m.id)] || [];
      const gwTransfers = mTransfers.filter(t => t.event === gw);

      if (squadData && squadData.entry_history && typeof squadData.entry_history.event_transfers === 'number') {
        transfers = squadData.entry_history.event_transfers;
      } else if (gwData && gwData.transfers && gwData.transfers[m.id] !== undefined) {
        transfers = gwData.transfers[m.id];
      } else if (gwTransfers.length > 0) {
        transfers = gwTransfers.length;
      } else if (gw > 1 && mgrPicks && !isPastGw) {
        const prevSquad = mgrPicks[String(gw - 1)] || mgrPicks[Number(gw - 1)];
        if (prevSquad && prevSquad.picks && squadData && squadData.picks) {
          const prevElements = new Set(prevSquad.picks.map(p => p.element));
          const currentElements = new Set(squadData.picks.map(p => p.element));
          let diffCount = 0;
          currentElements.forEach(el => {
            if (!prevElements.has(el)) diffCount++;
          });
          if (diffCount > 0) transfers = diffCount;
        }
      }

      const netScore      = grossScore - hitCost;

      let bench = 0;
      const activeChip = squadData && squadData.active_chip ? getChipLabel(squadData.active_chip) : null;
      const isBenchBoost = Boolean(activeChip && (activeChip.toLowerCase().includes('bb') || activeChip.toLowerCase().includes('bench boost')));

      if (isPastGw) {
        if (squadData && squadData.entry_history && typeof squadData.entry_history.points_on_bench === 'number') {
          bench = squadData.entry_history.points_on_bench;
        } else if (gwData && gwData.benchPoints && gwData.benchPoints[m.id] !== undefined) {
          bench = gwData.benchPoints[m.id];
        }
      } else {
        if (squadData && squadData.picks && squadData.picks.length > 0 && playersMap && Object.keys(playersMap).length > 0) {
          const autoSubs = computeAutoSubs(squadData.picks, squadData.automatic_subs, playersMap, isBenchBoost);
          const subInIds = new Set(autoSubs.map(s => s.element_in));
          const subOutIds = new Set(autoSubs.map(s => s.element_out));

          squadData.picks.forEach(p => {
            const pl = playersMap[p.element];
            const pts = pl ? (pl.event_points || 0) : 0;
            const isOnBench = (p.position > 11 && !subInIds.has(p.element)) || (p.position <= 11 && subOutIds.has(p.element));
            if (isOnBench) {
              bench += pts;
            }
          });
        } else if (squadData && squadData.entry_history && typeof squadData.entry_history.points_on_bench === 'number') {
          bench = squadData.entry_history.points_on_bench;
        } else if (gwData && gwData.benchPoints) {
          bench = gwData.benchPoints[m.id] || 0;
        }
      }

      let captain = 0;
      if (isPastGw) {
        if (gwData && gwData.captainPoints && gwData.captainPoints[m.id] !== undefined && gwData.captainPoints[m.id] > 0) {
          captain = gwData.captainPoints[m.id];
        } else {
          const gwPoints = (state.dataset.playerGwPoints && state.dataset.playerGwPoints[String(gw)]) ||
                           (staticData.playerGwPoints && staticData.playerGwPoints[String(gw)]) || null;
          if (gwPoints && squadData && squadData.picks) {
            const capPick = squadData.picks.find(p => p.is_captain);
            if (capPick) {
              captain = (gwPoints[String(capPick.element)] || 0) * (capPick.multiplier || 2);
            }
          }
        }
      } else {
        if (squadData && squadData.picks && squadData.picks.length > 0 && playersMap && Object.keys(playersMap).length > 0) {
          const capPick = squadData.picks.find(p => p.is_captain);
          if (capPick) {
            const capPl = playersMap[capPick.element];
            const multiplier = capPick.multiplier || 2;
            captain = capPl ? (capPl.event_points || 0) * multiplier : 0;
          }
        }
        if (captain === 0 && gwData && gwData.captainPoints && gwData.captainPoints[m.id] !== undefined) {
          captain = gwData.captainPoints[m.id] || 0;
        }
      }

      const chip          = (squadData && squadData.active_chip) ? getChipLabel(squadData.active_chip) : (gwData && gwData.chipsUsed ? gwData.chipsUsed[m.id] : null);
      const seasonTotalNet = getManagerSeasonNetUpToGw(m.id, gw);
      return { ...m, grossScore, hitCost, transfers, netScore, bench, captain, chip, seasonTotalNet };
    });

    // 4-Layer Custom Tiebreaker Sort
    managers.sort((a, b) => {
      if (b.netScore   !== a.netScore)   return b.netScore - a.netScore;
      if (b.bench      !== a.bench)      return b.bench - a.bench;           // Layer 1
      if (b.captain    !== a.captain)    return b.captain - a.captain;       // Layer 2
      if (a.hitCost    !== b.hitCost)    return a.hitCost - b.hitCost;       // Layer 3
      return b.seasonTotalNet - a.seasonTotalNet;                            // Layer 4
    });

    // Dynamic zone sizes:
    const splitSize  = Math.floor(total / 2);
    const hasNeutral = total % 2 === 1; // true only when N is odd
    const neutralRank = hasNeutral ? splitSize + 1 : null; // exact middle rank
    const hasPlayedMatches = managers.some(m => m.grossScore > 0 || m.hitCost > 0);

    const resultManagers = managers.map((m, idx) => {
      const rank = idx + 1;
      let payout = 0, statusClass = '', outcomeCode = 'N', note = '';

      if (!hasPlayedMatches) {
        payout = 0;
        statusClass = 'tr-neutral';
        outcomeCode = '-';
        note = 'Neutral';
      } else {
        if (rank <= splitSize) {
          payout = state.entryFee; statusClass = 'tr-top-3'; outcomeCode = 'W';
          const payer = managers[total - rank];
          note = `Gets from ${payer ? payer.name : 'Bottom'}`;
        } else if (hasNeutral && rank === neutralRank) {
          payout = 0; statusClass = 'tr-neutral'; outcomeCode = 'N';
          note = 'Neutral';
        } else {
          payout = -state.entryFee; statusClass = 'tr-bottom-3'; outcomeCode = 'L';
          const receiver = managers[total - rank];
          note = `Pays to ${receiver ? receiver.name : 'Top'}`;
        }
      }

      // Tiebreaker indicator — applies to ALL managers sharing a boundary score when a boundary tie occurs
      const topBoundaryScore = splitSize > 0 ? managers[splitSize - 1]?.netScore : null;
      const isTopBoundaryTie = splitSize > 0 && managers[splitSize]?.netScore === topBoundaryScore;

      const bottomBoundaryScore = (hasNeutral && neutralRank) ? managers[neutralRank - 1]?.netScore : null;
      const isBottomBoundaryTie = (hasNeutral && neutralRank) && managers[neutralRank]?.netScore === bottomBoundaryScore;

      const tiedAtTop = isTopBoundaryTie && (m.netScore === topBoundaryScore);
      const tiedAtBottom = isBottomBoundaryTie && (m.netScore === bottomBoundaryScore);
      const isTied = hasPlayedMatches && (tiedAtTop || tiedAtBottom);

      return { ...m, rank, payout, statusClass, outcomeCode, isTied, payoutNote: note };
    });

    // Progressive Tiebreaker detail calculation
    resultManagers.forEach(m => {
      if (!m.isTied) {
        m.tiebreakerText = '';
        return;
      }
      const cohort = resultManagers.filter(x => x.netScore === m.netScore);
      const benchSet = new Set(cohort.map(x => x.bench));
      if (benchSet.size > 1) {
        m.tiebreakerText = `TB → Bench: ${m.bench}`;
        return;
      }

      const captSet = new Set(cohort.map(x => x.captain));
      if (captSet.size > 1) {
        m.tiebreakerText = `TB → Bench: ${m.bench} · Capt: ${m.captain}`;
        return;
      }

      const hitSet = new Set(cohort.map(x => x.hitCost));
      if (hitSet.size > 1) {
        m.tiebreakerText = `TB → Bench: ${m.bench} · Capt: ${m.captain} · Hits: ${m.hitCost}`;
        return;
      }

      m.tiebreakerText = `TB → Bench: ${m.bench} · Capt: ${m.captain} · Hits: ${m.hitCost} · Season: ${m.seasonTotalNet}`;
    });

    return resultManagers;
  }

  // ===================== MONTHLY STANDINGS ENGINE =====================
  function getMonthlyStandings(monthName) {
    const monthObj = state.dataset.months.find(m => m.name.toLowerCase() === monthName.toLowerCase()) || state.dataset.months[0];
    const monthGws = monthObj.gws;
    const startGw = Math.min(...monthGws);
    const endGw = Math.max(...monthGws);

    const activeSeasonGw = state.seasonGw || state.maxGw || (state.dataset && state.dataset.currentGw) || 1;
    const isFinalized = activeSeasonGw > endGw;
    // Only calculate gameweeks belonging to this month that have commenced or finished
    const gwsToCalculate = monthGws.filter(g => g <= activeSeasonGw);
    
    const activeManagers = state.dataset.managers;
    const total = activeManagers.length;

    let managers = activeManagers.map(m => {
      let grossScore = 0, hitCost = 0, transfers = 0, bench = 0, captain = 0, chips = [];
      const gwBreakdown = {};

      monthGws.forEach(g => {
        if (g <= activeSeasonGw) {
          const gwData = state.dataset.gameweeks.find(x => x.gw === g);
          if (gwData) {
            const gScore = (g < activeSeasonGw) 
              ? (gwData.scores[m.id] || 0)
              : getManagerLiveScore(m.id, g);
            const hCost = gwData.hits ? (gwData.hits[m.id] || 0) : 0;
            const tMade = gwData.transfers ? (gwData.transfers[m.id] ?? (hCost > 0 ? Math.floor(hCost / 4) + 1 : 0)) : (hCost > 0 ? Math.floor(hCost / 4) + 1 : 0);
            const netGw = gScore - hCost;
            gwBreakdown[g] = netGw;
            grossScore += gScore;
            hitCost += hCost;
            transfers += tMade;
            bench += (gwData.benchPoints[m.id] || 0);
            captain += gwData.captainPoints ? (gwData.captainPoints[m.id] || 0) : 0;
            if (gwData.chipsUsed && gwData.chipsUsed[m.id]) {
              chips.push(`${getChipLabel(gwData.chipsUsed[m.id])} (GW${g})`);
            }
          } else {
            gwBreakdown[g] = '-';
          }
        } else {
          gwBreakdown[g] = '-';
        }
      });

      const netScore = grossScore - hitCost;
      const monthTotalNet = netScore;
      const chip = chips.length > 0 ? chips.join(', ') : null;

      return { ...m, grossScore, hitCost, transfers, netScore, monthTotalNet, bench, captain, chip, gwBreakdown };
    });

    managers.sort((a, b) => {
      if (b.netScore !== a.netScore) return b.netScore - a.netScore;
      if (b.bench !== a.bench) return b.bench - a.bench;
      if (b.captain !== a.captain) return b.captain - a.captain;
      return a.hitCost - b.hitCost;
    });

    const splitSize  = Math.floor(total / 2);
    const hasNeutral = total % 2 === 1;
    const neutralRank = hasNeutral ? splitSize + 1 : null;

    const resultManagers = managers.map((m, idx) => {
      const rank = idx + 1;
      let payout = 0, statusClass = '', outcomeCode = 'N';

      if (rank <= splitSize) {
        payout = state.entryFee; statusClass = 'tr-top-3'; outcomeCode = 'W';
      } else if (hasNeutral && rank === neutralRank) {
        payout = 0; statusClass = 'tr-neutral'; outcomeCode = 'N';
      } else {
        payout = -state.entryFee; statusClass = 'tr-bottom-3'; outcomeCode = 'L';
      }

      const topBoundaryScore = splitSize > 0 ? managers[splitSize - 1]?.netScore : null;
      const isTopBoundaryTie = splitSize > 0 && managers[splitSize]?.netScore === topBoundaryScore;

      const bottomBoundaryScore = (hasNeutral && neutralRank) ? managers[neutralRank - 1]?.netScore : null;
      const isBottomBoundaryTie = (hasNeutral && neutralRank) && managers[neutralRank]?.netScore === bottomBoundaryScore;

      const tiedAtTop = isTopBoundaryTie && (m.netScore === topBoundaryScore);
      const tiedAtBottom = isBottomBoundaryTie && (m.netScore === bottomBoundaryScore);
      const isTied = tiedAtTop || tiedAtBottom;

      let note = '';
      if (rank <= splitSize) {
        const payer = managers[total - rank];
        note = `Gets from ${payer ? payer.name : 'Bottom'}`;
      } else if (hasNeutral && rank === neutralRank) {
        note = 'Neutral';
      } else {
        const receiver = managers[total - rank];
        note = `Pays to ${receiver ? receiver.name : 'Top'}`;
      }

      return { ...m, rank, payout, statusClass, outcomeCode, isTied, payoutNote: note, monthObj, monthGws };
    });

    // Progressive Tiebreaker detail calculation for month (strictly month data)
    resultManagers.forEach(m => {
      if (!m.isTied) {
        m.tiebreakerText = '';
        return;
      }
      const cohort = resultManagers.filter(x => x.netScore === m.netScore);
      const benchSet = new Set(cohort.map(x => x.bench));
      if (benchSet.size > 1) {
        m.tiebreakerText = `TB → Bench: ${m.bench}`;
        return;
      }

      const captSet = new Set(cohort.map(x => x.captain));
      if (captSet.size > 1) {
        m.tiebreakerText = `TB → Bench: ${m.bench} · Capt: ${m.captain}`;
        return;
      }

      const hitSet = new Set(cohort.map(x => x.hitCost));
      if (hitSet.size > 1) {
        m.tiebreakerText = `TB → Bench: ${m.bench} · Capt: ${m.captain} · Hits: ${m.hitCost}`;
        return;
      }
    });

    return resultManagers;
  }

  function getFormGuide(managerId) {
    if (state.currentGw <= 1) {
      return ['-'];
    }

    const form = [];
    const endGw = state.currentGw - 1;
    const startGw = Math.max(1, endGw - 4);
    for (let gw = startGw; gw <= endGw; gw++) {
      const standings = getGameweekStandings(gw);
      const m = standings.find(x => x.id === managerId);
      if (m && m.outcomeCode && m.outcomeCode !== '-') {
        form.push(m.outcomeCode);
      }
    }
    return form.length > 0 ? form : ['-'];
  }

  function getMonthlyFormGuide(managerId, monthGws) {
    const activeSeasonGw = state.seasonGw || state.maxGw || 1;
    const form = [];
    monthGws.forEach(gw => {
      if (gw <= activeSeasonGw) {
        const standings = getGameweekStandings(gw);
        const m = standings.find(x => x.id === managerId);
        if (m && m.outcomeCode && m.outcomeCode !== '-') {
          form.push(m.outcomeCode);
        }
      }
    });
    return form.length > 0 ? form : ['-'];
  }

  // ===================== LOADING & SYNC FRESHNESS =====================
  function showStandingsSkeleton() {
    const row = '<tr class="skeleton-row"><td colspan="8"><span class="skeleton"></span></td></tr>';
    if (elements.standingsBody) elements.standingsBody.innerHTML = row.repeat(6);
  }

  function updateSyncAgo() {
    const el = document.getElementById('syncAgo');
    if (!el) return;
    if (!state.lastSyncedAt) { el.textContent = ''; return; }
    const mins = Math.floor((Date.now() - state.lastSyncedAt) / 60000);
    el.textContent = mins < 1 ? 'Updated just now' : `Updated ${mins} min ago`;
    el.title = `Last refreshed ${new Date(state.lastSyncedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`;
  }

  function markSynced() {
    state.lastSyncedAt = Date.now();
    updateSyncAgo();
  }

  setInterval(updateSyncAgo, 30000);

  // ===================== RENDER ALL =====================
  function renderAll() {
    const hasData = state.dataset.managers && state.dataset.managers.length > 0;
    
    if (document.getElementById('section-gw-status')) {
      document.getElementById('section-gw-status').style.display = hasData ? 'block' : 'none';
    }
    if (document.getElementById('section-form-matrix')) {
      document.getElementById('section-form-matrix').style.display = hasData ? 'block' : 'none';
    }
    if (document.getElementById('section-fixtures')) {
      document.getElementById('section-fixtures').style.display = hasData ? 'block' : 'none';
    }
    if (document.getElementById('section-awards')) {
      document.getElementById('section-awards').style.display = hasData ? 'block' : 'none';
    }
    document.getElementById('section-standings').style.display = hasData ? 'block' : 'none';
    document.getElementById('section-performance').style.display = hasData ? 'block' : 'none';
    document.getElementById('section-trajectory').style.display = hasData ? 'block' : 'none';
    document.getElementById('section-empty').style.display = hasData ? 'none' : 'block';

    if (!hasData) return;

    state.renderedLeagueId = state.activeLeagueId;
    renderStandingsTable();
    renderGwStatus();
    renderSeasonMatrixTable();
    renderWinLossSummaryTable();
    renderChipTracker();
    updateChart();
    updatePerformanceChart();
    renderSeasonAwards();
  }

  // ===================== STANDINGS TABLE =====================
  function renderStandingsTable() {
    const isMonthlyView = Boolean(state.viewMode && state.viewMode !== 'overall');
    let standings = isMonthlyView ? getMonthlyStandings(state.viewMode) : getGameweekStandings(state.currentGw);
    
    if (!isMonthlyView && state.standingsSortColumn === 'seasonTotalNet') {
      standings = [...standings].sort((a, b) => {
        return state.standingsSortDir === 'desc'
          ? b.seasonTotalNet - a.seasonTotalNet
          : a.seasonTotalNet - b.seasonTotalNet;
      });
    }

    const monthObj = isMonthlyView
      ? (state.dataset.months ? state.dataset.months.find(m => m.name.toLowerCase() === state.viewMode.toLowerCase()) : null)
      : null;
    const activeMonthName = monthObj ? monthObj.name : (getCurrentGwMonth(state.currentGw)?.name || 'August');
    const monthGws = monthObj ? (monthObj.gws || []) : [];

    // Heading update
    const headingEl = document.getElementById('standingsSectionHeading');
    if (headingEl) {
      const curLeagueText = elements.leagueNameDisplay ? elements.leagueNameDisplay.textContent : (state.dataset.leagueName || 'Clash of Elite 2026-2027');
      if (isMonthlyView) {
        headingEl.innerHTML = `${activeMonthName} Standings &amp; Monthly Payouts — <span id="leagueNameDisplay" style="color: var(--pl-cyan);">${curLeagueText}</span>`;
      } else {
        headingEl.innerHTML = `Gameweek Standings &amp; Weekly Payouts — <span id="leagueNameDisplay" style="color: var(--pl-cyan);">${curLeagueText}</span>`;
      }
      elements.leagueNameDisplay = document.getElementById('leagueNameDisplay');
    }

    // Update GW/Standings Badge
    if (elements.standingsGwBadge) {
      if (isMonthlyView) {
        elements.standingsGwBadge.textContent = `${activeMonthName} Standings`;
      } else {
        elements.standingsGwBadge.textContent = `Gameweek ${state.currentGw}`;
      }
    }

    // Update Table Header (thead); column widths are left to the browser
    const standingsTable = document.getElementById('standingsTable');
    const theadEl = standingsTable ? standingsTable.querySelector('thead') : null;
    const colgroupEl = standingsTable ? standingsTable.querySelector('colgroup') : null;
    if (colgroupEl) colgroupEl.innerHTML = '';
    if (standingsTable) standingsTable.classList.toggle('show-aba', state.showAba);

    const abaTh = state.showAba
      ? '<th class="text-center aba-th" id="thAba" title="Click to hide ABA accounts">ABA</th>'
      : '<th class="aba-th is-hidden" id="thAba" title="Click to show ABA accounts" aria-label="Show ABA accounts"></th>';

    if (isMonthlyView) {
      if (theadEl) {
        const gwThs = monthGws.map(gw => `<th class="text-center">GW${gw}</th>`).join('');
        theadEl.innerHTML = `
          <tr>
            <th class="text-center">Pos</th>
            <th>Manager</th>
            ${abaTh}
            ${gwThs}
            <th class="text-center">Transfers</th>
            <th class="text-center">${activeMonthName} Pts</th>
            <th class="text-center">Chip</th>
            <th class="text-center">Form</th>
            <th class="text-center">Payout</th>
          </tr>
        `;
      }
    } else {
      const sortIconText = state.standingsSortColumn === 'seasonTotalNet'
        ? (state.standingsSortDir === 'desc' ? '▼' : '▲')
        : '⇅';
      const activeSortClass = state.standingsSortColumn === 'seasonTotalNet' ? ' active-sort' : '';

      if (theadEl) {
        theadEl.innerHTML = `
          <tr>
            <th class="text-center">Pos</th>
            <th>Manager</th>
            ${abaTh}
            <th class="text-center">Gross</th>
            <th class="text-center">Transfers</th>
            <th class="text-center" title="Net points = gross points minus transfer hits">Net Pts</th>
            <th class="text-center sortable-header${activeSortClass}" id="thSeasonPts" title="Click to sort by season points. Arrows show movement in the season table since last gameweek.">Season <span id="seasonPtsSortIcon" class="sort-icon">${sortIconText}</span></th>
            <th class="text-center">Chip</th>
            <th class="text-center">Form</th>
            <th class="text-center">Payout</th>
          </tr>
        `;
        const thSeasonPts = document.getElementById('thSeasonPts');
        if (thSeasonPts) {
          thSeasonPts.onclick = () => {
            if (state.standingsSortColumn !== 'seasonTotalNet') {
              state.standingsSortColumn = 'seasonTotalNet';
              state.standingsSortDir = 'desc';
            } else if (state.standingsSortDir === 'desc') {
              state.standingsSortDir = 'asc';
            } else {
              state.standingsSortColumn = null;
              state.standingsSortDir = 'desc';
            }
            renderStandingsTable();
          };
        }
      }
    }

    const thAba = document.getElementById('thAba');
    if (thAba) {
      thAba.onclick = () => {
        state.showAba = !state.showAba;
        try { localStorage.setItem('fpl_show_aba', state.showAba ? '1' : '0'); } catch (e) {}
        renderStandingsTable();
      };
    }

    elements.standingsBody.innerHTML = '';

    const motmTargetMonth = state.motmSelectedMonth || (isMonthlyView ? state.viewMode : (getCurrentGwMonth(state.currentGw)?.name || 'September'));
    const motmInfo = getMonthlyMotmLeader(motmTargetMonth);
    const activeMotmMonthName = motmInfo.activeMonth.name;
    const motsLeaders = getSeasonLeaders(state.currentGw);
    const isMotsTied = motsLeaders.length > 1;

    // Render MOTM Banner (Only when explicitly toggled on via MOTM button)
    const motmBannerContainer = document.getElementById('motmBannerContainer');
    if (motmBannerContainer) {
      if (state.showMotmBadge && motmInfo) {
        const bannerIcon = motmInfo.isFinalized ? icon('trophy', 18) : icon('clock', 18);
        let winnerContent = '';
        if (motmInfo.leaders && motmInfo.leaders.length > 0) {
          const names = motmInfo.leaders.map(l => l.name).join(' & ');
          const splitHtml = motmInfo.isTied ? ' <span class="motm-split-tag">(split the prize)</span>' : '';
          winnerContent = `<span class="motm-winner-name">${names}</span>${splitHtml}`;
        } else {
          winnerContent = `<span class="motm-split-tag">Upcoming (starts GW${motmInfo.startGw})</span>`;
        }

        motmBannerContainer.innerHTML = `
          <div class="motm-banner">
            <div class="motm-banner-content">
              <span class="motm-icon">${bannerIcon}</span>
              <span class="motm-title">${activeMotmMonthName} Manager of the Month:</span>
              ${winnerContent}
            </div>
          </div>
        `;

        if (elements.motmMonthSelect) {
          elements.motmMonthSelect.style.display = 'inline-block';
          elements.motmMonthSelect.value = activeMotmMonthName;
        }
      } else {
        motmBannerContainer.innerHTML = '';
        if (elements.motmMonthSelect) {
          elements.motmMonthSelect.style.display = 'none';
        }
      }
    }

    // Render MOTS Banner
    const motsBannerContainer = document.getElementById('motsBannerContainer');
    if (motsBannerContainer) {
      if (state.showMotsBadge && motsLeaders.length > 0 && !isMonthlyView) {
        const names = motsLeaders.map(l => l.name).join(' & ');
        const tiedText = isMotsTied ? ' (Tied)' : '';
        motsBannerContainer.innerHTML = `
          <div class="mots-banner">
            <div class="mots-banner-content">
              <span class="mots-icon">${icon('trophy', 20)}</span>
              <div class="mots-text-wrapper">
                <span class="mots-title">MANAGER OF THE SEASON${tiedText}</span>
                <span class="mots-winner-names">${names}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        motsBannerContainer.innerHTML = '';
      }
    }

    // Find highest points for the highlight
    const maxSeasonPts = isMonthlyView ? 0 : Math.max(...standings.map(m => m.seasonTotalNet || 0));
    const maxMonthPts = isMonthlyView ? Math.max(...standings.map(m => m.netScore || 0)) : 0;

    // Season-table movement since the previous gameweek
    const seasonRankNow = isMonthlyView ? {} : getSeasonRankMap(state.currentGw);
    const seasonRankPrev = isMonthlyView ? {} : getSeasonRankMap(state.currentGw - 1);

    // Rows whose rank or points changed since the last render of this same view
    // (i.e. a live sync updated them) get a brief highlight
    const snapshotKey = `${state.activeLeagueId}|${state.currentGw}|${state.viewMode}`;
    const previousSnapshot = state.standingsSnapshot && state.standingsSnapshot.key === snapshotKey
      ? state.standingsSnapshot.rows
      : null;
    const nextSnapshot = {};

    standings.forEach(m => {
      // --- Shared data ---
      const rankClass = getRankClass(m.rank, m.payout);
      const payoutBadge = payoutBadgeHtml(m.payout);

      const chipColorCls = getChipColorClass(m.chip);
      const chipColumnContent = m.chip
        ? `<span class="chip-tag ${chipColorCls}">${getChipLabel(m.chip)}</span>`
        : `<span class="cell-empty">–</span>`;

      const transferDisplay = m.hitCost > 0
        ? `<span class="cell-strong">${m.transfers}</span> <span class="hit-tag has-hit">(-${m.hitCost})</span>`
        : `<span class="cell-strong">${m.transfers}</span>`;

      const formGuide = isMonthlyView ? getMonthlyFormGuide(m.id, monthGws) : getFormGuide(m.id);
      const formHtml = formGuide.map(code => {
        if (code === '-') return `<span class="cell-empty">–</span>`;
        const cls = code === 'W' ? 'form-w' : code === 'L' ? 'form-l' : 'form-n';
        return `<span class="form-pill ${cls}">${code}</span>`;
      }).join('');

      const tiedPill = m.isTied ? `<span class="tied-pill">TIED</span>` : '';
      const tiebreakerDetail = m.isTied && m.tiebreakerText
        ? `<span class="tiebreaker-detail">${m.tiebreakerText}</span>`
        : '';

      const abaAccount = ABA_ACCOUNTS[m.id] || '';
      const abaTd = state.showAba
        ? `<td class="text-center">${abaAccount ? `<span class="aba-account-pill">${abaAccount}</span>` : '<span class="cell-empty">–</span>'}</td>`
        : '<td class="aba-td-hidden"></td>';

      const moveHtml = isMonthlyView ? '' : seasonMoveHtml(m.id, seasonRankNow, seasonRankPrev);

      // =========== DESKTOP TABLE ROW ===========
      const tr = document.createElement('tr');
      const rowSig = `${m.rank}|${m.netScore}|${m.seasonTotalNet}|${m.payout}`;
      nextSnapshot[m.id] = rowSig;
      const changed = previousSnapshot && previousSnapshot[m.id] !== undefined && previousSnapshot[m.id] !== rowSig;

      tr.className = m.statusClass + (m.isTied ? ' tr-tied' : '') + (changed ? ' row-flash' : '')
        + (state.activeModalManagerId === m.id ? ' is-viewing' : '');
      tr.dataset.managerId = m.id;
      tr.setAttribute('title', `Click to view ${m.name}'s squad details & stats`);
      tr.addEventListener('click', () => openManagerModal(m.id));

      const payoutTd = `
          <td class="text-center">
            <div class="payout-container">
              ${payoutBadge}
              <span class="payout-note">${m.payoutNote}</span>
            </div>
          </td>`;

      if (isMonthlyView) {
        const gwTds = monthGws.map(gw => {
          const scoreVal = (m.gwBreakdown && m.gwBreakdown[gw] !== undefined) ? m.gwBreakdown[gw] : '-';
          const scoreDisplay = scoreVal !== '-'
            ? `<span class="cell-strong">${scoreVal}</span>`
            : `<span class="cell-empty">–</span>`;
          return `<td class="text-center">${scoreDisplay}</td>`;
        }).join('');

        tr.innerHTML = `
          <td class="text-center"><div class="rank-num ${rankClass}">${m.rank}</div></td>
          <td>${managerCellHtml(m, tiedPill, tiebreakerDetail)}</td>
          ${abaTd}
          ${gwTds}
          <td class="text-center">${transferDisplay}</td>
          <td class="text-center">
            <span class="gw-score month-total-pts${m.netScore === maxMonthPts ? ' season-pts-top' : ''}" data-cur-val="${m.netScore}">${m.netScore}</span>
          </td>
          <td class="text-center">${chipColumnContent}</td>
          <td class="text-center"><div class="form-pill-container">${formHtml}</div></td>
          ${payoutTd}
        `;
      } else {
        tr.innerHTML = `
          <td class="text-center"><div class="rank-num ${rankClass}">${m.rank}</div></td>
          <td>${managerCellHtml(m, tiedPill, tiebreakerDetail)}</td>
          ${abaTd}
          <td class="text-center"><span class="cell-strong">${m.grossScore}</span></td>
          <td class="text-center">${transferDisplay}</td>
          <td class="text-center">
            <span class="gw-score" data-cur-val="${m.netScore}">${m.netScore}</span>
          </td>
          <td class="text-center">
            <div class="season-cell">
              <span class="season-pts${m.seasonTotalNet === maxSeasonPts ? ' season-pts-top' : ''}" data-cur-val="${m.seasonTotalNet}">${m.seasonTotalNet}</span>
              ${moveHtml}
            </div>
          </td>
          <td class="text-center">${chipColumnContent}</td>
          <td class="text-center"><div class="form-pill-container">${formHtml}</div></td>
          ${payoutTd}
        `;
      }
      elements.standingsBody.appendChild(tr);

      const gwScoreEl = tr.querySelector('.gw-score');
      const seasonPtsEl = tr.querySelector('.season-pts');
      if (gwScoreEl) animateNumber(gwScoreEl, m.netScore, 400);
      if (seasonPtsEl && !isMonthlyView) animateNumber(seasonPtsEl, m.seasonTotalNet, 400);

    });

    state.standingsSnapshot = { key: snapshotKey, rows: nextSnapshot };
  }

  function markViewingManager(managerId) {
    document.querySelectorAll('[data-manager-id]').forEach(el => {
      el.classList.toggle('is-viewing', managerId != null && Number(el.dataset.managerId) === Number(managerId));
    });
  }

  function getRankClass(rank, payout) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    if (payout < 0) return 'rank-bottom';
    return 'rank-neutral';
  }

  function payoutBadgeHtml(payout) {
    if (payout > 0) return `<span class="payout-badge payout-win">+$${payout}.00</span>`;
    if (payout < 0) return `<span class="payout-badge payout-loss">-$${Math.abs(payout)}.00</span>`;
    return `<span class="payout-badge payout-neutral">$0.00</span>`;
  }

  // ===================== WIN/LOSS TABLE =====================
  function getManagerSeasonSummary() {
    const managers = state.dataset.managers || [];
    const chipTypes = (state.dataset.chipTypes && state.dataset.chipTypes.length > 0)
      ? state.dataset.chipTypes
      : [
          "Wildcard 1", "Wildcard 2",
          "Free Hit 1", "Free Hit 2",
          "Bench Boost 1", "Bench Boost 2",
          "Triple Captain 1", "Triple Captain 2"
        ];

    const summary = managers.map(m => {
      let wins = 0, losses = 0, neutrals = 0, netEarnings = 0, totalNetPoints = 0;
      const chipsUsedMap = {};

      for (let gw = 1; gw <= state.currentGw; gw++) {
        const standings = getGameweekStandings(gw);
        const item = standings.find(x => x.id === m.id);
        if (item) {
          totalNetPoints += item.netScore;
          if (item.payout > 0) { wins++; netEarnings += item.payout; }
          else if (item.payout < 0) { losses++; netEarnings += item.payout; }
          else { neutrals++; }
        }
      }

      // Check all 38 gameweek slots for recorded chip usage
      if (state.dataset.gameweeks && Array.isArray(state.dataset.gameweeks)) {
        state.dataset.gameweeks.forEach(gwObj => {
          if (gwObj && gwObj.chipsUsed && gwObj.chipsUsed[m.id]) {
            const raw = String(gwObj.chipsUsed[m.id]).toLowerCase();
            const gNum = gwObj.gw;
            if (raw.includes('wildcard') || raw.includes('wc')) {
              if (gNum <= 19) chipsUsedMap['Wildcard 1'] = gNum;
              else chipsUsedMap['Wildcard 2'] = gNum;
              chipsUsedMap['Wildcard'] = gNum;
            } else if (raw.includes('freehit') || raw.includes('free hit') || raw.includes('fh')) {
              if (gNum <= 19) chipsUsedMap['Free Hit 1'] = gNum;
              else chipsUsedMap['Free Hit 2'] = gNum;
              chipsUsedMap['Free Hit'] = gNum;
            } else if (raw.includes('bboost') || raw.includes('bench boost') || raw.includes('bb')) {
              if (gNum <= 19) chipsUsedMap['Bench Boost 1'] = gNum;
              else chipsUsedMap['Bench Boost 2'] = gNum;
              chipsUsedMap['Bench Boost'] = gNum;
            } else if (raw.includes('3xc') || raw.includes('triple captain') || raw.includes('tc')) {
              if (gNum <= 19) chipsUsedMap['Triple Captain 1'] = gNum;
              else chipsUsedMap['Triple Captain 2'] = gNum;
              chipsUsedMap['Triple Captain'] = gNum;
            } else {
              chipsUsedMap[gwObj.chipsUsed[m.id]] = gNum;
            }
          }
        });
      }

      const winRate = state.currentGw > 0 ? ((wins / state.currentGw) * 100).toFixed(1) : '0.0';
      const chipsStatus = chipTypes.map(c => ({
        chipName: c,
        used: !!chipsUsedMap[c],
        usedGw: chipsUsedMap[c] || null,
        colorClass: getChipColorClass(c)
      }));

      return { ...m, wins, losses, neutrals, winRate, netEarnings, totalNetPoints, chipsStatus };
    });

    return summary.sort((a, b) => b.netEarnings - a.netEarnings || b.wins - a.wins || b.totalNetPoints - a.totalNetPoints);
  }

  // ===================== 38-GAMEWEEK FORM MATRIX =====================
  function renderSeasonMatrixTable() {
    const container = elements.seasonMatrixContainer || document.getElementById('seasonMatrixContainer');
    if (!container) return;

    if (elements.matrixLegendCurrent) {
      elements.matrixLegendCurrent.textContent = `GW${state.currentGw}`;
    }

    const summary = getManagerSeasonSummary();
    if (!summary || summary.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);">No season form data available.</div>';
      return;
    }

    // Precalculate standings for all played gameweeks up to currentGw
    const gwStandingsMap = {};
    for (let gw = 1; gw <= state.currentGw; gw++) {
      gwStandingsMap[gw] = getGameweekStandings(gw);
    }

    // Build Table Header (GW1 to GW38)
    let theadGwCols = '';
    for (let gw = 1; gw <= 38; gw++) {
      const isCurrent = (gw === state.currentGw);
      const isPast = (gw < state.currentGw);
      const headerClass = isCurrent ? 'matrix-th-current' : (isPast ? 'matrix-th-past' : 'matrix-th-future');
      theadGwCols += `<th class="matrix-gw-th ${headerClass}">GW${gw}</th>`;
    }

    let tbodyRows = '';
    summary.forEach((m, idx) => {
      const pos = idx + 1;
      let rankClass = 'rank-neutral';
      if (pos === 1) rankClass = 'rank-1';
      else if (pos === 2) rankClass = 'rank-2';
      else if (pos === 3) rankClass = 'rank-3';

      let gwCells = '';
      for (let gw = 1; gw <= 38; gw++) {
        const isCurrent = (gw === state.currentGw);
        const isPast = (gw <= state.currentGw);
        const cellClass = isCurrent ? 'matrix-td-current' : '';

        if (isPast) {
          const standings = gwStandingsMap[gw] || [];
          const item = standings.find(x => x.id === m.id);
          if (item && item.netScore !== undefined) {
            let pillClass = 'form-n';

            if (item.payout > 0) {
              pillClass = 'form-w';
            } else if (item.payout < 0) {
              pillClass = 'form-l';
            }

            gwCells += `
              <td class="matrix-gw-td ${cellClass}">
                <span class="matrix-score-tile ${pillClass}">${item.netScore}</span>
              </td>
            `;
          } else {
            gwCells += `<td class="matrix-gw-td ${cellClass}"><span class="matrix-score-future">-</span></td>`;
          }
        } else {
          gwCells += `
            <td class="matrix-gw-td matrix-td-future">
              <span class="matrix-score-future">-</span>
            </td>
          `;
        }
      }

      tbodyRows += `
        <tr class="matrix-row" onclick="openManagerModal(${m.id})">
          <td class="sticky-col-pos text-center"><div class="rank-num ${rankClass}">${pos}</div></td>
          <td class="sticky-col-manager">${managerCellHtml(m)}</td>
          ${gwCells}
        </tr>
      `;
    });

    container.innerHTML = `
      <table class="custom-table matrix-table">
        <thead>
          <tr>
            <th class="sticky-col-pos text-center" style="width:48px;">Pos</th>
            <th class="sticky-col-manager" style="min-width:185px;">Manager & Team</th>
            ${theadGwCols}
          </tr>
        </thead>
        <tbody>
          ${tbodyRows}
        </tbody>
      </table>
    `;
  }

  function renderWinLossSummaryTable() {
    const summary = getManagerSeasonSummary();
    if (!elements.winLossTableContainer) return;

    let html = `
      <table class="custom-table">
        <thead>
          <tr>
            <th class="text-center" style="width:50px;">Pos</th>
            <th>Manager & Team</th>
            <th class="text-center">Wins</th>
            <th class="text-center">Losses</th>
            <th class="text-center">Neutrals</th>
            <th class="text-center">Win Rate</th>
            <th class="text-center">Total Net Pts</th>
            <th class="text-right">Net Payout</th>
          </tr>
        </thead>
        <tbody>
    `;

    const maxPts = Math.max(...summary.map(s => s.totalNetPoints));

    summary.forEach((m, idx) => {
      const pos = idx + 1;
      let rankClass = 'rank-neutral';
      if (pos === 1) rankClass = 'rank-1';
      else if (pos === 2) rankClass = 'rank-2';
      else if (pos === 3) rankClass = 'rank-3';

      let earnClass = 'payout-neutral', earnText = '$0.00';
      if (m.netEarnings > 0) { earnClass = 'payout-win'; earnText = `+$${m.netEarnings}.00`; }
      else if (m.netEarnings < 0) { earnClass = 'payout-loss'; earnText = `-$${Math.abs(m.netEarnings)}.00`; }

      const isTopPts = m.totalNetPoints === maxPts;
      const ptsStyle = isTopPts ? 'class="season-pts-top"' : 'style="font-weight:700;color:var(--text-secondary);"';

      html += `
        <tr>
          <td class="text-center"><div class="rank-num ${rankClass}">${pos}</div></td>
          <td>${managerCellHtml(m)}</td>
          <td class="text-center"><span class="stat-pill win">${m.wins} W</span></td>
          <td class="text-center"><span class="stat-pill loss">${m.losses} L</span></td>
          <td class="text-center"><span class="stat-pill neu">${m.neutrals} N</span></td>
          <td class="text-center"><span class="cell-strong">${m.winRate}%</span></td>
          <td class="text-center"><span ${ptsStyle}>${m.totalNetPoints}</span></td>
          <td class="text-right"><span class="payout-badge ${earnClass}">${earnText}</span></td>
        </tr>
      `;
    });

    html += '</tbody></table>';
    elements.winLossTableContainer.innerHTML = html;
  }

  // ===================== CHIP TRACKER =====================
  function renderChipTracker() {
    const managerData = getManagerSeasonSummary();
    const container = elements.chipTrackerContainer;
    if (!container) return;

    // Columns: first-half set then second-half set, matched to each manager's chip list by label
    const columns = ['WC 1', 'FH 1', 'BB 1', 'TC 1', 'WC 2', 'FH 2', 'BB 2', 'TC 2'];
    const fullNames = { WC: 'Wildcard', FH: 'Free Hit', BB: 'Bench Boost', TC: 'Triple Captain' };
    const head = columns.map((c, i) => {
      const [code, set] = c.split(' ');
      return `<th class="text-center${i === 4 ? ' chip-half' : ''}">${fullNames[code]} ${set}</th>`;
    }).join('');

    const rows = managerData.map(m => {
      const byLabel = {};
      m.chipsStatus.forEach(c => { byLabel[getChipLabel(c.chipName)] = c; });
      const left = m.chipsStatus.filter(c => !c.used).length;
      const cells = columns.map((label, i) => {
        const c = byLabel[label];
        const cls = i === 4 ? ' class="text-center chip-half"' : ' class="text-center"';
        return c && c.used
          ? `<td${cls}><span class="chip-tag ${c.colorClass}">GW${c.usedGw}</span></td>`
          : `<td${cls}><span class="chip-tag chip-unused">${label}</span></td>`;
      }).join('');
      return `
        <tr>
          <td>
            <div class="manager-info">
              <span class="manager-name">${m.name}</span>
              <span class="team-name">${m.teamName}</span>
            </div>
          </td>
          ${cells}
          <td class="text-center"><span class="chip-left">${left}</span></td>
        </tr>`;
    }).join('');

    container.innerHTML = `
      <div class="table-wrap">
        <table class="custom-table chip-matrix">
          <thead><tr><th>Manager</th>${head}<th class="text-center">Left</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="chip-matrix-note">First-half chips (1) expire after GW19 · second-half chips (2) unlock at GW20</p>
    `;
  }

  // ===================== GAMEWEEK STATUS =====================
  // Built from FPL's own data: the gameweek's fixtures (scores, live minutes,
  // finished flags), the event-status feed (live / bonus per matchday, league
  // tables) and the gameweek's finished / data_checked flags.
  const statusFixtureRequests = {};

  function fixturesForGw(gw) {
    const cached = state.fixturesByGw && state.fixturesByGw[gw];
    if (cached) return cached;
    const loaded = state.fixtures || (state.dataset && state.dataset.fixtures);
    if (Array.isArray(loaded) && loaded.length && loaded.every(f => Number(f.event) === Number(gw))) return loaded;
    return null;
  }

  function loadFixturesForGw(gw) {
    if (statusFixtureRequests[gw]) return;
    statusFixtureRequests[gw] = fetchFplWithTimeout(`https://fantasy.premierleague.com/api/fixtures/?event=${gw}`, 8000)
      .then(data => {
        if (Array.isArray(data)) {
          state.fixturesByGw = Object.assign({}, state.fixturesByGw, { [gw]: data });
          if (state.currentGw === gw) renderGwStatus();
        } else {
          statusFixtureRequests[gw] = null;
        }
      })
      .catch(() => { statusFixtureRequests[gw] = null; });
  }

  function teamById(id) {
    const t = getTeamsMap()[id] || getTeamsMap()[String(id)];
    return t || { short_name: '?', code: null };
  }

  function crestHtml(team) {
    return team.code
      ? `<img class="gs-crest" src="https://resources.premierleague.com/premierleague/badges/70/t${team.code}.png" alt="" loading="lazy" onerror="this.style.visibility='hidden'">`
      : '<span class="gs-crest"></span>';
  }

  function fixtureState(f) {
    if (f.finished) return 'final';
    if (f.finished_provisional) return 'ft';
    if (f.started) return 'live';
    return 'upcoming';
  }

  function renderGwStatus() {
    const container = document.getElementById('gwSpotlightContainer');
    if (!container) return;
    const gw = state.currentGw || 1;
    const es = (state.eventStatuses || {})[gw] || {};
    const fixtures = fixturesForGw(gw);

    if (!fixtures) {
      container.innerHTML = `<div class="gs-empty">Loading Gameweek ${gw} fixtures…</div>`;
      loadFixturesForGw(gw);
      return;
    }

    const isFinal = Boolean(es.finished && es.data_checked);
    const total = fixtures.length;
    const states = fixtures.map(fixtureState);
    const done = states.filter(x => x === 'ft' || x === 'final').length;
    const live = states.filter(x => x === 'live').length;
    const anyStarted = states.some(x => x !== 'upcoming');

    // Matchdays as FPL counts them (UK date of kick-off), with FPL's per-day status
    const daily = Array.isArray(es.daily_status) ? es.daily_status : [];
    const dayKey = f => (f.kickoff_time || '').slice(0, 10);
    const days = [...new Set(fixtures.map(dayKey))].filter(Boolean).sort();
    const bonusDays = days.filter(d => (daily.find(x => x.date === d) || {}).bonus_added).length;
    const allBonus = isFinal || es.finished || (daily.length > 0 && done === total && bonusDays === days.length);
    const leagues = String(es.leagues || '').toLowerCase();
    const tablesDone = isFinal || es.finished || (allBonus && leagues === 'updated');

    const step = (state_, title, detail) => ({ state: state_, title, detail });
    const steps = [
      step(done === total ? 'done' : (anyStarted ? 'active' : 'wait'), 'Matches',
        `${done} of ${total} finished${live ? ` · ${live} live` : ''}`),
      step(allBonus ? 'done' : (bonusDays > 0 || done > 0 ? 'active' : 'wait'), 'Bonus points',
        allBonus ? 'Added' : (days.length ? `Added for ${bonusDays} of ${days.length} days` : 'Waiting')),
      step(tablesDone ? 'done' : (leagues === 'updating' ? 'active' : 'wait'), 'League tables',
        tablesDone ? 'Updated' : (leagues === 'updating' ? 'Updating…' : 'After bonus is added')),
      step(isFinal ? 'done' : 'wait', 'Final', isFinal ? 'Confirmed by FPL' : 'After FPL checks the data')
    ];

    let pill = { cls: 'is-wait', text: 'Upcoming' };
    if (isFinal) pill = { cls: 'is-done', text: 'Final' };
    else if (live) pill = { cls: 'is-live', text: 'Live' };
    else if (done === total && total) pill = { cls: 'is-active', text: allBonus ? 'Updating tables' : 'Waiting for bonus' };
    else if (anyStarted) pill = { cls: 'is-active', text: 'In progress' };

    const stepIcon = st => st === 'done' ? icon('check', 13) : (st === 'active' ? '<span class="gs-spinner"></span>' : '');
    const stepsHtml = steps.map((st, i) => `
      <li class="gs-step is-${st.state}">
        <span class="gs-step-dot">${stepIcon(st.state) || i + 1}</span>
        <span class="gs-step-text"><strong>${st.title}</strong><span>${st.detail}</span></span>
      </li>`).join('');

    const timeFmt = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const daysHtml = days.map(d => {
      const dayFixtures = fixtures.filter(f => dayKey(f) === d).sort((x, y) => x.kickoff_time.localeCompare(y.kickoff_time));
      const ds = daily.find(x => x.date === d) || {};
      const dayStates = dayFixtures.map(fixtureState);
      let tag;
      if (isFinal || dayStates.every(x => x === 'final')) tag = { cls: 'is-done', text: 'Final' };
      else if (ds.bonus_added) tag = { cls: 'is-done', text: 'Bonus added' };
      else if (dayStates.includes('live')) tag = { cls: 'is-live', text: 'Live' };
      else if (dayStates.every(x => x === 'ft' || x === 'final')) tag = { cls: 'is-active', text: 'Bonus pending' };
      else if (dayStates.some(x => x !== 'upcoming')) tag = { cls: 'is-active', text: 'In progress' };
      else tag = { cls: 'is-wait', text: 'Upcoming' };

      const label = new Date(`${d}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'UTC' });
      const rows = dayFixtures.map(f => {
        const h = teamById(f.team_h), a = teamById(f.team_a);
        const st = fixtureState(f);
        const score = st === 'upcoming'
          ? `<span class="gs-kickoff">${timeFmt(new Date(f.kickoff_time))}</span>`
          : `<span class="gs-score">${f.team_h_score ?? 0}<i>–</i>${f.team_a_score ?? 0}</span>`;
        const status = st === 'live' ? `<span class="gs-mstate is-live"><span class="live-dot"></span>${f.minutes || 0}'</span>`
          : st === 'ft' ? '<span class="gs-mstate is-active">FT</span>'
          : st === 'final' ? '<span class="gs-mstate is-done">FT</span>'
          : '<span class="gs-mstate is-wait">Kick-off</span>';
        return `
          <li class="gs-match is-${st}" data-fixture-id="${f.id}" role="button" tabindex="0" title="See match details">
            <span class="gs-team gs-home">${h.short_name}${crestHtml(h)}</span>
            ${score}
            <span class="gs-team gs-away">${crestHtml(a)}${a.short_name}</span>
            ${status}
          </li>`;
      }).join('');
      return `
        <section class="gs-day">
          <header class="gs-day-head"><strong>${label}</strong><span class="gs-tag ${tag.cls}">${tag.text}</span></header>
          <ul class="gs-matches">${rows}</ul>
        </section>`;
    }).join('');

    const pct = total ? Math.round((done / total) * 100) : 0;
    const updated = state.lastSyncedAt ? ` · Updated ${timeFmt(new Date(state.lastSyncedAt))}` : '';
    container.innerHTML = `
      <div class="gs">
        <div class="gs-head">
          <div>
            <div class="gs-title">Gameweek ${gw}</div>
            <div class="gs-sub">${done} of ${total} matches finished${updated}</div>
          </div>
          <span class="gs-pill ${pill.cls}">${pill.text}</span>
        </div>
        <div class="gs-progress" aria-hidden="true"><span style="width:${pct}%"></span></div>
        <ol class="gs-steps">${stepsHtml}</ol>
        <div class="gs-days">${daysHtml}</div>
      </div>`;

    container.onclick = e => {
      const row = e.target.closest('[data-fixture-id]');
      if (row) showMatchDetail(Number(row.dataset.fixtureId));
    };
    container.onkeydown = e => {
      const row = e.target.closest('[data-fixture-id]');
      if (row && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showMatchDetail(Number(row.dataset.fixtureId)); }
    };
  }

  // ===================== MATCH DETAIL POP-UP =====================
  // Uses the stats FPL attaches to each fixture (goals, assists, cards, saves,
  // bonus, BPS …); player names come from the bootstrap player list.
  // Classic match-event icons (inline SVG): a real football (pentagon panels),
  // a football boot for assists, referee cards, and P badges for penalties
  const MATCH_ICONS = {
    goal: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="mdBall"><circle cx="12" cy="12" r="10.4"/></clipPath></defs><circle cx="12" cy="12" r="10.4" style="fill:#ffffff"/><g clip-path="url(#mdBall)" style="fill:var(--md-ball-ink)"><path d="M12.00 8.40 L15.42 10.89 L14.12 14.91 L9.88 14.91 L8.58 10.89Z"/><path d="M12.00 5.10 L8.86 2.82 L10.06 -0.87 L13.94 -0.87 L15.14 2.82Z M18.56 9.87 L19.76 6.18 L23.64 6.18 L24.84 9.87 L21.70 12.15Z M16.06 17.58 L19.94 17.58 L21.13 21.27 L18.00 23.55 L14.86 21.27Z M7.94 17.58 L9.14 21.27 L6.00 23.55 L2.87 21.27 L4.06 17.58Z M5.44 9.87 L2.30 12.15 L-0.84 9.87 L0.36 6.18 L4.24 6.18Z"/></g><path d="M12.00 8.40 L12.00 5.10 M15.42 10.89 L18.56 9.87 M14.12 14.91 L16.06 17.58 M9.88 14.91 L7.94 17.58 M8.58 10.89 L5.44 9.87" style="stroke:var(--md-ball-ink)" stroke-width="1.1" fill="none"/><circle cx="12" cy="12" r="10.4" fill="none" style="stroke:var(--md-ball-ink)" stroke-width="1.2"/></svg>',
    ownGoal: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><defs><clipPath id="mdBall"><circle cx="12" cy="12" r="10.4"/></clipPath></defs><circle cx="12" cy="12" r="10.4" style="fill:#fde8ef"/><g clip-path="url(#mdBall)" style="fill:#c4003f"><path d="M12.00 8.40 L15.42 10.89 L14.12 14.91 L9.88 14.91 L8.58 10.89Z"/><path d="M12.00 5.10 L8.86 2.82 L10.06 -0.87 L13.94 -0.87 L15.14 2.82Z M18.56 9.87 L19.76 6.18 L23.64 6.18 L24.84 9.87 L21.70 12.15Z M16.06 17.58 L19.94 17.58 L21.13 21.27 L18.00 23.55 L14.86 21.27Z M7.94 17.58 L9.14 21.27 L6.00 23.55 L2.87 21.27 L4.06 17.58Z M5.44 9.87 L2.30 12.15 L-0.84 9.87 L0.36 6.18 L4.24 6.18Z"/></g><path d="M12.00 8.40 L12.00 5.10 M15.42 10.89 L18.56 9.87 M14.12 14.91 L16.06 17.58 M9.88 14.91 L7.94 17.58 M8.58 10.89 L5.44 9.87" style="stroke:#c4003f" stroke-width="1.1" fill="none"/><circle cx="12" cy="12" r="10.4" fill="none" style="stroke:#c4003f" stroke-width="1.2"/></svg>',
    assist: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.6 6.6c0-.6.5-1.1 1.1-1.1h4.7c.5 0 1 .4 1.1.9l.7 3.6c.2 1 1 1.8 2 2l6.3 1.5c1.7.4 2.9 1.9 2.9 3.6v.6H2.6z" style="fill:var(--md-boot)"/><rect x="2.6" y="17.3" width="18.8" height="2" rx="0.9" fill="#00c46a"/><path d="M4.6 19.3v1.6M9 19.3v1.6M13.4 19.3v1.6M17.8 19.3v1.6" stroke="#00c46a" stroke-width="1.4" stroke-linecap="round"/><path d="M11.4 11.7l1.6-1.3M13.7 12.3l1.6-1.3M16 12.8l1.6-1.3" stroke="#fff" stroke-width="1" stroke-linecap="round"/></svg>',
    yellow: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(8 12 12)"><rect x="6.5" y="3.5" width="11" height="16" rx="1.8" fill="#ffd21f"/><rect x="6.5" y="3.5" width="11" height="16" rx="1.8" fill="none" stroke="#d9a800" stroke-width="0.9"/><rect x="8" y="5" width="8" height="2.2" rx="1" fill="#fff" opacity="0.35"/></g></svg>',
    red: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><g transform="rotate(8 12 12)"><rect x="6.5" y="3.5" width="11" height="16" rx="1.8" fill="#e8202a"/><rect x="6.5" y="3.5" width="11" height="16" rx="1.8" fill="none" stroke="#a8151a" stroke-width="0.9"/><rect x="8" y="5" width="8" height="2.2" rx="1" fill="#fff" opacity="0.35"/></g></svg>',
    penSaved: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="6" fill="#e6f8ee"/><text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="800" fill="#0a7a3e" font-family="Inter, sans-serif">P</text></svg>',
    penMissed: '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="2.5" width="19" height="19" rx="6" fill="#fde8ef"/><text x="12" y="16.4" text-anchor="middle" font-size="12" font-weight="800" fill="#c4003f" font-family="Inter, sans-serif">P</text><path d="M6 18L18 6" stroke="#c4003f" stroke-width="1.6" stroke-linecap="round"/></svg>'
  };

  // [FPL stat, icon, label shown in the tooltip / legend]
  const MATCH_EVENTS = [
    ['goals_scored', 'goal', 'Goal'],
    ['own_goals', 'ownGoal', 'Own goal'],
    ['assists', 'assist', 'Assist'],
    ['penalties_saved', 'penSaved', 'Penalty saved'],
    ['penalties_missed', 'penMissed', 'Penalty missed'],
    ['yellow_cards', 'yellow', 'Yellow card'],
    ['red_cards', 'red', 'Red card']
  ];

  function playerName(id) {
    const p = (state.dataset.players || {})[id] || (state.dataset.players || {})[String(id)];
    return p ? p.web_name : `Player #${id}`;
  }

  // One line per player per event type: name with the icon repeated per occurrence
  function sideEventsHtml(f, side) {
    const stat = key => ((f.stats || []).find(x => x.identifier === key) || {})[side] || [];
    const items = [];
    MATCH_EVENTS.forEach(([key, ico, label]) => {
      stat(key).forEach(x => {
        const icons = Array.from({ length: Math.min(x.value || 1, 4) }, () => MATCH_ICONS[ico]).join('');
        items.push(`<li class="md-event" title="${label}${x.value > 1 ? ` ×${x.value}` : ''}"><span class="md-icons">${icons}</span><span class="md-name">${playerName(x.element)}</span></li>`);
      });
    });
    return items.length ? `<ul class="md-events md-${side === 'h' ? 'home' : 'away'}">${items.join('')}</ul>` : '<div class="md-none">No events</div>';
  }

  // ===================== PREMIER LEAGUE MATCH-CENTRE DATA =====================
  // Line-ups, events with minutes and team stats come from the Premier League's
  // own data service through the relay's /pl routes; FPL fixtures are paired
  // with Premier League fixtures by their home and away club codes.
  function plBase() {
    try {
      const override = localStorage.getItem('fpl_pl_base');
      if (override) return override.replace(/\/+$/, '');
    } catch (e) {}
    return `${fplProxyBase()}/pl`;
  }

  async function plFetch(path, timeoutMs = 10000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`${plBase()}${path}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally {
      clearTimeout(timer);
    }
  }

  let plSeasonIndexPromise = null;
  function plSeasonIndex() {
    if (!plSeasonIndexPromise) {
      plSeasonIndexPromise = (async () => {
        const seasons = await plFetch('/compseasons');
        const seasonId = Math.round(seasons.content[0].id);
        const season = await plFetch(`/season/${seasonId}`);
        const index = { _seasonId: seasonId };
        season.content.forEach(f => {
          const [home, away] = f.teams.map(t => t.team.club.abbr);
          index[`${home}-${away}`] = Math.round(f.id);
        });
        return index;
      })().catch(err => { plSeasonIndexPromise = null; throw err; });
    }
    return plSeasonIndexPromise;
  }

  // Each club's current manager, keyed by club code (e.g. SUN -> Régis Le Bris)
  let plManagersPromise = null;
  function plManagers(seasonId) {
    if (!plManagersPromise) {
      plManagersPromise = plFetch(`/managers/${seasonId}`)
        .then(data => {
          const byClub = {};
          (data.content || []).forEach(o => {
            const abbr = o.currentTeam && o.currentTeam.club && o.currentTeam.club.abbr;
            if (o.role === 'Manager' && abbr && o.name) byClub[abbr] = o.name.display;
          });
          return byClub;
        })
        .catch(() => { plManagersPromise = null; return {}; });
    }
    return plManagersPromise;
  }

  async function plMatchFor(f) {
    const index = await plSeasonIndex();
    const id = index[`${teamById(f.team_h).short_name}-${teamById(f.team_a).short_name}`];
    if (!id) throw new Error('Match not found');
    const [fixture, stats, managers] = await Promise.all([
      plFetch(`/fixture/${id}`),
      plFetch(`/stats/${id}`).catch(() => null),
      plManagers(index._seasonId)
    ]);
    return { id, fixture, stats, managers };
  }

  // Every FPL fixture of the season, for the league table (refreshed each minute)
  let allFixturesCache = { at: 0, data: null, promise: null };
  function loadAllFixtures() {
    if (allFixturesCache.data && Date.now() - allFixturesCache.at < 60000) return Promise.resolve(allFixturesCache.data);
    if (!allFixturesCache.promise) {
      allFixturesCache.promise = fetchFplWithTimeout('https://fantasy.premierleague.com/api/fixtures/', 12000)
        .then(data => {
          allFixturesCache.promise = null;
          if (!Array.isArray(data)) throw new Error('No fixtures');
          allFixturesCache = { at: Date.now(), data, promise: null };
          return data;
        })
        .catch(err => { allFixturesCache.promise = null; throw err; });
    }
    return allFixturesCache.promise;
  }

  // ===================== MATCH CENTRE POP-UP =====================
  const MATCH_TABS = [['events', 'Events'], ['lineups', 'Line-ups'], ['stats', 'Stats'], ['table', 'Table']];
  let matchCentre = null; // { fixtureId, tab, pl, plError, fixtures, tableError }

  window.closeMatchDetail = function() {
    const el = document.getElementById('matchDetail');
    if (el) el.remove();
    matchCentre = null;
  };

  window.setMatchTab = function(tab) {
    if (!matchCentre) return;
    matchCentre.tab = tab;
    renderMatchCentre();
  };

  window.showMatchDetail = function(fixtureId) {
    const el = document.getElementById('matchDetail');
    if (el) el.remove();
    matchCentre = { fixtureId, tab: 'events', pl: null, plError: false, fixtures: null, tableError: false };

    const overlay = document.createElement('div');
    overlay.id = 'matchDetail';
    overlay.className = 'md-overlay';
    overlay.innerHTML = '<div class="md-card" role="dialog"></div>';
    overlay.addEventListener('click', e => { if (e.target === overlay) closeMatchDetail(); });
    document.body.appendChild(overlay);
    renderMatchCentre();

    const f = currentMatchFixture();
    if (!f) return;
    plMatchFor(f)
      .then(pl => { if (matchCentre && matchCentre.fixtureId === fixtureId) { matchCentre.pl = pl; renderMatchCentre(); } })
      .catch(() => { if (matchCentre && matchCentre.fixtureId === fixtureId) { matchCentre.plError = true; renderMatchCentre(); } });
    loadAllFixtures()
      .then(data => { if (matchCentre && matchCentre.fixtureId === fixtureId) { matchCentre.fixtures = data; if (matchCentre.tab === 'table') renderMatchCentre(); } })
      .catch(() => { if (matchCentre && matchCentre.fixtureId === fixtureId) { matchCentre.tableError = true; if (matchCentre.tab === 'table') renderMatchCentre(); } });
  };

  // Live sync: pull fresh Premier League data for an open match centre
  function refreshMatchCentre() {
    const f = currentMatchFixture();
    if (!f) return;
    const id = matchCentre.fixtureId;
    renderMatchCentre();
    if (fixtureState(f) === 'live' || fixtureState(f) === 'ft') {
      plMatchFor(f).then(pl => { if (matchCentre && matchCentre.fixtureId === id) { matchCentre.pl = pl; renderMatchCentre(); } }).catch(() => {});
    }
  }

  function currentMatchFixture() {
    return matchCentre ? (fixturesForGw(state.currentGw) || []).find(x => x.id === matchCentre.fixtureId) : null;
  }

  function renderMatchCentre() {
    const card = document.querySelector('#matchDetail .md-card');
    const f = currentMatchFixture();
    if (!card || !f) return;
    const h = teamById(f.team_h), a = teamById(f.team_a);
    const st = fixtureState(f);
    const kickoff = new Date(f.kickoff_time);
    const when = kickoff.toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    const plFix = matchCentre.pl && matchCentre.pl.fixture;
    const statusText = st === 'live' ? `<span class="gs-mstate is-live"><span class="live-dot"></span>Live ${plFix && plFix.clock ? plFix.clock.label.replace(/'00$/, "'") : `${f.minutes || 0}'`}</span>`
      : st === 'ft' ? '<span class="gs-mstate is-active">Full time · bonus pending</span>'
      : st === 'final' ? '<span class="gs-mstate is-done">Full time</span>'
      : '<span class="gs-mstate is-wait">Not started</span>';
    const venue = plFix && plFix.ground ? ` · ${plFix.ground.name}` : '';

    card.setAttribute('aria-label', `${h.name || h.short_name} v ${a.name || a.short_name}`);
    card.innerHTML = `
      <button class="icon-btn md-close" aria-label="Close match details" onclick="closeMatchDetail()">${icon('x', 14)}</button>
      <div class="md-head">
        <div class="md-team">${crestHtml(h)}<strong>${h.name || h.short_name}</strong></div>
        <div class="md-centre">
          ${st === 'upcoming'
            ? `<div class="md-kickoff">${kickoff.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>`
            : `<div class="md-score">${f.team_h_score ?? 0}<i>–</i>${f.team_a_score ?? 0}</div>`}
          ${statusText}
          <div class="md-when">Gameweek ${f.event} · ${when}${venue}</div>
        </div>
        <div class="md-team">${crestHtml(a)}<strong>${a.name || a.short_name}</strong></div>
      </div>
      <nav class="md-tabs" role="tablist">
        ${MATCH_TABS.map(([key, label]) => `<button role="tab" class="md-tab${matchCentre.tab === key ? ' is-on' : ''}" aria-selected="${matchCentre.tab === key}" onclick="setMatchTab('${key}')">${label}</button>`).join('')}
      </nav>
      <div class="md-body">${matchTabHtml(f, h, a, st, when)}</div>`;
  }

  function matchTabHtml(f, h, a, st, when) {
    const tab = matchCentre.tab;
    if (tab === 'table') return tableTabHtml(f);
    if (st === 'upcoming' && tab !== 'lineups') {
      return `<div class="md-empty">${icon('clock', 16)} Kick-off ${when}. ${tab === 'stats' ? 'Stats' : 'Match events'} appear once it starts.</div>`;
    }
    const pl = matchCentre.pl;
    if (!pl) {
      if (matchCentre.plError) {
        return tab === 'events'
          ? `${fplEventsHtml(f, h, a, st)}<div class="md-note">Minute-by-minute details are unavailable right now.</div>`
          : '<div class="md-empty">These details are unavailable right now. Try again in a minute.</div>';
      }
      return '<div class="md-empty"><span class="gs-spinner"></span> Loading match centre…</div>';
    }
    if (tab === 'events') return plEventsHtml(pl.fixture, f, h, a, st);
    if (tab === 'lineups') return lineupsTabHtml(pl.fixture, pl.managers || {});
    if (tab === 'stats') return statsTabHtml(pl);
    return '';
  }

  // ---- Events tab ----
  function clockLabel(e) {
    return e.clock && e.clock.label ? e.clock.label.replace(/'00$/, "'").replace(/^0(\d)/, '$1') : '';
  }

  function plPeople(fixture) {
    const people = {};
    (fixture.teamLists || []).forEach(tl => [...(tl.lineup || []), ...(tl.substitutes || [])].forEach(p => {
      people[p.id] = p;
    }));
    return people;
  }

  const SUB_ICON = '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 20V6M4 10l4-4 4 4" stroke="#0a7a3e" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 4v14M12 14l4 4 4-4" stroke="#c4003f" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SECOND_YELLOW_ICON = '<svg class="md-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="3.5" width="10" height="14.5" rx="1.6" fill="#ffd21f" transform="rotate(-8 9.5 10.75)"/><rect x="9.5" y="6" width="10" height="14.5" rx="1.6" fill="#e8202a" transform="rotate(8 14.5 13.25)"/></svg>';

  function plEventsHtml(fixture, f, h, a, st) {
    const people = plPeople(fixture);
    const name = id => (people[id] && people[id].name && people[id].name.display) || '';
    const homeTeamId = fixture.teams && fixture.teams[0] && fixture.teams[0].team.id;
    const events = [...(fixture.events || [])].sort((x, y) => ((x.time && x.time.millis) || 0) - ((y.time && y.time.millis) || 0));

    const rows = [];
    let prev = { homeScore: 0, awayScore: 0 };
    for (let i = 0; i < events.length; i++) {
      const e = events[i];
      const side = e.teamId === homeTeamId ? 'home' : 'away';
      if (e.type === 'G' || e.type === 'P' || e.type === 'O') {
        const sc = e.score || prev;
        const scoringSide = sc.homeScore > prev.homeScore ? 'home' : (sc.awayScore > prev.awayScore ? 'away' : side);
        prev = sc;
        const tag = e.type === 'P' ? ' <span class="md-ev-tag">pen</span>' : (e.type === 'O' ? ' <span class="md-ev-tag">og</span>' : '');
        rows.push({ side: scoringSide, clock: clockLabel(e), icon: e.type === 'O' ? MATCH_ICONS.ownGoal : MATCH_ICONS.goal, main: `${name(e.personId)}${tag}`, sub: e.assistId ? `Assist: ${name(e.assistId)}` : '', score: `${sc.homeScore}–${sc.awayScore}`, strong: true });
      } else if (e.type === 'B') {
        const ic = e.description === 'R' ? MATCH_ICONS.red : (e.description === 'YR' ? SECOND_YELLOW_ICON : MATCH_ICONS.yellow);
        rows.push({ side, clock: clockLabel(e), icon: ic, main: name(e.personId), sub: e.description === 'YR' ? 'Second yellow' : '' });
      } else if (e.type === 'S' && e.description === 'ON') {
        const off = events.find((x, j) => j !== i && x.type === 'S' && x.description === 'OFF' && x.teamId === e.teamId && clockLabel(x) === clockLabel(e) && !x._paired);
        if (off) off._paired = true;
        rows.push({ side, clock: clockLabel(e), icon: SUB_ICON, main: `<span class="md-in">${name(e.personId)}</span>`, sub: off ? `<span class="md-out">${name(off.personId)}</span>` : '' });
      } else if (e.type === 'MP' || e.type === 'SP') {
        rows.push({ side, clock: clockLabel(e), icon: e.type === 'SP' ? MATCH_ICONS.penSaved : MATCH_ICONS.penMissed, main: name(e.personId) || (e.type === 'SP' ? 'Penalty saved' : 'Penalty missed'), sub: e.type === 'SP' ? 'Penalty saved' : 'Penalty missed' });
      } else if (e.type === 'PE') {
        const sc = e.score || prev;
        rows.push({ divider: e.phase === '1' ? `Half-time ${sc.homeScore}–${sc.awayScore}` : `Full-time ${sc.homeScore}–${sc.awayScore}` });
      }
    }
    events.forEach(x => { delete x._paired; });

    if (!rows.length) return `<div class="md-empty">No events yet.</div>${bonusHtml(f, h, a, st)}`;
    const html = rows.map(r => r.divider
      ? `<li class="md-tl-divider"><span>${r.divider}</span></li>`
      : `<li class="md-tl-row is-${r.side}${r.strong ? ' is-goal' : ''}">
          <div class="md-tl-side md-tl-home">${r.side === 'home' ? `<div class="md-tl-ev">${r.icon}<div><div class="md-tl-main">${r.main}</div>${r.sub ? `<div class="md-tl-sub">${r.sub}</div>` : ''}</div></div>` : ''}</div>
          <div class="md-tl-min">${r.clock}${r.score ? `<span>${r.score}</span>` : ''}</div>
          <div class="md-tl-side md-tl-away">${r.side === 'away' ? `<div class="md-tl-ev">${r.icon}<div><div class="md-tl-main">${r.main}</div>${r.sub ? `<div class="md-tl-sub">${r.sub}</div>` : ''}</div></div>` : ''}</div>
        </li>`).join('');
    return `<ol class="md-timeline">${html}</ol>${bonusHtml(f, h, a, st)}`;
  }

  // Fallback events (FPL data, no minutes) when the Premier League data is unavailable
  function fplEventsHtml(f, h, a, st) {
    return `
      <div class="md-events-grid">
        ${sideEventsHtml(f, 'h')}
        <div class="md-divider"></div>
        ${sideEventsHtml(f, 'a')}
      </div>${bonusHtml(f, h, a, st)}`;
  }

  function bonusHtml(f, h, a, st) {
    const stat = key => (f.stats || []).find(x => x.identifier === key) || { h: [], a: [] };
    const bonus = [...stat('bonus').h.map(x => ({ ...x, team: h })), ...stat('bonus').a.map(x => ({ ...x, team: a }))]
      .sort((x, y) => y.value - x.value);
    return `
      <div class="md-bonus">
        <div class="md-bonus-title">FPL bonus points${st === 'final' ? '' : ' <span>· provisional</span>'}</div>
        <div class="md-bonus-list">
          ${bonus.length ? bonus.map(x => `
            <span class="md-bonus-chip b${x.value}">
              <b>${x.value}</b>${crestHtml(x.team)}<span>${playerName(x.element)}</span>
            </span>`).join('') : '<span class="md-none">Not available yet</span>'}
        </div>
      </div>`;
  }

  // ---- Line-ups tab ----
  function playerPhotoUrl(p) {
    const opta = p.altIds && p.altIds.opta ? String(p.altIds.opta).replace(/^p/, '') : '';
    return opta ? `https://resources.premierleague.com/premierleague25/photos/players/110x140/${opta}.png` : '';
  }

  function lineupsTabHtml(fixture, managers) {
    const lists = fixture.teamLists || [];
    if (lists.length < 2 || !lists[0].lineup || !lists[0].lineup.length) {
      return '<div class="md-empty">Line-ups are usually announced about an hour before kick-off.</div>';
    }
    const homeTeamId = fixture.teams[0].team.id;
    const ordered = [lists.find(t => t.teamId === homeTeamId) || lists[0], lists.find(t => t.teamId !== homeTeamId) || lists[1]];

    // What each player did, for small markers on the pitch
    const marks = {};
    const add = (id, html) => { if (id) (marks[id] = marks[id] || []).push(html); };
    const subOn = {};
    (fixture.events || []).forEach(e => {
      if (e.type === 'G' || e.type === 'P') add(e.personId, MATCH_ICONS.goal);
      else if (e.type === 'O') add(e.personId, MATCH_ICONS.ownGoal);
      else if (e.type === 'B') add(e.personId, e.description === 'R' ? MATCH_ICONS.red : (e.description === 'YR' ? SECOND_YELLOW_ICON : MATCH_ICONS.yellow));
      else if (e.type === 'S' && e.description === 'OFF') add(e.personId, `<span class="lu-off" title="Subbed off ${clockLabel(e)}">${clockLabel(e)}<i>▼</i></span>`);
      else if (e.type === 'S' && e.description === 'ON') subOn[e.personId] = clockLabel(e);
    });

    const playerCard = p => {
      const photo = playerPhotoUrl(p);
      return `
        <div class="lu-player">
          <div class="lu-photo"><span class="lu-initials">${getManagerInitials(p.name ? p.name.display : '')}</span>${photo ? `<img src="${photo}" alt="" loading="lazy" onerror="this.remove()">` : ''}${p.captain ? '<span class="lu-captain">C</span>' : ''}</div>
          <div class="lu-name"><b>${p.matchShirtNumber ?? ''}</b>${p.name ? p.name.last || p.name.display : ''}</div>
          ${marks[p.id] ? `<div class="lu-marks">${marks[p.id].join('')}</div>` : ''}
        </div>`;
    };

    // Formation rows go goalkeeper first; home attacks left-to-right, away the other way
    const halfHtml = (tl, side) => {
      const byId = {};
      (tl.lineup || []).forEach(p => { byId[p.id] = p; });
      const rows = (tl.formation && tl.formation.players) || [];
      const n = rows.length;
      return rows.map((ids, i) => {
        const pos = n > 1 ? i / (n - 1) : 0;
        const x = side === 'home' ? 5 + pos * 38 : 95 - pos * 38;
        return ids.map((id, j) => {
          const y = ((j + 1) / (ids.length + 1)) * 100;
          const p = byId[id];
          return p ? `<div class="lu-slot" style="left:${x}%;top:${y}%">${playerCard(p)}</div>` : '';
        }).join('');
      }).join('');
    };

    const benchHtml = (tl, team) => `
      <div class="lu-bench">
        <div class="lu-bench-head">${crestHtml(team)}<strong>${team.name || team.short_name}</strong><span>${(tl.formation && tl.formation.label) || ''}</span></div>
        ${managers[team.short_name] ? `<div class="lu-manager"><span>Manager</span><strong>${managers[team.short_name]}</strong></div>` : ''}
        <ul>
          ${(tl.substitutes || []).map(p => `
            <li class="${subOn[p.id] ? 'is-on' : ''}">
              <b>${p.matchShirtNumber ?? ''}</b><span>${p.name ? p.name.display : ''}</span>
              ${subOn[p.id] ? `<em title="Came on">▲ ${subOn[p.id]}</em>` : ''}
              ${marks[p.id] ? `<span class="lu-bench-marks">${marks[p.id].filter(m => !m.includes('lu-off')).join('')}</span>` : ''}
            </li>`).join('')}
        </ul>
      </div>`;

    const homeTeam = teamById(currentMatchFixture().team_h), awayTeam = teamById(currentMatchFixture().team_a);
    return `
      <div class="lu-formations">
        <span>${crestHtml(homeTeam)}${(ordered[0].formation && ordered[0].formation.label) || ''}${managers[homeTeam.short_name] ? `<em>${managers[homeTeam.short_name]}</em>` : ''}</span>
        <span>${managers[awayTeam.short_name] ? `<em>${managers[awayTeam.short_name]}</em>` : ''}${(ordered[1].formation && ordered[1].formation.label) || ''}${crestHtml(awayTeam)}</span>
      </div>
      <div class="lu-pitch">
        <div class="lu-lines"></div>
        ${halfHtml(ordered[0], 'home')}
        ${halfHtml(ordered[1], 'away')}
      </div>
      <div class="lu-benches">
        ${benchHtml(ordered[0], homeTeam)}
        ${benchHtml(ordered[1], awayTeam)}
      </div>`;
  }

  // ---- Stats tab ----
  const MATCH_STATS = [
    ['possession_percentage', 'Possession', v => `${Math.round(v)}%`],
    ['total_scoring_att', 'Shots'],
    ['ontarget_scoring_att', 'Shots on target'],
    ['big_chance_created', 'Big chances'],
    ['total_pass', 'Passes'],
    ['pass_accuracy', 'Pass accuracy', v => `${Math.round(v)}%`],
    ['won_corners', 'Corners'],
    ['fk_foul_lost', 'Fouls'],
    ['total_offside', 'Offsides'],
    ['total_tackle', 'Tackles'],
    ['interception', 'Interceptions'],
    ['total_clearance', 'Clearances'],
    ['saves', 'Saves'],
    ['total_yel_card', 'Yellow cards'],
    ['total_red_card', 'Red cards']
  ];

  function statsTabHtml(pl) {
    const data = pl.stats && pl.stats.data;
    if (!data) return '<div class="md-empty">Stats appear once the match starts.</div>';
    const ids = pl.fixture.teams.map(t => String(Math.round(t.team.id)));
    const statMap = id => {
      const m = {};
      ((data[id] && data[id].M) || []).forEach(x => { m[x.name] = x.value; });
      m.pass_accuracy = m.total_pass ? ((m.accurate_pass || 0) / m.total_pass) * 100 : 0;
      return m;
    };
    const home = statMap(ids[0]), away = statMap(ids[1]);
    if (!Object.keys(home).length && !Object.keys(away).length) return '<div class="md-empty">Stats appear once the match starts.</div>';
    const rows = MATCH_STATS.map(([key, label, fmt]) => {
      const hv = home[key] || 0, av = away[key] || 0;
      const total = hv + av;
      const hp = total ? (hv / total) * 100 : 50, ap = total ? (av / total) * 100 : 50;
      const show = v => (fmt ? fmt(v) : Math.round(v));
      return `
        <div class="ms-row">
          <div class="ms-vals"><b class="${hv > av ? 'is-lead' : ''}">${show(hv)}</b><span>${label}</span><b class="${av > hv ? 'is-lead' : ''}">${show(av)}</b></div>
          <div class="ms-bars"><span class="ms-home" style="width:${hp}%"></span><span class="ms-away" style="width:${ap}%"></span></div>
        </div>`;
    }).join('');
    return `<div class="ms-list">${rows}</div>`;
  }

  // ---- Table tab ----
  function tableTabHtml(f) {
    const all = matchCentre.fixtures;
    if (!all) {
      return matchCentre.tableError
        ? '<div class="md-empty">The table is unavailable right now. Try again in a minute.</div>'
        : '<div class="md-empty"><span class="gs-spinner"></span> Loading table…</div>';
    }
    const rows = {};
    Object.values(getTeamsMap()).forEach(t => {
      rows[t.id] = { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, pts: 0, form: [] };
    });
    all.filter(x => (x.finished || x.finished_provisional) && x.team_h_score !== null && x.team_a_score !== null)
      .sort((x, y) => x.kickoff_time.localeCompare(y.kickoff_time))
      .forEach(x => {
        const hr = rows[x.team_h], ar = rows[x.team_a];
        if (!hr || !ar) return;
        const hs = x.team_h_score, as = x.team_a_score;
        [[hr, hs, as], [ar, as, hs]].forEach(([r, gf, ga]) => {
          r.p++; r.gf += gf; r.ga += ga;
          if (gf > ga) { r.w++; r.pts += 3; r.form.push('W'); }
          else if (gf === ga) { r.d++; r.pts += 1; r.form.push('D'); }
          else { r.l++; r.form.push('L'); }
        });
      });
    const table = Object.values(rows).sort((x, y) => y.pts - x.pts || (y.gf - y.ga) - (x.gf - x.ga) || y.gf - x.gf || String(x.team.name).localeCompare(String(y.team.name)));
    const highlight = [f.team_h, f.team_a];
    const formPill = r => `<span class="form-pill ${r === 'W' ? 'form-w' : r === 'L' ? 'form-l' : 'form-n'}">${r}</span>`;
    return `
      <table class="lt">
        <thead><tr><th>#</th><th class="lt-club">Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th><th class="lt-form">Form</th></tr></thead>
        <tbody>
          ${table.map((r, i) => `
            <tr class="${highlight.includes(r.team.id) ? 'is-match' : ''}${i < 4 ? ' is-ucl' : ''}${i >= table.length - 3 ? ' is-releg' : ''}">
              <td class="lt-pos">${i + 1}</td>
              <td class="lt-club">${crestHtml(r.team)}<span>${r.team.name}</span></td>
              <td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td>
              <td>${r.gf - r.ga > 0 ? '+' : ''}${r.gf - r.ga}</td>
              <td class="lt-pts">${r.pts}</td>
              <td class="lt-form"><span class="form-pill-container">${r.form.slice(-5).map(formPill).join('')}</span></td>
            </tr>`).join('')}
        </tbody>
      </table>
      <div class="md-note">Includes provisional results from matches that have just finished.</div>`;
  }

  // ===================== CHART =====================
  const CHART_COLORS = MANAGER_COLORS;

  function buildDatasets() {
    return state.dataset.managers.map((m, idx) => {
      const rankHistory = [];
      for (let gw = 1; gw <= state.maxGw; gw++) {
        const standings = getGameweekStandings(gw);
        const item = standings.find(x => x.id === m.id);
        rankHistory.push(item ? item.rank : null);
      }
      const color = CHART_COLORS[idx % CHART_COLORS.length];
      return {
        label: m.name,
        data: rankHistory,
        borderColor: color,
        backgroundColor: color,
        tension: 0,
        clip: 8,
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 7,
        pointBorderWidth: 2,
        pointBackgroundColor: color
      };
    });
  }

  function getChartTextColor() { return state.theme === 'light' ? '#6b6178' : '#a99db8'; }
  function getChartGridColor() { return state.theme === 'light' ? 'rgba(55,0,60,0.07)' : 'rgba(255,255,255,0.07)'; }

  // Highlight one manager's line and fade the rest (hovering their legend entry)
  function focusRankLine(chart, focusIndex) {
    chart.data.datasets.forEach((ds, i) => {
      const base = ds.baseColor || ds.borderColor;
      ds.baseColor = base;
      const dim = focusIndex !== null && i !== focusIndex;
      ds.borderColor = dim ? `${base}26` : base;
      ds.backgroundColor = dim ? `${base}26` : base;
      ds.pointBackgroundColor = dim ? `${base}26` : base;
      ds.pointBorderColor = dim ? `${base}26` : base;
      ds.pointRadius = focusIndex !== null && i === focusIndex ? 4.5 : 3;
      ds.borderWidth = focusIndex !== null && i === focusIndex ? 3.5 : 2;
      ds.order = focusIndex !== null && i === focusIndex ? -1 : 0;
    });
    chart.update('focus');
  }

  // Shaded rank zones behind the lines: top three win, bottom three lose, the
  // rest are neutral (same split as the weekly payouts; needs at least 7 managers)
  const rankZonesPlugin = {
    id: 'rankZones',
    beforeDatasetsDraw(chart) {
      const n = state.dataset.managers ? state.dataset.managers.length : 0;
      if (n < 7) return;
      const { ctx, chartArea: area, scales: { y } } = chart;
      const dark = state.theme === 'dark';
      const zones = [
        { from: 1, to: 3, fill: dark ? 'rgba(62, 224, 139, 0.10)' : 'rgba(16, 185, 129, 0.08)' },
        { from: 4, to: n - 3, fill: dark ? 'rgba(189, 178, 200, 0.07)' : 'rgba(100, 116, 139, 0.06)' },
        { from: n - 2, to: n, fill: dark ? 'rgba(255, 92, 138, 0.10)' : 'rgba(233, 0, 82, 0.06)' }
      ];
      ctx.save();
      zones.forEach(z => {
        if (z.to < z.from) return;
        const top = Math.max(area.top, y.getPixelForValue(z.from - 0.5));
        const bottom = Math.min(area.bottom, y.getPixelForValue(z.to + 0.5));
        ctx.fillStyle = z.fill;
        ctx.fillRect(area.left, top, area.right - area.left, bottom - top);
      });
      ctx.restore();
    }
  };

  function initChart() {
    const ctx = document.getElementById('rankChart');
    if (!ctx) return;
    const labels = Array.from({ length: state.maxGw }, (_, i) => `GW${i + 1}`);
    state.chartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: buildDatasets() },
      plugins: [rankZonesPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 6, bottom: 6, right: 6 } },
        // Quick fade when highlighting a manager (a 'none' update leaves the dots unfaded)
        transitions: { focus: { animation: { duration: 150 } } },
        scales: {
          y: {
            reverse: true,
            min: 0.5,
            max: state.dataset.managers.length + 0.5,
            afterBuildTicks: axis => { axis.ticks = Array.from({ length: state.dataset.managers.length }, (_, i) => ({ value: i + 1 })); },
            ticks: { stepSize: 1, color: getChartTextColor(), font: { weight: '600' } },
            grid: { color: getChartGridColor() }
          },
          x: {
            ticks: { color: getChartTextColor(), font: { weight: '600' } },
            grid: { color: getChartGridColor() }
          }
        },
        // Hovering near a point on a line focuses that manager
        onHover: (e, els, chart) => {
          // While a manager is pinned, hovering the chart must not steal the highlight
          if (state.rankPinnedIndex !== null && state.rankPinnedIndex !== undefined) return;
          let idx = null;
          if (e.type !== 'mouseout') {
            const near = chart.getElementsAtEventForMode(e, 'nearest', { intersect: false }, false)[0];
            if (near && Math.hypot(near.element.x - e.x, near.element.y - e.y) < 16) idx = near.datasetIndex;
          }
          if (idx !== state.rankHoverIndex) { state.rankHoverIndex = idx; applyRankFocus(); }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });

    // Manager buttons under the chart: hover to preview a line, click to keep it highlighted
    const chips = document.getElementById('rankChartManagers');
    if (chips) {
      chips.addEventListener('mouseover', e => {
        const b = e.target.closest('[data-rank-index]');
        state.rankHoverIndex = b ? Number(b.dataset.rankIndex) : null;
        applyRankFocus();
      });
      chips.addEventListener('mouseleave', () => { state.rankHoverIndex = null; applyRankFocus(); });
      chips.addEventListener('click', e => {
        const b = e.target.closest('[data-rank-index]');
        if (!b) return;
        const i = Number(b.dataset.rankIndex);
        state.rankPinnedIndex = state.rankPinnedIndex === i ? null : i;
        applyRankFocus();
      });
    }
    renderRankChips();
  }

  function renderRankChips() {
    const chips = document.getElementById('rankChartManagers');
    if (!chips || !state.chartInstance) return;
    chips.innerHTML = state.chartInstance.data.datasets.map((ds, i) => `
      <button class="rank-chip" data-rank-index="${i}" title="Highlight ${ds.label} (click to keep it highlighted)">
        <span class="rank-chip-dot" style="background:${ds.baseColor || ds.borderColor}"></span>${ds.label}
      </button>`).join('');
    applyRankFocus();
  }

  // Hover wins over the clicked (pinned) manager; nothing set shows every line
  function applyRankFocus() {
    const chart = state.chartInstance;
    if (!chart) return;
    const hover = state.rankHoverIndex;
    const idx = hover !== null && hover !== undefined ? hover : (state.rankPinnedIndex ?? null);
    focusRankLine(chart, idx);
    document.querySelectorAll('#rankChartManagers .rank-chip').forEach(b => {
      const i = Number(b.dataset.rankIndex);
      b.classList.toggle('is-focus', idx === i);
      b.classList.toggle('is-dim', idx !== null && idx !== i);
      b.classList.toggle('is-pinned', state.rankPinnedIndex === i);
      b.setAttribute('aria-pressed', String(state.rankPinnedIndex === i));
    });
  }

  function updateChartTheme() {
    if (!state.chartInstance) return;
    state.chartInstance.options.scales.y.ticks.color = getChartTextColor();
    state.chartInstance.options.scales.y.grid.color = getChartGridColor();
    state.chartInstance.options.scales.x.ticks.color = getChartTextColor();
    state.chartInstance.options.scales.x.grid.color = getChartGridColor();
    state.chartInstance.update();
  }

  function updateChart() {
    if (!state.chartInstance) return;
    state.chartInstance.data.datasets = buildDatasets();
    state.chartInstance.options.scales.y.max = state.dataset.managers.length + 0.5;
    if (state.rankPinnedIndex !== null && state.rankPinnedIndex >= state.chartInstance.data.datasets.length) state.rankPinnedIndex = null;
    updateChartTheme();
    renderRankChips();
  }

  // ===================== PERFORMANCE CHART =====================
  // Wins / neutrals / losses per manager as stacked bars, in the result colours
  // used by the form pills, with each segment's count written on it.
  const PERF_SERIES = [
    { key: 'wins', label: 'Wins', color: '#00c46a', text: '#06331d' },
    { key: 'neutrals', label: 'Neutrals', color: '#cfc8d8', text: '#3d3448' },
    { key: 'losses', label: 'Losses', color: '#e90052', text: '#ffffff' }
  ];

  const barCountsPlugin = {
    id: 'barCounts',
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.font = `700 12px ${CHART_FONT}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      chart.data.datasets.forEach((ds, di) => {
        const meta = chart.getDatasetMeta(di);
        if (meta.hidden) return;
        meta.data.forEach((bar, i) => {
          const v = ds.data[i];
          if (!v) return;
          const width = Math.abs(bar.x - bar.base);
          if (width < 16) return;
          ctx.fillStyle = PERF_SERIES[di].text;
          ctx.fillText(String(v), (bar.x + bar.base) / 2, bar.y);
        });
      });
      ctx.restore();
    }
  };

  function perfDatasets(summary) {
    return PERF_SERIES.map(series => ({
      label: series.label,
      data: summary.map(s => s[series.key]),
      backgroundColor: series.color,
      hoverBackgroundColor: series.color,
      borderWidth: 0,
      borderRadius: 6,
      borderSkipped: false,
      barThickness: 22
    }));
  }

  function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;

    const summary = getManagerSeasonSummary();

    state.perfChartInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels: summary.map(s => s.name), datasets: perfDatasets(summary) },
      plugins: [barCountsPlugin],
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: getChartTextColor(), font: { weight: '600' }, stepSize: 1 },
            grid: { color: getChartGridColor(), drawTicks: false },
            border: { display: false },
            title: { display: true, text: 'Gameweeks', color: getChartTextColor(), font: { size: 11, weight: '600' } }
          },
          y: {
            stacked: true,
            ticks: { color: getChartTextColor(), font: { weight: '600', size: 13 } },
            grid: { display: false },
            border: { display: false }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { color: getChartTextColor(), font: { family: CHART_FONT, weight: '600' }, usePointStyle: true, pointStyle: 'rectRounded', boxWidth: 10, boxHeight: 10, padding: 16 }
          },
          tooltip: {
            callbacks: {
              title: items => items[0] ? items[0].label : '',
              label: item => ` ${item.dataset.label}: ${item.raw} GW${item.raw === 1 ? '' : 's'}`
            }
          }
        }
      }
    });
  }

  function updatePerformanceChartTheme() {
    const chart = state.perfChartInstance;
    if (!chart) return;
    chart.options.scales.y.ticks.color = getChartTextColor();
    chart.options.scales.x.ticks.color = getChartTextColor();
    chart.options.scales.x.grid.color = getChartGridColor();
    chart.options.scales.x.title.color = getChartTextColor();
    chart.options.plugins.legend.labels.color = getChartTextColor();
    chart.update();
  }

  function updatePerformanceChart() {
    const chart = state.perfChartInstance;
    if (!chart) return;
    const summary = getManagerSeasonSummary();
    chart.data.labels = summary.map(s => s.name);
    perfDatasets(summary).forEach((ds, i) => { chart.data.datasets[i].data = ds.data; });
    // Give each manager row the same height whatever the league size
    const box = document.querySelector('.chart-box-perf');
    if (box) box.style.height = `${Math.max(220, summary.length * 40 + 80)}px`;
    updatePerformanceChartTheme();
  }

  // ===================== SQUAD PANEL HELPERS =====================
  function ptsText(n) {
    return `${n} ${Math.abs(Number(n)) === 1 ? 'pt' : 'pts'}`;
  }

  // Club colours for the shirt icons on the pitch view
  const CLUB_COLORS = {
    ARS: '#EF0107', AVL: '#670E36', BOU: '#DA291C', BRE: '#E30613', BHA: '#0057B8',
    BUR: '#6C1D45', CHE: '#034694', COV: '#59CBE8', CRY: '#1B458F', EVE: '#003399',
    FUL: '#1d1d1d', HUL: '#F5A12D', IPS: '#3A64A3', LEE: '#FFCD00', LEI: '#003090',
    LIV: '#C8102E', MCI: '#6CABDD', MUN: '#DA291C', NEW: '#241F20', NFO: '#DD0000',
    SHU: '#EE2737', SOU: '#D71920', SUN: '#EB172B', TOT: '#132257', WHU: '#7A263A',
    WOL: '#FDB913', MID: '#E21A23', NOR: '#00A650', WAT: '#FBEE23', WBA: '#122F67'
  };

  function shirtSvg(team, cls) {
    const color = CLUB_COLORS[String(team).toUpperCase()] || '#8a8197';
    return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/></svg>`;
  }

  function playerStatusHtml(c) {
    if (c.status === 'yet_to_play') return `<span class="status-pill-yet-to-play">${icon('clock', 12)} Yet to play</span>`;
    if (c.status === 'live') return `<span class="status-pill-live"><span class="live-dot"></span>Live ${c.minutes || 0}'</span>`;
    if (c.status === 'dnp') return `<span class="status-pill-dnp">${icon('x', 12)} Did not play</span>`;
    return `<span class="status-pill-played">${icon('check', 12)} Played</span>`;
  }

  const POSITION_GROUPS = { 1: 'Goalkeeper', 2: 'Defenders', 3: 'Midfielders', 4: 'Forwards' };

  function squadListRowHtml(c) {
    const role = c.isCaptain ? `<span class="pc-role-inline pc-c">C</span>` : (c.isVice ? '<span class="pc-role-inline pc-v">V</span>' : '');
    const sub = c.subbedIn ? '<span class="sl-tag in">Auto-sub in</span>' : (c.subbedOut ? '<span class="sl-tag out">Auto-sub out</span>' : '');
    const opp = c.opp ? `<span class="opp-pill fdr-${c.difficulty}">${c.opp}</span>` : '<span class="cell-empty">–</span>';
    const ptsCls = c.status === 'yet_to_play' ? ' is-pending' : '';
    return `
      <div class="sl-row${c.subbedOut ? ' is-out' : ''}${c.subbedIn ? ' is-in' : ''}" role="button" tabindex="0" data-element="${c.element}" title="See ${c.name}'s points breakdown">
        <span class="sl-lead">${c.benchRole ? `<span class="sl-order">${c.benchRole}</span>` : ''}${kitHtml(c.team, c.type === 1, 'sl-shirt')}</span>
        <div class="sl-player">
          <span class="sl-name">${c.name}${role}${sub}</span>
          <span class="sl-team">${c.team}${c.isCaptain ? ` · Captain ×${c.multiplier}` : ''}</span>
        </div>
        <span class="sl-opp">${opp}</span>
        <span class="sl-status">${playerStatusHtml(c)}</span>
        <span class="sl-pts${ptsCls}">${c.status === 'yet_to_play' ? '–' : c.pts}</span>
      </div>`;
  }

  function squadListHtml(starters, bench, benchPts, isBenchBoost) {
    const head = `<div class="sl-head"><span></span><span>Player</span><span>Opponent</span><span>Status</span><span class="sl-pts">Pts</span></div>`;
    const groups = [1, 2, 3, 4].map(type => {
      const rows = starters.filter(c => c.type === type);
      if (!rows.length) return '';
      return `<div class="sl-group">${POSITION_GROUPS[type]}</div>${rows.map(squadListRowHtml).join('')}`;
    }).join('');
    const benchGroup = bench.length
      ? `<div class="sl-group sl-group-bench"><span>Bench${isBenchBoost ? ' · Bench Boost' : ''}</span><span>${ptsText(benchPts)}</span></div>${bench.map(squadListRowHtml).join('')}`
      : '';
    return `<div class="sl">${head}${groups}${benchGroup}</div>`;
  }

  // Official FPL shirt image (falls back to the club-colour shirt icon if it can't load)
  function getTeamsMap() {
    return (state.dataset && state.dataset.teams && Object.keys(state.dataset.teams).length)
      ? state.dataset.teams
      : ((window.FPL_LIVE_STATIC && window.FPL_LIVE_STATIC.teams) || {});
  }

  function teamByShort(short) {
    const key = String(short || '').toUpperCase();
    return Object.values(getTeamsMap()).find(t => String(t.short_name).toUpperCase() === key) || null;
  }

  function kitHtml(team, isGoalkeeper, cls) {
    const t = teamByShort(team);
    const img = t && t.code
      ? `<img src="https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${t.code}${isGoalkeeper ? '_1' : ''}-110.webp" alt="" loading="lazy" onerror="this.remove()">`
      : '';
    return `<span class="${cls}">${shirtSvg(team, 'kit-fallback')}${img}</span>`;
  }

  // "H" or "A" for a club's fixture in a gameweek, when the fixture list covers it
  function fixtureVenue(teamShort, gw) {
    const t = teamByShort(teamShort);
    const fixtures = state.fixtures || (state.dataset && state.dataset.fixtures) || [];
    if (!t || !Array.isArray(fixtures)) return '';
    const f = fixtures.find(x => x && Number(x.event) === Number(gw) && (x.team_h === t.id || x.team_a === t.id));
    return f ? (f.team_h === t.id ? 'H' : 'A') : '';
  }

  function pitchCardHtml(c) {
    const statusCls = c.status === 'yet_to_play' ? 'is-pending' : (c.status === 'live' ? 'is-live' : (c.status === 'dnp' ? 'is-dnp' : 'is-played'));
    const role = c.isCaptain
      ? `<span class="pc-role pc-c" title="Captain ×${c.multiplier}">C</span>`
      : (c.isVice ? '<span class="pc-role pc-v" title="Vice-captain">V</span>' : '');
    const subTag = c.subbedIn
      ? `<span class="pc-sub in" title="Auto-subbed in">${icon('up', 11)}</span>`
      : (c.subbedOut ? `<span class="pc-sub out" title="Auto-subbed out">${icon('down', 11)}</span>` : '');
    const fixture = c.opp ? `${c.opp}${c.venue ? ` (${c.venue})` : ''}` : '–';
    const info = c.status === 'yet_to_play'
      ? `<span class="pc-info pc-fixture">${fixture}</span>`
      : `<span class="pc-info pc-points">${c.pts}${c.status === 'live' ? `<span class="pc-live">${c.minutes || 0}'</span>` : ''}</span>`;
    return `
      <div class="pc ${statusCls}${c.subbedOut ? ' is-out' : ''}${c.subbedIn ? ' is-in' : ''}" role="button" tabindex="0" data-element="${c.element}" title="See ${c.name}'s points breakdown">
        ${subTag}${role}
        ${kitHtml(c.team, c.type === 1, 'pc-kit')}
        <span class="pc-strip">
          <span class="pc-name">${c.name}</span>
          <span class="pc-club">${c.team}</span>
        </span>
        ${info}
      </div>`;
  }

  // Bench card with FPL-style label (GKP, 1 DEF, 2 MID …) above it
  const POSITION_SHORT = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
  const POSITION_FULL = { 1: 'Goalkeeper', 2: 'Defender', 3: 'Midfielder', 4: 'Forward' };
  function benchCardHtml(c, i) {
    const label = i === 0 ? 'GKP' : `${i}. ${POSITION_SHORT[c.type] || ''}`;
    return `<div class="bench-slot"><span class="bench-slot-label">${label}</span>${pitchCardHtml(c)}</div>`;
  }

  function getSquadView() {
    try { return localStorage.getItem('fpl_squad_view') === 'list' ? 'list' : 'pitch'; } catch (e) { return 'pitch'; }
  }

  function syncSquadViewButtons() {
    const view = getSquadView();
    document.querySelectorAll('[data-squad-view]').forEach(b => b.classList.toggle('active', b.dataset.squadView === view));
    document.querySelectorAll('.squad-views').forEach(el => { el.dataset.view = view; });
  }

  window.setSquadView = function(view) {
    try { localStorage.setItem('fpl_squad_view', view); } catch (e) {}
    syncSquadViewButtons();
  };

  // ===================== POINTS BREAKDOWN POP-UP =====================
  const STAT_LABELS = {
    minutes: 'Minutes played', goals_scored: 'Goals scored', assists: 'Assists',
    clean_sheets: 'Clean sheet', goals_conceded: 'Goals conceded', own_goals: 'Own goals',
    penalties_saved: 'Penalties saved', penalties_missed: 'Penalties missed',
    yellow_cards: 'Yellow card', red_cards: 'Red card', saves: 'Saves', bonus: 'Bonus',
    defensive_contribution: 'Defensive contribution', bps: 'Bonus points system'
  };

  // FPL's live "explain" (per fixture) merged into [identifier, value, points] rows
  function compactExplain(explain) {
    const merged = {};
    (explain || []).forEach(fx => (fx.stats || []).forEach(st => {
      if (!st.identifier) return;
      const row = merged[st.identifier] || (merged[st.identifier] = [st.identifier, 0, 0]);
      row[1] += st.value || 0;
      row[2] += st.points || 0;
    }));
    return Object.values(merged).filter(r => r[1] || r[2]);
  }

  window.closePointsBreakdown = function() {
    const pop = document.getElementById('pointsPopover');
    if (pop) pop.remove();
  };

  window.showPointsBreakdown = function(elementId) {
    closePointsBreakdown();
    const c = (state.modalSquadCards || []).find(x => Number(x.element) === Number(elementId));
    if (!c) return;
    const gw = state.modalGw || state.currentGw;
    const byGw = (state.dataset.playerGwExplain || {})[String(gw)] || {};
    const rows = byGw[String(elementId)];
    const fixture = c.opp ? `vs ${c.opp}${c.venue ? ` (${c.venue})` : ''}` : '';
    const base = rows ? rows.reduce((sum, r) => sum + r[2], 0) : null;

    let body;
    if (c.status === 'yet_to_play') {
      body = `<div class="bd-empty">${icon('clock', 16)} Yet to play${fixture ? ` · ${fixture}` : ''}</div>`;
    } else if (c.status === 'dnp' && (!rows || !rows.length)) {
      body = `<div class="bd-empty">${icon('x', 16)} Didn't play in GW${gw} · 0 pts</div>`;
    } else if (!rows || !rows.length) {
      body = `<div class="bd-empty">Breakdown not available yet for GW${gw}.</div>`;
    } else {
      const lines = rows.map(([key, value, pts]) => `
        <div class="bd-row">
          <span class="bd-stat">${STAT_LABELS[key] || key.replace(/_/g, ' ')}</span>
          <span class="bd-value">${value}</span>
          <span class="bd-pts${pts < 0 ? ' neg' : ''}">${pts > 0 ? '+' : ''}${pts}</span>
        </div>`).join('');
      const multiplierLine = c.starter && c.multiplier > 1
        ? `<div class="bd-row bd-mult"><span class="bd-stat">${c.isCaptain ? 'Captain' : 'Multiplier'}</span><span class="bd-value">×${c.multiplier}</span><span class="bd-pts">${base * c.multiplier}</span></div>`
        : '';
      body = `
        <div class="bd-table">
          <div class="bd-row bd-head"><span>Statistic</span><span>Value</span><span>Pts</span></div>
          ${lines}
          ${multiplierLine}
        </div>`;
    }

    const counted = c.starter ? '' : '<div class="bd-note">On the bench — these points don\'t count' + (c.subbedOut ? ' (auto-subbed out)' : '') + '.</div>';
    const pop = document.createElement('div');
    pop.id = 'pointsPopover';
    pop.className = 'bd-overlay';
    pop.innerHTML = `
      <div class="bd-card" role="dialog" aria-label="${c.name} points breakdown">
        <div class="bd-hero">
          <div class="bd-photo">
            ${kitHtml(c.team, c.type === 1, 'bd-kit')}
            ${c.code ? `<img class="bd-player-img" src="https://resources.premierleague.com/premierleague25/photos/players/110x140/${c.code}.png" alt="" onerror="if(!this.dataset.retry){this.dataset.retry=1;this.src='https://resources.premierleague.com/premierleague/photos/players/110x140/p${c.code}.png';}else{this.remove();}">` : ''}
          </div>
          <div class="bd-hero-text">
            <span class="bd-position">${POSITION_FULL[c.type] || ''}</span>
            ${c.firstName ? `<span class="bd-first">${c.firstName}</span>` : ''}
            <strong class="bd-last">${c.lastName || c.name}</strong>
            <span class="bd-club">${c.clubName}${fixture ? ` · ${fixture}` : ''}</span>
          </div>
          <div class="bd-total">
            <span class="bd-total-value">${c.status === 'yet_to_play' ? '–' : c.pts}</span>
            <span class="bd-total-label">GW${gw} pts</span>
          </div>
          <button class="icon-btn bd-close" aria-label="Close breakdown" onclick="closePointsBreakdown()">${icon('x', 14)}</button>
        </div>
        ${body}
        ${counted}
      </div>`;
    pop.addEventListener('click', e => { if (e.target === pop) closePointsBreakdown(); });
    document.getElementById('managerDetailModal').appendChild(pop);
  };

  // ===================== SQUAD PANEL GESTURES =====================
  // Click a player for the breakdown; swipe (finger) or drag (mouse) sideways to change manager
  function initSquadPanelGestures() {
    const modal = document.getElementById('managerDetailModal');
    const body = document.getElementById('modalContentBody');
    if (!modal || !body) return;

    body.addEventListener('click', e => {
      if (body.dataset.justSwiped === '1') return;
      const el = e.target.closest('[data-element]');
      if (el) showPointsBreakdown(el.dataset.element);
    });
    body.addEventListener('keydown', e => {
      const el = e.target.closest('[data-element]');
      if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); showPointsBreakdown(el.dataset.element); }
    });

    let startX = 0, startY = 0, dx = 0, tracking = false, horizontal = null, pointerId = null;
    const reset = () => {
      body.style.transform = '';
      body.style.opacity = '';
      body.classList.remove('is-dragging');
      tracking = false; horizontal = null; pointerId = null; dx = 0;
    };

    body.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (e.target.closest('button, a, input, select, .segmented')) return;
      tracking = true; horizontal = null; pointerId = e.pointerId;
      startX = e.clientX; startY = e.clientY; dx = 0;
    });

    body.addEventListener('pointermove', e => {
      if (!tracking || e.pointerId !== pointerId) return;
      dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        horizontal = Math.abs(dx) > Math.abs(dy) * 1.2;
        if (horizontal) {
          body.classList.add('is-dragging');
          try { body.setPointerCapture(pointerId); } catch (err) {}
        } else {
          tracking = false;
          return;
        }
      }
      if (horizontal) {
        body.style.transform = `translateX(${dx * 0.6}px)`;
        body.style.opacity = String(Math.max(0.4, 1 - Math.abs(dx) / 600));
      }
    });

    const finish = e => {
      if (!tracking || (e && e.pointerId !== pointerId)) return;
      const wasHorizontal = horizontal;
      const distance = dx;
      reset();
      if (wasHorizontal) {
        body.dataset.justSwiped = '1';
        setTimeout(() => { body.dataset.justSwiped = ''; }, 50);
        if (Math.abs(distance) > 70) {
          closePointsBreakdown();
          navigateManagerModal(distance < 0 ? 1 : -1);
          body.classList.add(distance < 0 ? 'swipe-in-right' : 'swipe-in-left');
          setTimeout(() => body.classList.remove('swipe-in-right', 'swipe-in-left'), 260);
        }
      }
    };
    body.addEventListener('pointerup', finish);
    body.addEventListener('pointercancel', () => reset());

    // Two-finger horizontal swipe on a trackpad (wheel events with deltaX).
    // One manager per gesture: wait for the scroll momentum to stop before the next.
    let wheelAcc = 0, wheelLocked = false, wheelIdle = null;
    body.addEventListener('wheel', e => {
      if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(wheelIdle);
      wheelIdle = setTimeout(() => {
        wheelAcc = 0; wheelLocked = false;
        body.style.transform = ''; body.style.opacity = '';
      }, 180);
      if (wheelLocked) return;
      wheelAcc += e.deltaX;
      body.style.transform = `translateX(${Math.max(-60, Math.min(60, -wheelAcc * 0.4))}px)`;
      if (Math.abs(wheelAcc) > 120) {
        const dir = wheelAcc > 0 ? 1 : -1;
        wheelLocked = true; wheelAcc = 0;
        body.style.transform = ''; body.style.opacity = '';
        closePointsBreakdown();
        navigateManagerModal(dir);
        body.classList.add(dir > 0 ? 'swipe-in-right' : 'swipe-in-left');
        setTimeout(() => body.classList.remove('swipe-in-right', 'swipe-in-left'), 260);
      }
    }, { passive: false });
  }

  // Redraw an open squad panel with fresh live data, keeping the scroll position.
  // Skipped while a points breakdown is open so it isn't closed under the reader.
  function refreshOpenManagerModal() {
    const modal = document.getElementById('managerDetailModal');
    if (!state.activeModalManagerId || !modal || !modal.classList.contains('open')) return;
    if (document.getElementById('pointsPopover')) return;
    const body = document.getElementById('modalContentBody');
    const scrollTop = body ? body.scrollTop : 0;
    openManagerModal(state.activeModalManagerId);
    if (body) body.scrollTop = scrollTop;
  }

  // ===================== MANAGER SQUAD DETAIL MODAL =====================
  window.closeManagerModal = function() {
    const modal = document.getElementById('managerDetailModal');
    const backdrop = document.getElementById('managerModalBackdrop');
    const btnPrev = document.getElementById('btnModalPrevManager');
    const btnNext = document.getElementById('btnModalNextManager');

    if (modal) {
      modal.classList.remove('open');
      modal.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) backdrop.classList.remove('open');
    if (btnPrev) btnPrev.classList.remove('open');
    if (btnNext) btnNext.classList.remove('open');
    state.activeModalManagerId = null;
    markViewingManager(null);
    document.body.style.overflow = '';
  };

  window.navigateManagerModal = function(direction) {
    // Step through managers in the order the standings show them
    const shownIds = [...document.querySelectorAll('#standingsBody tr[data-manager-id]')].map(el => Number(el.dataset.managerId));
    const allManagers = state.dataset.managers || [];
    const managers = shownIds.length
      ? shownIds.map(id => allManagers.find(m => m.id === id)).filter(Boolean)
      : allManagers;
    if (!managers || managers.length <= 1) return;

    const currentId = state.activeModalManagerId;
    let currentIdx = managers.findIndex(m => m.id === currentId);
    if (currentIdx === -1) currentIdx = 0;

    const targetIdx = (currentIdx + direction + managers.length) % managers.length;
    const targetManager = managers[targetIdx];
    if (targetManager) {
      openManagerModal(targetManager.id);
    }
  };

  window.openManagerModal = function(managerId) {
    const modal = document.getElementById('managerDetailModal');
    const backdrop = document.getElementById('managerModalBackdrop');
    const btnPrev = document.getElementById('btnModalPrevManager');
    const btnNext = document.getElementById('btnModalNextManager');
    const modalAvatar = document.getElementById('modalManagerAvatar');
    const modalName = document.getElementById('modalManagerName');
    const modalTeam = document.getElementById('modalTeamName');
    const modalFplId = document.getElementById('modalFplId');
    const modalGwBadge = document.getElementById('modalGwBadge');
    const modalDirectLink = document.getElementById('modalFplDirectLink');
    const modalBody = document.getElementById('modalContentBody');

    if (!modal || !modalBody) return;

    state.activeModalManagerId = Number(managerId);
    markViewingManager(managerId);
    closePointsBreakdown();

    const gw = state.currentGw || 1;
    const activeSeasonGw = state.seasonGw || state.maxGw || (state.dataset && state.dataset.currentGw) || 1;
    const isPastGw = gw < activeSeasonGw;
    const manager = (state.dataset.managers || []).find(m => m.id === Number(managerId));
    if (!manager) return;

    // Header info
    if (modalAvatar) {
      const badge = getBadgeUrl(manager.id);
      modalAvatar.classList.toggle('has-badge', Boolean(badge));
      modalAvatar.style.background = badge ? 'transparent' : getManagerColor(manager.id);
      if (badge) modalAvatar.innerHTML = `<img src="${badge}" alt="">`;
      else modalAvatar.textContent = getManagerInitials(manager.name);
    }
    if (modalName) modalName.textContent = manager.name;
    if (modalTeam) modalTeam.textContent = manager.teamName;
    if (modalFplId) modalFplId.textContent = `#${manager.id}`;
    if (modalGwBadge) modalGwBadge.textContent = `Gameweek ${gw}`;
    if (modalDirectLink) modalDirectLink.href = `https://fantasy.premierleague.com/entry/${manager.id}/event/${gw}`;

    modal.classList.add('open');
    if (backdrop) backdrop.classList.add('open');
    if (btnPrev) btnPrev.classList.add('open');
    if (btnNext) btnNext.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    try {
      // Retrieve squad picks from memory (state or pre-bundled FPL_LIVE_STATIC)
      const staticData = window.FPL_LIVE_STATIC || {};
      const squadPicksMap = (state.dataset.squadPicks && Object.keys(state.dataset.squadPicks).length > 0) 
        ? state.dataset.squadPicks 
        : (staticData.squadPicks || {});
      const playersMap = (state.dataset.players && Object.keys(state.dataset.players).length > 0)
        ? state.dataset.players
        : (staticData.players || {});
      const transfersHistoryMap = (state.dataset.transfersHistory && Object.keys(state.dataset.transfersHistory).length > 0)
        ? state.dataset.transfersHistory
        : (staticData.transfersHistory || {});

      const mgrPicks = squadPicksMap[String(manager.id)] || squadPicksMap[Number(manager.id)] || (staticData.squadPicks && (staticData.squadPicks[String(manager.id)] || staticData.squadPicks[Number(manager.id)]));
      let squadData = (mgrPicks && (mgrPicks[String(gw)] || mgrPicks[Number(gw)])) || null;

      const posNames = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
      const posClasses = { 1: 'pos-gkp', 2: 'pos-def', 3: 'pos-mid', 4: 'pos-fwd' };

      let overallRank = '-';
      let bankVal = '£0.0M';
      let transfersCount = 0;
      let transferHits = '(0 hits)';
      let benchPts = 0;
      let activeChip = 'None';
      let captainName = '-';
      let hist = {};

      let startingRows = '';
      let benchRows = '';
      let startingPtsTotal = 0;
      let benchPtsTotal = 0;
      let playedCount = 0;
      let yetToPlayCount = 0;
      let isBenchBoostActive = false;
      let autoSubs = [];
      const squadCards = [];

      if (squadData && squadData.picks && squadData.picks.length > 0) {
        hist = squadData.entry_history || {};
        if (hist.overall_rank) overallRank = Number(hist.overall_rank).toLocaleString();
        if (hist.bank !== undefined && hist.bank !== null) bankVal = `£${(hist.bank / 10).toFixed(1)}M`;
        if (hist.event_transfers !== undefined) transfersCount = hist.event_transfers;
        if (hist.event_transfers_cost !== undefined) {
          transferHits = hist.event_transfers_cost > 0 ? `(-${hist.event_transfers_cost} pts)` : '(0 hits)';
        }
        if (hist.points_on_bench !== undefined) benchPts = hist.points_on_bench;
        if (squadData.active_chip) activeChip = getChipLabel(squadData.active_chip);

        isBenchBoostActive = Boolean(
          activeChip && 
          (activeChip.toLowerCase().includes('bboost') || activeChip.toLowerCase().includes('bench boost') || activeChip.toUpperCase().includes('BB'))
        );

        // Auto-subs: compute auto-subs (official or when Gameweek / matches finished)
        autoSubs = computeAutoSubs(squadData.picks, squadData.automatic_subs, playersMap, isBenchBoostActive);

        // Create display picks: apply auto-subs when confirmed or finished
        const displayPicks = squadData.picks.map(p => ({ ...p }));
        autoSubs.forEach(s => {
          const outIdx = displayPicks.findIndex(p => p.element === s.element_out);
          const inIdx = displayPicks.findIndex(p => p.element === s.element_in);
          if (outIdx !== -1 && inIdx !== -1) {
            const outPos = displayPicks[outIdx].position;
            const inPos = displayPicks[inIdx].position;
            displayPicks[outIdx].position = inPos;
            displayPicks[inIdx].position = outPos;
            displayPicks[inIdx].was_subbed_in = true;
            displayPicks[outIdx].was_subbed_out = true;
            displayPicks[inIdx].subbed_for_id = s.element_out;
            displayPicks[outIdx].subbed_by_id = s.element_in;
            displayPicks[outIdx].original_bench_role = inPos === 12 ? 'GK' : `Sub ${inPos - 12}`;
          }
        });

        // Sort so Starting XI (1..11) comes first, followed by Bench (12..15)
        displayPicks.sort((a, b) => a.position - b.position);

        const playerGwPointsMap = (state.dataset.playerGwPoints && state.dataset.playerGwPoints[String(gw)]) ||
                                  (staticData.playerGwPoints && staticData.playerGwPoints[String(gw)]) || null;

        displayPicks.forEach(p => {
          const plRaw = playersMap[p.element] || {};
          const pl = {
            web_name: plRaw.web_name || `Player #${p.element}`,
            element_type: plRaw.element_type || p.element_type || (p.position === 1 ? 1 : 2),
            team: plRaw.team || '-',
            event_points: plRaw.event_points || 0,
            match_status: plRaw.match_status || 'yet_to_play',
            status_label: plRaw.status_label || '⏳ Yet to Play',
            opponent: plRaw.opponent,
            opponent_short: plRaw.opponent_short,
            difficulty: plRaw.difficulty,
            minutes: plRaw.minutes
          };

          if (playerGwPointsMap && playerGwPointsMap[String(p.element)] !== undefined) {
            pl.event_points = playerGwPointsMap[String(p.element)];
          }

          if (isPastGw) {
            pl.match_status = 'played';
            pl.status_label = '✓ Played';
          }

          const posName = posNames[pl.element_type] || 'DEF';
          const posClass = posClasses[pl.element_type] || 'pos-def';
          const multiplier = p.multiplier || 1;
          const pts = (pl.event_points || 0) * (p.position <= 11 ? multiplier : 1);

          const isYetToPlay = pl.match_status === 'yet_to_play';

          if (p.is_captain) {
            captainName = `${pl.web_name} (${pts} pts)${isYetToPlay ? ' · yet to play' : ''}`;
          }

          let roleTag = '';
          if (p.is_captain) {
            roleTag = `<span class="captain-role-badge">Captain ×${multiplier}</span>`;
          } else if (p.is_vice_captain) {
            roleTag = `<span class="vice-role-badge">Vice</span>`;
          }

          let statusPill = '';
          if (pl.match_status === 'yet_to_play') {
            statusPill = `<span class="status-pill-yet-to-play">${icon('clock', 12)} Yet to play</span>`;
          } else if (pl.match_status === 'live') {
            statusPill = `<span class="status-pill-live"><span class="live-dot"></span>Live (${pl.minutes || 0}')</span>`;
          } else if (pl.match_status === 'dnp') {
            statusPill = `<span class="status-pill-dnp">${icon('x', 12)} Did not play</span>`;
          } else {
            statusPill = `<span class="status-pill-played">${icon('check', 12)} Played</span>`;
          }

          let oppBadge = `<span style="color:var(--text-muted);font-size:11px;">-</span>`;
          if (pl.opponent && pl.opponent !== '-') {
            let oppShort = pl.opponent_short || pl.opponent;
            oppShort = String(oppShort).replace(/\s*\([HAha]\)/g, '').trim();
            if (oppShort && oppShort !== '-') {
              const diff = pl.difficulty || 3;
              const diffClass = `fdr-${diff}`;
              oppBadge = `<span class="opp-pill ${diffClass}">${oppShort}</span>`;
            }
          }

          squadCards.push({
            element: p.element,
            code: plRaw.code || null,
            firstName: plRaw.first_name || '',
            lastName: plRaw.second_name || pl.web_name,
            clubName: plRaw.team_name || pl.team,
            starter: p.position <= 11,
            benchRole: p.position > 11 ? (p.original_bench_role || (p.position === 12 ? 'GK' : String(p.position - 12))) : '',
            name: pl.web_name,
            team: pl.team,
            type: pl.element_type,
            pts,
            status: pl.match_status,
            minutes: pl.minutes,
            opp: pl.opponent && pl.opponent !== '-' ? String(pl.opponent_short || pl.opponent).replace(/\s*\([HAha]\)/g, '').trim() : '',
            venue: fixtureVenue(pl.team, gw),
            difficulty: pl.difficulty || 3,
            isCaptain: Boolean(p.is_captain),
            isVice: Boolean(p.is_vice_captain),
            multiplier,
            subbedIn: Boolean(p.was_subbed_in),
            subbedOut: Boolean(p.was_subbed_out)
          });

          if (p.position <= 11) {
            if (isYetToPlay) {
              yetToPlayCount++;
            } else {
              playedCount++;
            }

            let subInBadge = '';
            let rowClass = '';
            if (p.was_subbed_in) {
              const subOutPl = playersMap[p.subbed_for_id];
              const outName = subOutPl ? subOutPl.web_name : 'Starter';
              subInBadge = `<span class="auto-sub-badge sub-in" title="Auto-subbed into Starting XI for ${outName}">${icon('swap', 11)} In for ${outName}</span>`;
              rowClass = 'tr-subbed-in';
            }

            startingRows += `
              <tr class="${rowClass}">
                <td class="col-pos"><span class="pos-pill ${posClass}">${posName}</span></td>
                <td class="col-player">
                  <div class="player-name-cell">
                    <span style="font-weight:700;">${pl.web_name}</span>
                    <span class="player-team-pill">${pl.team}</span>
                  </div>
                </td>
                <td class="col-opp">${oppBadge}</td>
                <td class="col-status">${statusPill}</td>
                <td class="col-role">${roleTag} ${subInBadge}</td>
                <td class="col-pts text-center"><span class="player-points-badge" style="${isYetToPlay ? 'color:var(--text-muted);' : (p.was_subbed_in ? 'color:var(--pl-cyan);font-weight:800;' : '')}">${ptsText(pts)}</span></td>
              </tr>
            `;
            startingPtsTotal += pts;
          } else {
            if (isBenchBoostActive) {
              if (isYetToPlay) {
                yetToPlayCount++;
              } else {
                playedCount++;
              }
            }

            const subOrder = p.original_bench_role || (p.position === 12 ? 'GK' : `Sub ${p.position - 12}`);
            let benchOrderTag = `<span class="bench-order-badge">${subOrder}</span>`;
            let rowClass = '';

            if (p.was_subbed_out) {
              const subInPl = playersMap[p.subbed_by_id];
              const inName = subInPl ? subInPl.web_name : 'Bench';
              benchOrderTag += ` <span class="auto-sub-badge sub-out" title="Auto-subbed out to Bench for ${inName}">${icon('swap', 11)} Out for ${inName}</span>`;
              rowClass = 'tr-subbed-out';
            }

            benchRows += `
              <tr class="${rowClass}">
                <td class="col-pos"><span class="pos-pill ${posClass}">${posName}</span></td>
                <td class="col-player">
                  <div class="player-name-cell">
                    <span style="font-weight:700;">${pl.web_name}</span>
                    <span class="player-team-pill">${pl.team}</span>
                  </div>
                </td>
                <td class="col-opp">${oppBadge}</td>
                <td class="col-status">${statusPill}</td>
                <td class="col-role">${benchOrderTag}</td>
                <td class="col-pts text-center"><span class="player-points-badge" style="${isYetToPlay ? 'color:var(--text-muted);' : (isBenchBoostActive ? 'color:var(--pl-cyan);font-weight:800;' : 'color:var(--text-muted);')}">${ptsText(pts)}</span></td>
              </tr>
            `;
            benchPtsTotal += pts;
          }
        });

        benchPts = benchPtsTotal;
      }

      const maxSquadCount = isBenchBoostActive ? 15 : 11;

      const transferCost = (hist.event_transfers_cost !== undefined)
        ? hist.event_transfers_cost
        : ((state.dataset.gameweeks && state.dataset.gameweeks[gw - 1] && state.dataset.gameweeks[gw - 1].hits && state.dataset.gameweeks[gw - 1].hits[manager.id]) || 0);

      if (isPastGw && hist.points_on_bench !== undefined && typeof hist.points_on_bench === 'number') {
        benchPts = hist.points_on_bench;
      } else if (benchPts === 0 && state.dataset.gameweeks && state.dataset.gameweeks[gw - 1] && state.dataset.gameweeks[gw - 1].benchPoints && state.dataset.gameweeks[gw - 1].benchPoints[manager.id] !== undefined) {
        benchPts = state.dataset.gameweeks[gw - 1].benchPoints[manager.id];
      }
      const grossPoints = (isPastGw && hist.points !== undefined && typeof hist.points === 'number')
        ? hist.points
        : (startingPtsTotal + (isBenchBoostActive ? benchPts : 0));
      const netGwPoints = grossPoints - transferCost;

      // ── Summary strip ──────────────────────────────────────
      const playedPct = maxSquadCount > 0 ? Math.round((playedCount / maxSquadCount) * 100) : 0;
      const chipHtml = activeChip && activeChip !== 'None'
        ? `<span class="chip-tag ${getChipColorClass(squadData && squadData.active_chip)}">${activeChip}</span>`
        : '<span class="pm-fact-value">None</span>';

      const summaryHtml = `
        <div class="pm-summary">
          <div class="pm-hero">
            <span class="pm-label">GW${gw} points</span>
            <span class="pm-hero-value">${netGwPoints}</span>
            <span class="pm-hero-sub">${grossPoints} gross${transferCost > 0 ? ` · <span class="pm-neg">−${transferCost} hit</span>` : ' · no hit'}</span>
          </div>
          <div class="pm-facts">
            <div class="pm-fact">
              <span class="pm-label">Played</span>
              <span class="pm-fact-value">${playedCount}<span class="pm-of"> / ${maxSquadCount}</span></span>
              <span class="pm-progress"><span style="width:${playedPct}%"></span></span>
            </div>
            <div class="pm-fact${yetToPlayCount > 0 ? ' pm-fact-ytp' : ''}">
              <span class="pm-label">Yet to play</span>
              <span class="pm-fact-value">${yetToPlayCount}<span class="pm-of"> player${yetToPlayCount === 1 ? '' : 's'}</span></span>
            </div>
            <div class="pm-fact">
              <span class="pm-label">Transfers</span>
              <span class="pm-fact-value">${transfersCount}${transferCost > 0 ? ` <span class="pm-of pm-neg">−${transferCost}</span>` : ''}</span>
            </div>
            <div class="pm-fact">
              <span class="pm-label">Bank</span>
              <span class="pm-fact-value">${bankVal.replace('M', 'm')}</span>
            </div>
            <div class="pm-fact">
              <span class="pm-label">Bench</span>
              <span class="pm-fact-value">${ptsText(benchPts)}</span>
            </div>
            <div class="pm-fact">
              <span class="pm-label">Chip</span>
              ${chipHtml}
            </div>
          </div>
        </div>`;

      // ── Squad: pitch view ──────────────────────────────────
      state.modalSquadCards = squadCards;
      state.modalGw = gw;
      const starters = squadCards.filter(c => c.starter);
      const bench = squadCards.filter(c => !c.starter);
      const pitchRows = [1, 2, 3, 4]
        .map(type => starters.filter(c => c.type === type))
        .filter(row => row.length)
        .map(row => `<div class="pitch-row">${row.map(pitchCardHtml).join('')}</div>`)
        .join('');

      const squadHtml = squadCards.length ? `
        <div class="pm-section">
          <div class="pm-section-head">
            <span class="modal-section-title">${icon('shirt', 15)} Squad <span class="pm-muted">${playedCount} played</span>${yetToPlayCount > 0 ? `<span class="ytp-pill">${icon('clock', 12)} ${yetToPlayCount} yet to play</span>` : '<span class="ytp-pill done">All played</span>'}</span>
            <div class="segmented segmented-sm" role="group" aria-label="Squad view">
              <button class="segmented-btn" data-squad-view="pitch" onclick="setSquadView('pitch')">Pitch</button>
              <button class="segmented-btn" data-squad-view="list" onclick="setSquadView('list')">List</button>
            </div>
          </div>
          <div class="squad-views" data-view="${getSquadView()}">
            <div class="squad-pitch">
              <div class="pitch">${pitchRows}</div>
              <div class="bench-row">
                <span class="bench-label">Bench${isBenchBoostActive ? ' · Bench Boost' : ''}</span>
                <div class="bench-cards">${bench.map(benchCardHtml).join('')}</div>
              </div>
            </div>
            <div class="squad-list">${squadListHtml(starters, bench, benchPts, isBenchBoostActive)}</div>
          </div>
        </div>` : `
        <div class="pm-card pm-empty">Squad not available for Gameweek ${gw} yet.</div>`;

      // ── Gameweek activity: auto-subs + transfers ──────────
      const squadAutoSubs = (typeof autoSubs !== 'undefined') ? autoSubs : [];
      const actSide = (kind, label, player, meta) => `
        <div class="act-side act-${kind}">
          ${kitHtml(player.team, player.element_type === 1, 'act-kit')}
          <div class="act-who">
            <span class="act-label">${label}</span>
            <strong>${player.web_name}</strong>
            <span class="act-meta">${meta}</span>
          </div>
        </div>`;
      const arrow = `<span class="act-arrow">${icon('arrowRight', 16)}</span>`;

      const subRows = squadAutoSubs.map(sub => {
        const pOut = playersMap[sub.element_out] || { web_name: 'Starter', team: '' };
        const pIn = playersMap[sub.element_in] || { web_name: 'Bench', team: '' };
        return `<div class="act-row">${actSide('out', 'Off', pOut, `${pOut.team || ''} · 0 pts`)}${arrow}${actSide('in', 'On', pIn, `${pIn.team || ''} · +${ptsText(pIn.event_points || 0)}`)}</div>`;
      }).join('');

      const allTransfers = transfersHistoryMap[String(manager.id)] || [];
      const gwTransfers = allTransfers.filter(t => t.event === gw);
      const money = c => (c ? `£${(c / 10).toFixed(1)}m` : '');
      const transferRows = gwTransfers.map(t => {
        const pIn = playersMap[t.element_in] || { web_name: 'Player #' + t.element_in, team: '' };
        const pOut = playersMap[t.element_out] || { web_name: 'Player #' + t.element_out, team: '' };
        return `<div class="act-row">${actSide('out', 'Out', pOut, [pOut.team, money(t.element_out_cost)].filter(Boolean).join(' · '))}${arrow}${actSide('in', 'In', pIn, [pIn.team, money(t.element_in_cost)].filter(Boolean).join(' · '))}</div>`;
      }).join('');

      const isOfficialSubs = squadAutoSubs.length && squadAutoSubs[0].is_official;
      const activityHtml = `
        <div class="pm-section">
          <div class="pm-section-head">
            <span class="modal-section-title">${icon('swap', 15)} Gameweek activity</span>
          </div>
          <div class="act-card">
            <div class="act-group">
              <div class="act-group-head">
                <span>Automatic substitutions</span>
                ${squadAutoSubs.length ? `<span class="${isOfficialSubs ? 'auto-sub-confirmed-tag' : 'auto-sub-live-tag'}">${isOfficialSubs ? 'Confirmed' : 'Live preview'}</span>` : ''}
              </div>
              ${subRows || '<div class="act-none">None</div>'}
            </div>
            <div class="act-group">
              <div class="act-group-head">
                <span>Transfers</span>
                <span class="act-summary">${gwTransfers.length} made · ${transferCost > 0 ? `<span class="pm-neg">−${transferCost} pts hit</span>` : 'no hit'}</span>
              </div>
              ${transferRows || '<div class="act-none">None</div>'}
            </div>
          </div>
        </div>`;

      modalBody.innerHTML = `
        ${summaryHtml}
        ${squadHtml}
        ${activityHtml}
      `;
      syncSquadViewButtons();
    } catch (err) {
      console.error('Error rendering squad modal:', err);
      modalBody.innerHTML = `<div style="padding:24px;text-align:center;color:#ef4444;font-weight:600;">Failed to render squad details: ${err.message}</div>`;
    }
  };

  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('managerDetailModal');
    const isModalOpen = modal && modal.classList.contains('open');

    if (e.key === 'Escape' && document.getElementById('matchDetail')) {
      closeMatchDetail();
    } else if (e.key === 'Escape' && document.getElementById('pointsPopover')) {
      closePointsBreakdown();
    } else if (e.key === 'Escape') {
      closeManagerModal();
    } else if (isModalOpen && e.key === 'ArrowLeft') {
      e.preventDefault();
      navigateManagerModal(-1);
    } else if (isModalOpen && e.key === 'ArrowRight') {
      e.preventDefault();
      navigateManagerModal(1);
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
