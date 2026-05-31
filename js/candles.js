// ══════════════════════════════════════
// ATOMEX AI — Candle & Tick Simulation (candles.js)
// ══════════════════════════════════════

let crossX = 0, crossY = 0, showCross = false;

// Generate simulated OHLCV data array
function genCandles(basePx, n) {
  const arr = [];
  let px = basePx * (0.984 + Math.random() * 0.024);
  for (let i = 0; i < n; i++) {
    const o = px;
    const v = Math.random() * 0.018 + 0.003;
    const h = o * (1 + Math.random() * v);
    const l = o * (1 - Math.random() * v);
    const c = l + (h - l) * Math.random();
    arr.push({ o, h, l, c, vol: Math.random() * 200 + 20 });
    px = c;
  }
  return arr;
}

// Initial filling of history candles for all assets
function initCandles() {
  const bases = { BTCUSDT: 67420, ETHUSDT: 3528, SOLUSDT: 148, XRPUSDT: 0.63 };
  Object.keys(APP.pairs).forEach(s => {
    APP.pairs[s].px = bases[s];
    APP.pairs[s].prevPx = bases[s];
    APP.candles[s] = genCandles(bases[s], 60);
  });
}

// Render OHLCV candlesticks and volume indicators on canvas
function drawCandles() {
  const cv = document.getElementById('candleChart');
  if (!cv) return;
  const W = cv.offsetWidth, H = 200;
  if (cv.width !== W || cv.height !== H) {
    cv.width = W;
    cv.height = H;
  }
  const ctx = cv.getContext('2d');
  const arr = APP.candles[APP.selPair];
  if (!arr || !arr.length) return;

  const P = { t: 10, b: 28, l: 58, r: 6 };
  const cW = (W - P.l - P.r) / arr.length;
  const bW = Math.max(Math.floor(cW * 0.72), 1);
  const pxArr = arr.flatMap(c => [c.h, c.l]);
  const mn = Math.min(...pxArr), mx = Math.max(...pxArr), rng = mx - mn || 1;
  const py = v => P.t + (1 - (v - mn) / rng) * (H - P.t - P.b);

  ctx.fillStyle = '#0e1218';
  ctx.fillRect(0, 0, W, H);

  // Price axes grid lines
  for (let i = 0; i <= 5; i++) {
    const v = mn + rng * (i / 5), y = py(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(P.l, y);
    ctx.lineTo(W - P.r, y);
    ctx.stroke();
    ctx.fillStyle = '#5e6e8a';
    ctx.font = '9px JetBrains Mono,monospace';
    ctx.textAlign = 'right';
    ctx.fillText(v >= 1000 ? v.toFixed(0) : v >= 1 ? v.toFixed(2) : v.toFixed(4), P.l - 3, y + 3);
  }

  // Draw volume
  const maxVol = Math.max(...arr.map(c => c.vol));
  arr.forEach((c, i) => {
    const x = P.l + i * cW;
    const bh = (c.vol / maxVol) * (H - P.t - P.b) * 0.15;
    ctx.fillStyle = c.c >= c.o ? 'rgba(14,203,129,.1)' : 'rgba(246,70,93,.1)';
    ctx.fillRect(x, H - P.b - bh, cW - 1, bh);
  });

  // Draw candles
  arr.forEach((c, i) => {
    const x = Math.floor(P.l + i * cW + cW / 2);
    const bull = c.c >= c.o, col = bull ? '#0ecb81' : '#f6465d';
    ctx.strokeStyle = col;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, py(c.h));
    ctx.lineTo(x, py(c.l));
    ctx.stroke();
    const top = py(Math.max(c.o, c.c));
    const bot = py(Math.min(c.o, c.c));
    const bh = Math.max(bot - top, 1);
    ctx.fillStyle = col;
    ctx.fillRect(x - Math.floor(bW / 2), top, bW, bh);
  });

  // MM Zones on chart
  if (MM.top1 > 0 && MM.top1 >= mn && MM.top1 <= mx) {
    const y2 = py(MM.top1);
    ctx.save();
    ctx.strokeStyle = 'rgba(246,70,93,.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(P.l, y2); ctx.lineTo(W - P.r, y2); ctx.stroke();
    ctx.fillStyle = 'rgba(246,70,93,.85)';
    ctx.fillRect(P.l, y2 - 9, 54, 11);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px JetBrains Mono,monospace';
    ctx.fillText('TOPO 1 (R)', P.l + 3, y2);
    ctx.restore();
  }
  if (MM.bot1 > 0 && MM.bot1 >= mn && MM.bot1 <= mx) {
    const y2 = py(MM.bot1);
    ctx.save();
    ctx.strokeStyle = 'rgba(14,203,129,.8)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(P.l, y2); ctx.lineTo(W - P.r, y2); ctx.stroke();
    ctx.fillStyle = 'rgba(14,203,129,.85)';
    ctx.fillRect(P.l, y2 - 2, 58, 11);
    ctx.fillStyle = '#000';
    ctx.font = 'bold 7px JetBrains Mono,monospace';
    ctx.fillText('FUNDO 1 (S)', P.l + 3, y2 + 8);
    ctx.restore();
  }

  // Current price line
  const lc = arr[arr.length - 1], ly = py(lc.c);
  ctx.save();
  ctx.strokeStyle = lc.c >= lc.o ? 'rgba(14,203,129,.5)' : 'rgba(246,70,93,.5)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(P.l, ly); ctx.lineTo(W - P.r, ly); ctx.stroke();
  const lbl2 = lc.c >= 1000 ? lc.c.toFixed(2) : lc.c >= 1 ? lc.c.toFixed(3) : lc.c.toFixed(5);
  const tw2 = ctx.measureText(lbl2).width + 8;
  ctx.fillStyle = lc.c >= lc.o ? '#0ecb81' : '#f6465d';
  ctx.fillRect(W - P.r - tw2, ly - 8, tw2, 14);
  ctx.fillStyle = '#000';
  ctx.font = 'bold 8px JetBrains Mono,monospace';
  ctx.fillText(lbl2, W - P.r - 2, ly + 3);
  ctx.restore();

  // Crosshair overlays
  if (showCross && crossX > P.l && crossX < W - P.r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 0.7; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(crossX, P.t); ctx.lineTo(crossX, H - P.b); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(P.l, crossY); ctx.lineTo(W - P.r, crossY); ctx.stroke();
    const hp = mn + (1 - (crossY - P.t) / (H - P.t - P.b)) * rng;
    const hl = hp >= 1000 ? hp.toFixed(2) : hp >= 1 ? hp.toFixed(3) : hp.toFixed(5);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.fillRect(0, crossY - 8, P.l - 2, 14);
    ctx.fillStyle = '#000';
    ctx.font = '8px JetBrains Mono,monospace';
    ctx.fillText(hl, P.l - 4, crossY + 3);
    ctx.restore();

    const idx = Math.floor((crossX - P.l) / cW);
    if (idx >= 0 && idx < arr.length) {
      const c = arr[idx], b = c.c >= c.o, p = ((c.c - c.o) / c.o * 100).toFixed(2);
      document.getElementById('ci-o').textContent = fmt(c.o);
      document.getElementById('ci-h').textContent = fmt(c.h);
      document.getElementById('ci-l').textContent = fmt(c.l);
      document.getElementById('ci-c').textContent = fmt(c.c);
      const pe = document.getElementById('ci-pct');
      pe.textContent = (b ? '+' : '') + p + '%';
      pe.style.color = b ? '#0ecb81' : '#f6465d';
      document.getElementById('ci-vol').textContent = c.vol.toFixed(1) + 'K';
    }
  } else {
    const b = lc.c >= lc.o, p = ((lc.c - lc.o) / lc.o * 100).toFixed(2);
    document.getElementById('ci-o').textContent = fmt(lc.o);
    document.getElementById('ci-h').textContent = fmt(lc.h);
    document.getElementById('ci-l').textContent = fmt(lc.l);
    document.getElementById('ci-c').textContent = fmt(lc.c);
    const pe = document.getElementById('ci-pct');
    pe.textContent = (b ? '+' : '') + p + '%';
    pe.style.color = b ? '#0ecb81' : '#f6465d';
    document.getElementById('ci-vol').textContent = lc.vol.toFixed(1) + 'K';
  }

  // Draw X axis values
  const xEl = document.getElementById('xLabels');
  const step = Math.ceil(arr.length / 7);
  let xl = '';
  arr.forEach((_, i) => {
    if (i % step === 0 || i === arr.length - 1) {
      xl += `<span style="font-size:8px;color:var(--mut);font-family:var(--font);">${i}</span>`;
    }
  });
  xEl.innerHTML = xl;
}

