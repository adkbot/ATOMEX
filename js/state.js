// ══════════════════════════════════════
// ATOMEX AI — State Management (state.js)
// ══════════════════════════════════════

const APP = {
  apiConnected: false,
  balance: 0,
  startBal: 0,
  running: false,
  selPair: 'BTCUSDT',
  lev: 20,
  dir: 'long',
  tab: 'limit',
  wins: 0,
  losses: 0,
  ops: [],
  pnlData: [],
  logs: [],
  pairs: {
    'BTCUSDT': { buy: 60000, sell: 75000, qty: '0.001', open: false, proc: false, px: 0, prevPx: 0 },
    'ETHUSDT': { buy: 25000, sell: 36000, qty: '0.01',  open: false, proc: false, px: 0, prevPx: 0 },
    'SOLUSDT': { buy: 120,   sell: 180,   qty: '0.1',   open: false, proc: false, px: 0, prevPx: 0 },
    'XRPUSDT': { buy: 0.50,  sell: 0.80,  qty: '10',    open: false, proc: false, px: 0, prevPx: 0 }
  },
  candles: {}
};

const AI = {
  mode: 'off',
  phase: 3,
  memories: [],
  patterns: [],
  shadowOps: 0,
  confidence: 0,
  currentSignal: { action: 'wait', reason: '', conf: 0 },
  apiKey: '',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: '',
  mmLoaded: false
};

const MM = {
  active: false,
  top1: 0,
  bot1: 0,
  pendingSignal: null,
  openTrade: null
};

// Local storage configuration save/load handlers
function saveSettings() {
  const cfg = {
    exchange: document.getElementById('cfg-exchange').value,
    apiKey: document.getElementById('cfg-apikey').value,
    secret: document.getElementById('cfg-secret').value,
    wallet: document.getElementById('cfg-wallet').value,
    aiKey: document.getElementById('cfg-aikey').value,
    aiModel: document.getElementById('cfg-aimodel').value,
    systemPrompt: document.getElementById('cfg-systemprompt').value,
    maxRisk: document.getElementById('cfg-maxrisk').value,
    maxDailyLoss: document.getElementById('cfg-maxdailyloss').value,
    maxLev: document.getElementById('cfg-maxlev').value,
    aiCapital: document.getElementById('cfg-aicapital').value,
    mmStart: document.getElementById('cfg-mmstart').value,
    mmEnd: document.getElementById('cfg-mmend').value,
    pivotLen: document.getElementById('cfg-pivotlen').value,
    offset: document.getElementById('cfg-offset').value
  };

  try {
    localStorage.setItem('atomex_cfg', JSON.stringify(cfg));
  } catch (e) {
    console.error("Local storage not accessible:", e);
  }

  if (cfg.aiKey) {
    AI.apiKey = cfg.aiKey;
    AI.model = cfg.aiModel;
    AI.systemPrompt = cfg.systemPrompt;
    activateHermes();
  }

  if (cfg.apiKey && cfg.secret) {
    APP.apiConnected = true;
    APP.balance = 12543.80;
    APP.startBal = 12543.80;
    onAPIConnected();
  }

  toast('✓ Configurações salvas!', 'var(--up)');
  log('Configurações salvas.', 'ok');
  closeSettings();
}

function loadCfg() {
  try {
    const c = JSON.parse(localStorage.getItem('atomex_cfg') || '{}');
    if (c.exchange) {
      document.getElementById('cfg-exchange').value = c.exchange;
      onExchangeChange(c.exchange);
    }
    if (c.apiKey) document.getElementById('cfg-apikey').value = c.apiKey;
    if (c.secret) document.getElementById('cfg-secret').value = c.secret;
    if (c.aiKey) document.getElementById('cfg-aikey').value = c.aiKey;
    if (c.aiModel) document.getElementById('cfg-aimodel').value = c.aiModel;
    if (c.systemPrompt) {
      document.getElementById('cfg-systemprompt').value = c.systemPrompt;
      const p = document.getElementById('promptStatusPill');
      p.textContent = '✓ Prompt salvo';
      p.className = 'status-pill pill-ok';
    }
    if (c.maxRisk) document.getElementById('cfg-maxrisk').value = c.maxRisk;
    if (c.maxDailyLoss) document.getElementById('cfg-maxdailyloss').value = c.maxDailyLoss;
    if (c.aiCapital) document.getElementById('cfg-aicapital').value = c.aiCapital;
    if (c.mmStart) document.getElementById('cfg-mmstart').value = c.mmStart;
    if (c.mmEnd) document.getElementById('cfg-mmend').value = c.mmEnd;
    if (c.pivotLen) document.getElementById('cfg-pivotlen').value = c.pivotLen;
    if (c.offset) document.getElementById('cfg-offset').value = c.offset;
  } catch (e) {
    console.error("Error loading config:", e);
  }
}
