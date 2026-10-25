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
    gwSelect:               document.getElementById('gwSelect'),
    prevGwBtn:              document.getElementById('prevGwBtn'),
    nextGwBtn:              document.getElementById('nextGwBtn'),
    goToCurrentGwBtn:       document.getElementById('goToCurrentGwBtn'),
    standingsBody:          document.getElementById('standingsBody'),
    mobileCards:            document.getElementById('mobileCards'),
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
  function populateGwSelect() {
    elements.gwSelect.innerHTML = '';
    for (let i = 1; i <= state.maxGw; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Gameweek ${i}`;
      if (i === state.currentGw) opt.selected = true;
      elements.gwSelect.appendChild(opt);
    }
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
    elements.gwSelect.addEventListener('change', e => {
      state.viewMode = 'overall';
      if (elements.viewModeSelect) elements.viewModeSelect.value = 'overall';
      changeGw(parseInt(e.target.value));
    });

    if (elements.viewModeSelect) {
      elements.viewModeSelect.addEventListener('change', e => {
        state.viewMode = e.target.value;
        renderStandingsTable();
      });
    }

    // #7 — "Latest GW" Quick Jump
    if (elements.goToCurrentGwBtn) {
      elements.goToCurrentGwBtn.addEventListener('click', () => changeGw(state.maxGw));
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

    const abaBtn = document.getElementById('toggleAbaBtn');
    if (abaBtn) {
      abaBtn.classList.toggle('active', state.showAba);
      abaBtn.setAttribute('aria-pressed', String(state.showAba));
      abaBtn.addEventListener('click', () => {
        state.showAba = !state.showAba;
        try { localStorage.setItem('fpl_show_aba', state.showAba ? '1' : '0'); } catch (e) {}
        abaBtn.classList.toggle('active', state.showAba);
        abaBtn.setAttribute('aria-pressed', String(state.showAba));
        renderStandingsTable();
      });
    }

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

    initExportImageHandlers();
  }

  // ===================== TOAST & EXPORT IMAGE HELPERS =====================
  function showToast(msg) {
    let toast = document.querySelector('.fpl-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'fpl-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // ===================== SHARE CARD (image export) =====================
  // A fixed-width, always-light card built just for sharing, so the image looks
  // the same whatever the screen size or theme.
  function buildShareCard() {
    const isMonthlyView = Boolean(state.viewMode && state.viewMode !== 'overall');
    const standings = isMonthlyView ? getMonthlyStandings(state.viewMode) : getGameweekStandings(state.currentGw);
    const monthObj = isMonthlyView && state.dataset.months
      ? state.dataset.months.find(m => m.name.toLowerCase() === state.viewMode.toLowerCase())
      : null;
    const leagueName = (elements.leagueNameHeader && elements.leagueNameHeader.textContent) || state.dataset.leagueName || '';

    const title = isMonthlyView
      ? `${monthObj ? monthObj.name : state.viewMode} standings & payouts`
      : `Gameweek ${state.currentGw} standings & payouts`;

    const statusObj = state.eventStatuses && state.eventStatuses[state.currentGw];
    const isFinal = Boolean(statusObj && statusObj.finished && statusObj.data_checked);
    const statusTag = isMonthlyView ? '' : `<span class="sc-status ${isFinal ? 'final' : 'live'}">${isFinal ? 'Final' : 'Provisional'}</span>`;
    const dateText = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    const seasonNow = isMonthlyView ? {} : getSeasonRankMap(state.currentGw);
    const seasonPrev = isMonthlyView ? {} : getSeasonRankMap(state.currentGw - 1);

    const rows = standings.map(m => {
      const aba = ABA_ACCOUNTS[m.id] || '–';
      const hit = m.hitCost > 0 ? ` <span class="sc-hit">−${m.hitCost}</span>` : '';
      const ptsCell = isMonthlyView
        ? `<td class="sc-num"><strong>${m.netScore}</strong></td>`
        : `<td class="sc-num"><strong>${m.netScore}</strong><span class="sc-sub">${m.grossScore} gross${hit}</span></td>
           <td class="sc-num"><span class="sc-season">${m.seasonTotalNet}${seasonMoveHtml(m.id, seasonNow, seasonPrev)}</span></td>`;
      return `
        <tr class="${m.statusClass}">
          <td class="sc-pos"><span class="rank-num ${getRankClass(m.rank, m.payout)}">${m.rank}</span></td>
          <td>${managerCellHtml(m)}</td>
          <td class="sc-aba">${aba}</td>
          ${ptsCell}
          <td class="sc-pay">${payoutBadgeHtml(m.payout)}<span class="sc-sub">${m.payoutNote || ''}</span></td>
        </tr>`;
    }).join('');

    const banners = ['motsBannerContainer', 'motmBannerContainer']
      .map(id => (document.getElementById(id) || {}).innerHTML || '')
      .join('');

    const card = document.createElement('div');
    card.className = 'share-card';
    card.setAttribute('data-theme', 'light');
    card.innerHTML = `
      <div class="sc-stripe"></div>
      <div class="sc-header">
        <div class="sc-brand">
          <span class="sc-mark">${icon('trophy', 18)}</span>
          <div>
            <div class="sc-league">${leagueName}</div>
            <div class="sc-title">${title}</div>
          </div>
        </div>
        <div class="sc-meta">${statusTag}<span>${dateText}</span></div>
      </div>
      ${banners ? `<div class="sc-banners">${banners}</div>` : ''}
      <table class="sc-table">
        <thead>
          <tr>
            <th class="sc-pos">#</th>
            <th>Manager</th>
            <th class="sc-aba">ABA</th>
            ${isMonthlyView ? '<th class="sc-num">Month pts</th>' : '<th class="sc-num">Net pts</th><th class="sc-num">Season</th>'}
            <th class="sc-pay">Payout</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
    return card;
  }

  function initExportImageHandlers() {
    const copyBtn = document.getElementById('copyStandingsImgBtn');
    const downloadBtn = document.getElementById('downloadStandingsImgBtn');

    const capturePngUrl = async () => {
      if (typeof htmlToImage === 'undefined') return null;
      const stage = document.createElement('div');
      stage.className = 'share-card-stage';
      const card = buildShareCard();
      stage.appendChild(card);
      document.body.appendChild(stage);

      try {
        await document.fonts.ready;
        return await htmlToImage.toPng(card, { pixelRatio: 2, backgroundColor: '#ffffff' });
      } catch (err) {
        console.warn('htmlToImage capture failed:', err);
      } finally {
        stage.remove();
      }
      return null;
    };

    if (downloadBtn) {
      downloadBtn.addEventListener('click', async () => {
        const originalHtml = downloadBtn.innerHTML;
        downloadBtn.innerHTML = `${icon('loader')} Generating…`;
        downloadBtn.disabled = true;
        const dataUrl = await capturePngUrl();
        downloadBtn.innerHTML = originalHtml;
        downloadBtn.disabled = false;
        if (dataUrl) {
          const isMonthly = state.viewMode && state.viewMode !== 'overall';
          const link = document.createElement('a');
          link.download = isMonthly ? `${state.viewMode.toUpperCase()}_Standings_Payouts.png` : `GW${state.currentGw}_Standings_Payouts.png`;
          link.href = dataUrl;
          link.click();
          showToast('Image downloaded successfully!');
        } else {
          showToast('Failed to generate image');
        }
      });
    }

    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = `${icon('loader')} Generating…`;
        copyBtn.disabled = true;
        const dataUrl = await capturePngUrl();
        copyBtn.innerHTML = originalHtml;
        copyBtn.disabled = false;
        if (dataUrl) {
          try {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            showToast('Copied image to clipboard. Ready to paste into WhatsApp or Telegram.');
          } catch (err) {
            console.warn('Clipboard write error:', err);
            showToast('Clipboard direct write restricted. Use "Download PNG" instead!');
          }
        } else {
          showToast('Failed to generate image');
        }
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

    try {
      // Race all proxies simultaneously — fastest valid proxy wins!
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
                    event_points: el.event_points || 0
                  };
                } else {
                  state.dataset.players[el.id].event_points = el.event_points || 0;
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
            liveEventData.elements.forEach(el => {
              if (el && el.id && el.stats) {
                elStatsMap[el.id] = el.stats;
              }
            });
          }

          if (fixData && Array.isArray(fixData)) {
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

  // ===================== GW NAVIGATION =====================
  function changeGw(newGw) {
    if (newGw < 1 || newGw > state.maxGw) return;
    state.currentGw = newGw;
    elements.gwSelect.value = newGw;
    elements.gwDisplay.textContent = `Gameweek ${newGw}`;
    
    if (elements.standingsGwBadge) {
      elements.standingsGwBadge.textContent = `Gameweek ${newGw}`;
    }

    elements.prevGwBtn.disabled = newGw === 1;
    elements.nextGwBtn.disabled = newGw === state.maxGw;
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
    if (elements.mobileCards) elements.mobileCards.innerHTML = '<div class="skeleton skeleton-card"></div>'.repeat(4);
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

    const abaTh = state.showAba ? '<th class="text-center">ABA</th>' : '';

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

    elements.standingsBody.innerHTML = '';
    if (elements.mobileCards) elements.mobileCards.innerHTML = '';

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
        : '';

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

      // =========== MOBILE CARD ===========
      if (elements.mobileCards) {
        const card = document.createElement('div');
        card.className = `mobile-manager-card ${m.statusClass}${m.isTied ? ' tr-tied' : ''}${changed ? ' row-flash' : ''}`;
        card.dataset.managerId = m.id;
        card.addEventListener('click', () => openManagerModal(m.id));

        const statItem = (label, value) => `
          <div class="mobile-stat-item">
            <span class="mobile-stat-label">${label}</span>
            <span class="mobile-stat-value">${value}</span>
          </div>`;

        const abaStat = state.showAba && abaAccount ? statItem('ABA', `<span class="mobile-aba">${abaAccount}</span>`) : '';
        const transfersStat = statItem('Transfers', `${m.transfers}${m.hitCost > 0 ? ` <span class="hit-tag has-hit">(-${m.hitCost})</span>` : ''}`);
        const chipStat = statItem('Chip', m.chip ? getChipLabel(m.chip) : '–');

        let statsHtml;
        if (isMonthlyView) {
          const gwBreakdownHtml = monthGws.map(gw => {
            const scoreVal = (m.gwBreakdown && m.gwBreakdown[gw] !== undefined) ? m.gwBreakdown[gw] : '–';
            return statItem(`GW${gw}`, scoreVal);
          }).join('');
          statsHtml = abaStat + statItem(`${activeMonthName} Pts`, `<span class="text-accent">${m.netScore}</span>`) + transfersStat + gwBreakdownHtml + chipStat;
        } else {
          statsHtml = abaStat
            + statItem('Net Pts', `<span class="text-accent">${m.netScore}</span>`)
            + statItem('Season', `${m.seasonTotalNet} ${moveHtml}`)
            + statItem('Gross', m.grossScore)
            + transfersStat
            + chipStat;
        }

        card.innerHTML = `
          <div class="mobile-card-top">
            <div class="mobile-card-rank-name">
              <div class="rank-num ${rankClass}">${m.rank}</div>
              ${managerCellHtml(m, tiedPill, tiebreakerDetail)}
            </div>
            ${payoutBadge}
          </div>
          <div class="mobile-card-stats">${statsHtml}</div>
          <div class="mobile-card-bottom">
            <div class="form-pill-container">${formHtml}</div>
            <span class="payout-note">${m.payoutNote}</span>
          </div>
        `;
        elements.mobileCards.appendChild(card);
      }
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
    elements.chipTrackerContainer.innerHTML = '';

    managerData.forEach(m => {
      const card = document.createElement('div');
      card.className = 'chip-card';

      const chipListHtml = m.chipsStatus.map(c => {
        const shortLabel = getChipLabel(c.chipName);
        if (c.used) {
           return `
             <div class="chip-pill-compact used ${c.colorClass}">
               <span class="cp-name">${shortLabel}</span>
               <span class="cp-gw">GW${c.usedGw}</span>
             </div>`;
        } else {
           return `
             <div class="chip-pill-compact available">
               <span class="cp-name">${shortLabel}</span>
             </div>`;
        }
      }).join('');

      card.innerHTML = `
        <div class="chip-card-header">${managerCellHtml(m)}</div>
        <div class="chip-pills-row">${chipListHtml}</div>
      `;

      elements.chipTrackerContainer.appendChild(card);
    });
  }

  function populateStatusGwDropdown(activeGw) {
    const select = document.getElementById('statusGwSelect');
    const prevBtn = document.getElementById('statusPrevGwBtn');
    const nextBtn = document.getElementById('statusNextGwBtn');
    if (!select) return;
    let html = '';
    for (let gw = 1; gw <= 38; gw++) {
      const isCurrentMark = (gw === (state.currentGw || 1)) ? ' (Current)' : '';
      const selected = (gw === activeGw) ? 'selected' : '';
      html += `<option value="${gw}" ${selected}>Gameweek ${gw}${isCurrentMark}</option>`;
    }
    select.innerHTML = html;
    if (prevBtn) prevBtn.disabled = activeGw <= 1;
    if (nextBtn) nextBtn.disabled = activeGw >= 38;
  }

  window.selectStatusGw = function(val) {
    state.statusGw = parseInt(val, 10) || 1;
    renderGwStatus();
  };

  window.jumpToCurrentStatusGw = function() {
    state.statusGw = state.currentGw || 1;
    renderGwStatus();
  };

  window.changeStatusGw = function(delta) {
    const current = state.statusGw || state.currentGw || 1;
    const nextGw = Math.max(1, Math.min(38, current + delta));
    state.statusGw = nextGw;
    renderGwStatus();
  };

  function renderGwStatus() {
    const spotlightContainer = document.getElementById('gwSpotlightContainer');
    if (!spotlightContainer) return;

    const gw = state.currentGw || 1;
    let statusObj = state.eventStatuses[gw];

    const inputVal = (state.leagueIdInput ? state.leagueIdInput.value.trim().toLowerCase() : '');
    const isDemoMode = inputVal === 'demo' || state.isDemoMode === true;
    const isRealLeague = !isDemoMode;

    const activeManagers = state.dataset.managers || [];
    const currentGwData = state.dataset.gameweeks ? state.dataset.gameweeks.find(g => g.gw === gw) : null;
    const hasLiveScores = activeManagers.length > 0 && currentGwData && activeManagers.some(m => (currentGwData.scores[m.id] || 0) > 0);

    if (!statusObj) {
      statusObj = {
        gw: gw,
        finished: isDemoMode,
        data_checked: isDemoMode,
        bonus_added: isDemoMode,
        leagues: isDemoMode ? 'Updated' : (hasLiveScores ? 'Updated' : 'Pending'),
        daily_status: [],
        is_current: hasLiveScores || isDemoMode || gw === 1
      };
    } else {
      if (statusObj.is_current === undefined) statusObj.is_current = (gw === state.currentGw || hasLiveScores);
      if (hasLiveScores && !statusObj.leagues) statusObj.leagues = 'Updated';
    }

    // Determine daily_status for current/past/future GWs
    let dailyStatus = (statusObj && statusObj.daily_status && statusObj.daily_status.length > 0)
      ? statusObj.daily_status
      : null;

    if (!dailyStatus || dailyStatus.length === 0) {
      if (isDemoMode) {
        dailyStatus = [
          { date: '2026-08-22', points: 'r', bonus_added: true },
          { date: '2026-08-23', points: 'r', bonus_added: true }
        ];
      } else if (gw === 1) {
        // GW1 Live matchday tracking:
        // Friday: Finished & Bonus Added
        // Saturday: Match points updated, Bonus processing live
        // Sunday: Pending
        const isFinished = Boolean(statusObj.finished && statusObj.data_checked);
        dailyStatus = [
          { date: '2026-08-21', points: 'r', bonus_added: true },
          { date: '2026-08-22', points: 'r', bonus_added: isFinished },
          { date: '2026-08-23', points: isFinished ? 'r' : 'p', bonus_added: isFinished }
        ];
      } else {
        const isFinished = Boolean(statusObj.finished && statusObj.data_checked);
        let gwStart = new Date(2026, 7, 21);
        if (statusObj.deadline_time) gwStart = new Date(statusObj.deadline_time);
        else gwStart = new Date(gwStart.getTime() + (gw - 1) * 7 * 86400000);

        const d1 = new Date(gwStart.getTime() + 1 * 86400000).toISOString().split('T')[0];
        const d2 = new Date(gwStart.getTime() + 2 * 86400000).toISOString().split('T')[0];
        dailyStatus = [
          { date: d1, points: isFinished ? 'r' : 'p', bonus_added: isFinished },
          { date: d2, points: isFinished ? 'r' : 'p', bonus_added: isFinished }
        ];
      }
    }

    // Normalize dailyStatus from official FPL API status
    const normalizedDailyStatus = dailyStatus.map(day => {
      const ptsRaw = (day.points || '').trim().toLowerCase();
      return {
        ...day,
        points: ptsRaw, // 'r', 'p', or ''
        bonus_added: Boolean(day.bonus_added)
      };
    });

    const isGwFinalized = Boolean(statusObj.finished && statusObj.data_checked) || (normalizedDailyStatus.length > 0 && normalizedDailyStatus.every(d => d.points === 'r' && d.bonus_added));
    const isGwInProgress = !isGwFinalized && (statusObj.is_current || hasLiveScores || normalizedDailyStatus.some(d => d.points === 'r' || d.points === 'p'));

    // Determine overall status label
    let overallStatusLabel = 'Upcoming';
    let overallStatusClass = 'pipe-badge-muted';

    if (isDemoMode || isGwFinalized) {
      overallStatusLabel = 'Finalized';
      overallStatusClass = 'pipe-badge-success';
    } else if (isGwInProgress) {
      overallStatusLabel = 'In Progress';
      overallStatusClass = 'pipe-badge-live';
    }

    // ── Compute progress bar ──────────────────────────────
    const doneDays    = isGwFinalized ? normalizedDailyStatus.length : normalizedDailyStatus.filter(d => d.points === 'r' && d.bonus_added).length;
    const totalDays   = normalizedDailyStatus.length;
    const progressPct = totalDays > 0 ? Math.round((doneDays / totalDays) * 100) : 0;
    const progressLabel = `${doneDays} of ${totalDays} day${totalDays !== 1 ? 's' : ''} finalized`;

    // ── Helpers ───────────────────────────────────────────
    const CHECK  = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="margin-right:4px;vertical-align:middle"><path d="M1.5 5L3.8 7.5L8.5 2.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    const SPIN   = `<svg width="10" height="10" viewBox="0 0 10 10" fill="none" style="margin-right:4px;vertical-align:middle"><path d="M5 1A4 4 0 1 1 1 5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
    const CLOCK  = `<span style="margin-right:4px;font-size:9px;vertical-align:middle">○</span>`;

    const makeTag = (type, label) => {
      const icon = type === 'done' ? CHECK : (type === 'active' ? SPIN : CLOCK);
      return `<span class="day-tag tag-${type}">${icon}${label}</span>`;
    };

    // ── Fixtures helper: count matches on each day ──────────────
    const KNOWN_MATCH_COUNTS = {
      // GW1
      '2026-08-21': 1, '2026-08-22': 5, '2026-08-23': 3, '2026-08-24': 1,
      // GW2
      '2026-08-28': 1, '2026-08-29': 4, '2026-08-30': 4, '2026-08-31': 1,
      // GW3
      '2026-09-04': 1, '2026-09-05': 7, '2026-09-06': 2,
      // GW4
      '2026-09-12': 7, '2026-09-13': 2, '2026-09-14': 1
    };

    const getMatchCountForDay = (dateStr) => {
      const fixturesList = state.fixtures || 
                           (state.dataset && state.dataset.fixtures) || 
                           (window.FPL_LIVE_STATIC && window.FPL_LIVE_STATIC.fixtures) || [];
      if (Array.isArray(fixturesList) && fixturesList.length > 0) {
        const matchesOnDate = fixturesList.filter(f => f && f.kickoff_time && f.kickoff_time.split('T')[0] === dateStr);
        if (matchesOnDate.length > 0) {
          return matchesOnDate.length;
        }
      }
      if (KNOWN_MATCH_COUNTS[dateStr] !== undefined) {
        return KNOWN_MATCH_COUNTS[dateStr];
      }
      return 1;
    };

    // ── Build rows matching official matchday calendar ──────────────
    const tableRows = normalizedDailyStatus.map((day, idx, arr) => {
      const [y, m, d] = day.date.split('-').map(Number);
      const dateObj = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
      const weekday = dateObj.toLocaleDateString('en-GB', { weekday: 'long', timeZone: 'UTC' });
      const dateFmt = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

      const isDayConfirmed = isGwFinalized || (day.points === 'r' && day.bonus_added);
      const isDayLiveOrProvisional = !isDayConfirmed && (day.points === 'p' || day.points === 'r');
      const isDayUpcoming = !isDayConfirmed && !isDayLiveOrProvisional;

      const matchCount = getMatchCountForDay(day.date);
      const fixturesLabel = matchCount === 1 ? '(1 match)' : `(${matchCount} matches)`;

      let dayStatusBadge = '';
      let ptsType = 'pending';
      let ptsLabel = 'Pending';
      let bonusType = 'pending';
      let bonusLabel = 'Pending';
      let leaguesTagType = 'pending';
      let leaguesLabel = 'Pending';

      if (isDayConfirmed) {
        dayStatusBadge = `<span class="fpl-status-badge fpl-badge-final">CONFIRMED</span>`;
        ptsType = 'done'; ptsLabel = 'Updated';
        bonusType = 'done'; bonusLabel = 'Added';
        leaguesTagType = 'done'; leaguesLabel = 'Updated';
      } else if (isDayLiveOrProvisional) {
        if (day.bonus_added) {
          dayStatusBadge = `<span class="fpl-status-badge fpl-badge-final">CONFIRMED</span>`;
          bonusType = 'done'; bonusLabel = 'Added';
        } else {
          dayStatusBadge = `<span class="fpl-status-badge fpl-badge-provisional">PROVISIONAL</span>`;
          bonusType = 'active'; bonusLabel = 'Processing';
        }
        ptsType = 'done'; ptsLabel = 'Updated';
        const leaguesUpdating = (statusObj.leagues || '').toLowerCase() === 'updating';
        leaguesTagType = leaguesUpdating ? 'active' : 'pending';
        leaguesLabel = leaguesUpdating ? 'Updating…' : 'Pending';
      } else {
        dayStatusBadge = `<span class="fpl-status-badge fpl-badge-upcoming">YET TO PLAY</span>`;
        ptsType = 'pending'; ptsLabel = 'Pending';
        bonusType = 'pending'; bonusLabel = 'Pending';
        leaguesTagType = 'pending'; leaguesLabel = 'Pending';
      }

      const rowClass = isDayConfirmed ? 'row-done' : (isDayLiveOrProvisional ? 'row-active' : 'row-pending');

      return `
        <tr class="daily-row ${rowClass}">
          <td class="daily-td-date">
            <span class="date-weekday">${weekday}</span>
            <span class="date-short">${dateFmt}</span>
          </td>
          <td>${dayStatusBadge}</td>
          <td><span class="fixtures-count-badge">${fixturesLabel}</span></td>
          <td>${makeTag(ptsType, ptsLabel)}</td>
          <td>${makeTag(bonusType, bonusLabel)}</td>
          <td>${makeTag(leaguesTagType, leaguesLabel)}</td>
        </tr>
      `;
    }).join('');

    // ── Last-synced timestamp ─────────────────────────────
    const now = new Date();
    const syncTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const syncDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    const tableHtml = `
      <div class="tracker-progress-bar-wrap">
        <div class="tracker-progress-bar-track">
          <div class="tracker-progress-bar-fill" style="width:${progressPct}%"></div>
        </div>
        <span class="tracker-progress-label">${progressLabel}</span>
      </div>
      <div class="premium-table-container">
        <table class="daily-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day Status</th>
              <th>Fixtures</th>
              <th>Match Points</th>
              <th>Bonus Points</th>
              <th>League Standings</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
      <div class="tracker-footer">
        <span class="tracker-sync-label">Last synced: ${syncDate}, ${syncTime}</span>
      </div>
    `;

    spotlightContainer.innerHTML = `
      <div class="pipe-card-premium">
        <div class="pipe-card-top">
          <div class="pipe-card-title-area">
            <div class="pipe-card-gw">Gameweek ${gw}</div>
            <div class="pipe-card-subtitle">Daily Processing Tracker</div>
          </div>
          <div class="pipe-card-right">
            <span class="pipe-badge ${overallStatusClass}">${overallStatusLabel}</span>
          </div>
        </div>
        ${tableHtml}
      </div>
    `;

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
      ds.borderWidth = focusIndex !== null && i === focusIndex ? 3.5 : 2;
      ds.order = focusIndex !== null && i === focusIndex ? -1 : 0;
    });
    chart.update('none');
  }

  function initChart() {
    const ctx = document.getElementById('rankChart');
    if (!ctx) return;
    const labels = Array.from({ length: state.maxGw }, (_, i) => `GW${i + 1}`);
    state.chartInstance = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: buildDatasets() },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 6, bottom: 6, right: 6 } },
        scales: {
          y: {
            reverse: true,
            min: 1,
            max: state.dataset.managers.length,
            ticks: { stepSize: 1, color: getChartTextColor(), font: { weight: '600' } },
            grid: { color: getChartGridColor() }
          },
          x: {
            ticks: { color: getChartTextColor(), font: { weight: '600' } },
            grid: { color: getChartGridColor() }
          }
        },
        plugins: {
          legend: {
            onHover: (e, item, legend) => focusRankLine(legend.chart, item.datasetIndex),
            onLeave: (e, item, legend) => focusRankLine(legend.chart, null),
            labels: { color: getChartTextColor(), font: { family: CHART_FONT, weight: '600' }, usePointStyle: true, boxWidth: 8, boxHeight: 8 }
          }
        }
      }
    });
  }

  function updateChartTheme() {
    if (!state.chartInstance) return;
    state.chartInstance.options.scales.y.ticks.color = getChartTextColor();
    state.chartInstance.options.scales.y.grid.color = getChartGridColor();
    state.chartInstance.options.scales.x.ticks.color = getChartTextColor();
    state.chartInstance.options.scales.x.grid.color = getChartGridColor();
    state.chartInstance.options.plugins.legend.labels.color = getChartTextColor();
    state.chartInstance.update();
  }

  function updateChart() {
    if (!state.chartInstance) return;
    state.chartInstance.data.datasets = buildDatasets();
    state.chartInstance.options.scales.y.max = state.dataset.managers.length;
    updateChartTheme();
  }

  // ===================== PERFORMANCE CHART =====================
  function initPerformanceChart() {
    const ctx = document.getElementById('performanceChart');
    if (!ctx) return;
    
    const summary = getManagerSeasonSummary();
    const labels = summary.map(s => s.name);
    
    state.perfChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Wins',
            data: summary.map(s => s.wins),
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            borderColor: '#10b981',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Losses',
            data: summary.map(s => s.losses),
            backgroundColor: 'rgba(239, 68, 68, 0.7)',
            borderColor: '#ef4444',
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: 'Neutrals',
            data: summary.map(s => s.neutrals),
            backgroundColor: 'rgba(148, 163, 184, 0.7)',
            borderColor: '#94a3b8',
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            stacked: true,
            beginAtZero: true,
            ticks: { color: getChartTextColor(), font: { weight: '600' }, stepSize: 1 },
            grid: { color: getChartGridColor() }
          },
          y: {
            stacked: true,
            ticks: { color: getChartTextColor(), font: { weight: '600' } },
            grid: { display: false }
          }
        },
        plugins: {
          legend: { 
            display: true,
            labels: { color: getChartTextColor(), font: { family: CHART_FONT, weight: '600' }, usePointStyle: true, boxWidth: 8, boxHeight: 8 }
          }
        }
      }
    });
  }

  function updatePerformanceChartTheme() {
    if (!state.perfChartInstance) return;
    state.perfChartInstance.options.scales.y.ticks.color = getChartTextColor();
    state.perfChartInstance.options.scales.y.grid.color = getChartGridColor();
    state.perfChartInstance.options.scales.x.ticks.color = getChartTextColor();
    if (state.perfChartInstance.options.plugins.legend) {
      state.perfChartInstance.options.plugins.legend.labels.color = getChartTextColor();
    }
    state.perfChartInstance.update();
  }

  function updatePerformanceChart() {
    if (!state.perfChartInstance) return;
    const summary = getManagerSeasonSummary();
    
    state.perfChartInstance.data.labels = summary.map(s => s.name);
    state.perfChartInstance.data.datasets[0].data = summary.map(s => s.wins);
    state.perfChartInstance.data.datasets[1].data = summary.map(s => s.losses);
    state.perfChartInstance.data.datasets[2].data = summary.map(s => s.neutrals);
    
    updatePerformanceChartTheme();
  }

  // ===================== SQUAD PANEL HELPERS =====================
  const FT_MAX = 5;

  // Free transfers rebuilt from each gameweek's entry history:
  // 1 free transfer from GW2, +1 per gameweek up to FT_MAX, minus transfers made.
  // Wildcard / Free Hit weeks keep the banked transfers.
  function computeFreeTransfers(mgrPicks, gw) {
    if (!mgrPicks || gw < 1) return null;
    const histFor = g => {
      const sq = mgrPicks[String(g)] || mgrPicks[Number(g)];
      return sq && sq.entry_history ? { hist: sq.entry_history, chip: sq.active_chip || '' } : null;
    };
    let ftAvail = 1; // available at the start of GW2
    let atStart = gw === 1 ? 0 : 1;
    let used = 0;
    let chipName = '';
    for (let g = 2; g <= gw; g++) {
      const h = histFor(g);
      if (!h) return null;
      const n = Number(h.hist.event_transfers) || 0;
      const chip = String(h.chip).toLowerCase();
      const keepsBank = chip.includes('wildcard') || chip.includes('freehit') || chip.includes('free hit');
      if (g === gw) { atStart = ftAvail; used = n; chipName = keepsBank ? getChipLabel(h.chip) : ''; }
      if (!keepsBank) ftAvail = Math.max(0, ftAvail - n);
      ftAvail = Math.min(FT_MAX, ftAvail + 1);
    }
    if (gw === 1) {
      const h = histFor(1);
      used = h ? Number(h.hist.event_transfers) || 0 : 0;
    }
    return { atStart, used, next: ftAvail, chip: chipName };
  }

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

  function pitchCardHtml(c) {
    const color = CLUB_COLORS[String(c.team).toUpperCase()] || '#8a8197';
    const statusCls = c.status === 'yet_to_play' ? 'is-pending' : (c.status === 'live' ? 'is-live' : (c.status === 'dnp' ? 'is-dnp' : 'is-played'));
    const role = c.isCaptain
      ? `<span class="pc-role pc-c" title="Captain ×${c.multiplier}">C</span>`
      : (c.isVice ? '<span class="pc-role pc-v" title="Vice-captain">V</span>' : '');
    const subTag = c.subbedIn ? '<span class="pc-sub in" title="Auto-subbed in">↑</span>'
      : (c.subbedOut ? '<span class="pc-sub out" title="Auto-subbed out">↓</span>' : '');
    const live = c.status === 'live' ? `<span class="pc-live">${c.minutes || 0}'</span>` : '';
    return `
      <div class="pc ${statusCls}${c.subbedOut ? ' is-out' : ''}${c.subbedIn ? ' is-in' : ''}">
        ${role}${subTag}
        ${c.benchRole ? `<span class="pc-bench-role">${c.benchRole}</span>` : ''}
        <svg class="pc-shirt" viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 3.5 16 2a4 4 0 0 1-8 0L3.6 3.5a2 2 0 0 0-1.3 2.2l.6 3.5a1 1 0 0 0 1 .8H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.1a1 1 0 0 0 1-.8l.6-3.5a2 2 0 0 0-1.3-2.2z" fill="${color}" stroke="rgba(0,0,0,0.25)" stroke-width="0.8"/></svg>
        <span class="pc-name">${c.name}</span>
        <span class="pc-pts">${c.status === 'yet_to_play' ? '–' : c.pts}${live}</span>
        <span class="pc-opp">${c.opp ? `<span class="pc-fdr fdr-${c.difficulty}"></span>${c.opp}` : c.team}</span>
      </div>`;
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
            starter: p.position <= 11,
            benchRole: p.position > 11 ? (p.original_bench_role || (p.position === 12 ? 'GK' : String(p.position - 12))) : '',
            name: pl.web_name,
            team: pl.team,
            type: pl.element_type,
            pts,
            status: pl.match_status,
            minutes: pl.minutes,
            opp: pl.opponent && pl.opponent !== '-' ? String(pl.opponent_short || pl.opponent).replace(/\s*\([HAha]\)/g, '').trim() : '',
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

      // ── Free transfers ─────────────────────────────────────
      const ft = computeFreeTransfers(mgrPicks, gw);
      let freeTransfersHtml = '';
      if (ft) {
        const dots = Array.from({ length: FT_MAX }, (_, i) => `<span class="ft-dot${i < ft.next ? ' on' : ''}"></span>`).join('');
        freeTransfersHtml = `
          <div class="pm-card ft-card">
            <div class="ft-main">
              <span class="ft-count">${ft.next}</span>
              <div>
                <div class="ft-title">Free transfer${ft.next === 1 ? '' : 's'} for GW${gw + 1}</div>
                <div class="ft-dots" aria-label="${ft.next} of ${FT_MAX}">${dots}</div>
              </div>
            </div>
            <div class="ft-detail">
              <span>GW${gw}: had <strong>${ft.atStart}</strong></span>
              <span>used <strong>${ft.used}</strong></span>
              <span>${transferCost > 0 ? `<span class="pm-neg">−${transferCost} pts hit</span>` : 'no hit'}</span>
              ${ft.chip ? `<span>${ft.chip} played</span>` : ''}
            </div>
          </div>`;
      }

      // ── Squad: pitch view ──────────────────────────────────
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
            <span class="modal-section-title">${icon('shirt', 15)} Squad <span class="pm-muted">${playedCount} played · ${yetToPlayCount} to play</span></span>
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
                <div class="bench-cards">${bench.map(pitchCardHtml).join('')}</div>
              </div>
            </div>
            <div class="squad-list">
              <table class="modal-squad-table">
                <thead><tr><th class="col-pos">Pos</th><th class="col-player">Player</th><th class="col-opp">Opponent</th><th class="col-status">Status</th><th class="col-role">Role</th><th class="col-pts text-center">Points</th></tr></thead>
                <tbody>${startingRows}</tbody>
              </table>
              <div class="pm-subhead">Bench · ${ptsText(benchPts)}</div>
              <table class="modal-squad-table">
                <thead><tr><th class="col-pos">Pos</th><th class="col-player">Player</th><th class="col-opp">Opponent</th><th class="col-status">Status</th><th class="col-role">Role</th><th class="col-pts text-center">Points</th></tr></thead>
                <tbody>${benchRows}</tbody>
              </table>
            </div>
          </div>
        </div>` : `
        <div class="pm-card pm-empty">Squad not available for Gameweek ${gw} yet.</div>`;

      // ── Gameweek activity: auto-subs + transfers ──────────
      const activityItems = [];
      const squadAutoSubs = (typeof autoSubs !== 'undefined') ? autoSubs : [];
      squadAutoSubs.forEach(sub => {
        const pOut = playersMap[sub.element_out] || { web_name: 'Starter' };
        const pIn = playersMap[sub.element_in] || { web_name: 'Bench' };
        activityItems.push(`
          <li class="act-item">
            <span class="act-icon act-sub">${icon('swap', 14)}</span>
            <div class="act-body">
              <div class="act-line"><strong>${pIn.web_name}</strong> came on for <strong>${pOut.web_name}</strong></div>
              <div class="act-meta">Automatic substitution · +${pIn.event_points || 0} pts
                <span class="${sub.is_official ? 'auto-sub-confirmed-tag' : 'auto-sub-live-tag'}">${sub.is_official ? 'Confirmed' : 'Live preview'}</span>
              </div>
            </div>
          </li>`);
      });

      const allTransfers = transfersHistoryMap[String(manager.id)] || [];
      allTransfers.filter(t => t.event === gw).forEach(t => {
        const pIn = playersMap[t.element_in] || { web_name: 'Player #' + t.element_in, team: '' };
        const pOut = playersMap[t.element_out] || { web_name: 'Player #' + t.element_out, team: '' };
        const cost = c => (c ? `£${(c / 10).toFixed(1)}m` : '');
        activityItems.push(`
          <li class="act-item">
            <span class="act-icon act-transfer">${icon('arrowRight', 14)}</span>
            <div class="act-body">
              <div class="act-line">
                <span class="pm-pos">In</span> <strong>${pIn.web_name}</strong> <span class="pm-muted">${pIn.team || ''} ${cost(t.element_in_cost)}</span>
                <span class="act-sep">·</span>
                <span class="pm-neg-soft">Out</span> <strong>${pOut.web_name}</strong> <span class="pm-muted">${pOut.team || ''} ${cost(t.element_out_cost)}</span>
              </div>
              <div class="act-meta">Transfer</div>
            </div>
          </li>`);
      });

      const activityHtml = `
        <div class="pm-section">
          <div class="pm-section-head">
            <span class="modal-section-title">${icon('clock', 15)} Gameweek activity</span>
            ${transferCost > 0 ? `<span class="pm-neg">−${transferCost} pts hit</span>` : ''}
          </div>
          ${activityItems.length
            ? `<ul class="act-list">${activityItems.join('')}</ul>`
            : `<div class="pm-card pm-empty">No transfers or automatic substitutions in Gameweek ${gw}.</div>`}
        </div>`;

      modalBody.innerHTML = `
        ${summaryHtml}
        ${freeTransfersHtml}
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

    if (e.key === 'Escape') {
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