// Attach hover actions to chart
function bindCanvas() {
  const c = document.getElementById('candleChart');
  c.addEventListener('mousemove', e => {
    const r = c.getBoundingClientRect();
    crossX = e.clientX - r.left;
    crossY = e.clientY - r.top;
    showCross = true;
    drawCandles();
  });
  c.addEventListener('mouseleave', () => {
    showCross = false;
    drawCandles();
  });
}

// Tick updater loop simulator
function simulateTick() {
  const bases = { BTCUSDT: 67420, ETHUSDT: 3528, SOLUSDT: 148, XRPUSDT: 0.63 };
  const vol = { BTCUSDT: 0.0006, ETHUSDT: 0.0009, SOLUSDT: 0.0014, XRPUSDT: 0.0018 };

  Object.keys(APP.pairs).forEach(s => {
    const p = APP.pairs[s];
    p.prevPx = p.px;
    if (p.px === 0) p.px = bases[s];
    p.px *= (1 + (Math.random() - 0.482) * vol[s]);

    const arr = APP.candles[s];
    if (arr && arr.length) {
      const lc = arr[arr.length - 1];
      if (p.px > lc.h) lc.h = p.px;
      if (p.px < lc.l) lc.l = p.px;
      lc.c = p.px;
      lc.vol += Math.random() * 5;

      if (Math.random() < 0.04) {
        arr.push({ o: p.px, h: p.px * (1 + Math.random() * 0.003), l: p.px * (1 - Math.random() * 0.003), c: p.px, vol: Math.random() * 50 + 5 });
        if (arr.length > 90) arr.shift();
      }
    }

    if (!p.proc) {
      if (p.px < p.buy && !p.open) {
        p.proc = true; p.open = true;
        log('BOT COMPRA: ' + s + ' @ $' + f2(p.px, s === 'XRPUSDT' ? 4 : 2), 'ok');
        p.proc = false;
      } else if (p.px > p.sell && p.open) {
        p.proc = true; p.open = false;
        log('BOT VENDA: ' + s + ' @ $' + f2(p.px, s === 'XRPUSDT' ? 4 : 2), 'warn');
        p.proc = false;
      }
    }
  });

  const bp = APP.pairs['BTCUSDT'].px;
  const bpEl = document.getElementById('livePx');
  bpEl.textContent = bp.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bull = APP.pairs['BTCUSDT'].px >= APP.pairs['BTCUSDT'].prevPx;
  bpEl.style.color = bull ? '#0ecb81' : '#f6465d';

  const chgEl = document.getElementById('liveChg');
  chgEl.textContent = (bull ? '+' : '') + f2((Math.random() * 2) * (bull ? 1 : -1), 2) + '%';
  chgEl.style.color = bull ? '#0ecb81' : '#f6465d';

  document.getElementById('hi24').textContent = '$' + f2(bp * 1.015);
  document.getElementById('lo24').textContent = '$' + f2(bp * 0.984);
  document.getElementById('vol24').textContent = '$' + f2(Math.random() * 50 + 800, 0) + 'M';
  document.getElementById('fundRate').textContent = (Math.random() > 0.5 ? '+' : '-') + f2(Math.random() * 0.05, 4) + '%';

  if (document.getElementById('pxTyp').value === 'Mercado') {
    document.getElementById('pxInp').value = f2(bp);
  }

  drawCandles();
  updateMetrics();
  renderPairs();
  renderCfg();
}

function toggleBot() {
  APP.running = !APP.running;
  const sBtn = document.getElementById('btnStart');
  const pBtn = document.getElementById('btnStop');
  const dot = document.getElementById('sDot');
  const lbl = document.getElementById('sLbl');

  if (APP.running) {
    sBtn.disabled = true;
    pBtn.disabled = false;
    dot.className = 'sdot live';
    lbl.textContent = 'OPERANDO';
    log('Bot ATOMEX AI + Midnight Madness iniciado.', 'ok');
    ticker = setInterval(simulateTick, 1300);
  } else {
    sBtn.disabled = false;
    pBtn.disabled = true;
    dot.className = 'sdot';
    dot.style.background = 'var(--mut)';
    lbl.textContent = 'PARADO';
    log('Bot parado.', 'err');
    clearInterval(ticker);
  }
}
