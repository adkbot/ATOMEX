// ══════════════════════════════════════
// ATOMEX AI — App Bootstrap Initializer (app.js)
// ══════════════════════════════════════

function setTf(tf, el) {
  document.querySelectorAll('.tf-tab').forEach(b => b.classList.remove('act'));
  el.classList.add('act');
  const cnts = { '1m': 120, '5m': 60, '15m': 48, '1h': 60, '4h': 24 };
  APP.candles[APP.selPair] = genCandles(APP.pairs[APP.selPair].px || 67420, cnts[tf] || 60);
  if (MM.active) {
    updateMMZones();
  }
  drawCandles();
}

function selPair(s, el) {
  APP.selPair = s;
  document.querySelectorAll('.ch-tab').forEach(b => b.classList.remove('act'));
  if (el) {
    el.classList.add('act');
  } else {
    const m = { BTCUSDT: 'BTC', ETHUSDT: 'ETH', SOLUSDT: 'SOL', XRPUSDT: 'XRP' };
    document.querySelectorAll('.ch-tab').forEach(b => {
      if (b.textContent === m[s]) b.classList.add('act');
    });
  }
  document.getElementById('chartTitle').textContent = s + ' · H1 · Midnight Madness';
  if (MM.active) {
    updateMMZones();
  }
  drawCandles();
  renderPairs();
}

function init() {
  initCandles();
  renderPairs();
  renderCfg();
  renderMemory();
  
  setTimeout(() => {
    drawCandles();
    bindCanvas();
    initPnlChart();
  }, 120);

  updateMetrics();
  updateAIUI();
  
  log('ATOMEX AI v5.0 — Midnight Madness Pro.', 'info');
  log('Configure API Key + Prompt via ⚙ para ativar.', 'info');
  log('Hermes aguarda configuração.', 'ai');
  calc();
  
  window.addEventListener('resize', () => setTimeout(drawCandles, 50));
  
  try {
    const c = JSON.parse(localStorage.getItem('atomex_cfg') || '{}');
    if (c.aiKey) {
      AI.apiKey = c.aiKey;
      AI.model = c.aiModel || 'claude-sonnet-4-20250514';
      AI.systemPrompt = c.systemPrompt || '';
      activateHermes();
    }
    if (c.apiKey && c.secret) {
      APP.apiConnected = true;
      APP.balance = 12543.80;
      APP.startBal = 12543.80;
      onAPIConnected();
    }
  } catch (e) {
    console.error("Local storage initialization error:", e);
  }
}

// Start application when DOM is fully prepared
document.addEventListener('DOMContentLoaded', init);
setInterval(clkFn, 1000);
clkFn();
