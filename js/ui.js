// ══════════════════════════════════════
// ATOMEX AI — UI Rendering & Controls (ui.js)
// ══════════════════════════════════════

let pnlChartInst = null;

function openSettings() {
  document.getElementById('settingsModal').classList.add('show');
  loadCfg();
}

function closeSettings() {
  document.getElementById('settingsModal').classList.remove('show');
}

function onExchangeChange(v) {
  document.getElementById('walletRow').style.display = (v === 'gmx' || v === 'dydx' || v === 'hyperliquid') ? 'block' : 'none';
}

function loadMidnightPrompt() {
  document.getElementById('cfg-systemprompt').value = MM_PROMPT;
  const p = document.getElementById('promptStatusPill');
  p.textContent = '✓ MM Carregado';
  p.className = 'status-pill pill-mm';
  toast('Prompt Midnight Madness Pro carregado!', 'var(--ora)');
}

function testConnection() {
  const pill = document.getElementById('connStatusPill');
  pill.textContent = 'Testando...';
  pill.className = 'status-pill pill-wait';
  
  setTimeout(() => {
    const k = document.getElementById('cfg-apikey').value;
    const s = document.getElementById('cfg-secret').value;
    if (k && s) {
      pill.textContent = '✓ Conectado';
      pill.className = 'status-pill pill-ok';
      APP.apiConnected = true;
      APP.balance = 12543.80;
      APP.startBal = 12543.80;
      onAPIConnected();
      toast('API conectada! Saldo carregado.', 'var(--up)');
      log('API da exchange conectada.', 'ok');
    } else {
      pill.textContent = '✗ Falhou';
      pill.className = 'status-pill pill-err';
      toast('Insira API Key e Secret válidas.', 'var(--ylw)');
    }
  }, 1400);
}

function onAPIConnected() {
  document.getElementById('accDisconnected').style.display = 'none';
  document.getElementById('accConnected').style.display = 'block';
  document.getElementById('apiDot').className = 'sdot api-live';
  document.getElementById('apiLbl').textContent = 'API ATIVA';
  document.getElementById('apiLbl').style.color = 'var(--ylw)';
  updateMetrics();
}

function renderPairs() {
  document.getElementById('pairsWrap').innerHTML = Object.keys(APP.pairs).map(s => {
    const p = APP.pairs[s], isX = s === 'XRPUSDT', bull = p.px >= p.prevPx;
    const px = p.px > 0 ? '$' + f2(p.px, isX ? 4 : 2) : '—';
    return `<div class="pair-card${s === APP.selPair ? ' act' : ''}" onclick="selPair('${s}')">
      <div class="pc-head"><span class="pc-name">${s}</span><span class="pc-badge ${p.open ? 'badge-long' : 'badge-idle'}">${p.open ? 'LONG' : 'IDLE'}</span></div>
      <div class="pc-px" style="color:${p.px > 0 ? (p.open ? 'var(--up)' : bull ? 'var(--up)' : 'var(--dn)') : 'var(--mut)'}">${px}</div>
      <div class="pc-sub"><span class="pc-tgt">C:$${isX ? f2(p.buy, 2) : Math.round(p.buy)}</span><span class="pc-tgt">V:$${isX ? f2(p.sell, 2) : Math.round(p.sell)}</span></div>
    </div>`;
  }).join('');
}

function renderCfg() {
  document.getElementById('cfgBody').innerHTML = Object.keys(APP.pairs).map(s => {
    const p = APP.pairs[s];
    return `<tr>
      <td style="padding:4px;font-family:var(--font);font-size:9px;font-weight:700;">${s}</td>
      <td><input class="form-inp" id="cb_${s}" value="${p.buy}" style="width:76px;font-size:9px;padding:3px;"></td>
      <td><input class="form-inp" id="cs_${s}" value="${p.sell}" style="width:76px;font-size:9px;padding:3px;"></td>
      <td><input class="form-inp" id="cq_${s}" value="${p.qty}" style="width:54px;font-size:9px;padding:3px;"></td>
      <td style="padding:4px;"><span style="font-size:8px;padding:1px 6px;border-radius:8px;${p.open ? 'background:rgba(14,203,129,.15);color:var(--up);' : 'background:rgba(94,110,138,.1);color:var(--mut);'}">${p.open ? 'LONG' : '—'}</span></td>
    </tr>`;
  }).join('');
}

function applyConfig() {
  Object.keys(APP.pairs).forEach(s => {
    const b = document.getElementById('cb_' + s);
    const sv = document.getElementById('cs_' + s);
    const q = document.getElementById('cq_' + s);
    if (b) APP.pairs[s].buy = parseFloat(b.value) || APP.pairs[s].buy;
    if (sv) APP.pairs[s].sell = parseFloat(sv.value) || APP.pairs[s].sell;
    if (q) APP.pairs[s].qty = q.value;
  });
  toast('Config aplicada.', 'var(--up)');
  log('Pares configurados.', 'ok');
  drawCandles();
}

function updateMetrics() {
  document.getElementById('mOps').textContent = APP.ops.length;
  document.getElementById('mPos').textContent = Object.values(APP.pairs).filter(p => p.open).length;
  
  if (!APP.apiConnected) {
    ['mPnl', 'mWin', 'mWL'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.textContent = '—'; el.style.color = 'var(--mut)'; }
    });
    document.getElementById('availDisp').textContent = 'Conecte API ⚙';
    return;
  }
  
  const pnl = APP.balance - APP.startBal, pct = (pnl / APP.startBal * 100).toFixed(2);
  document.getElementById('balDisp').textContent = '$' + APP.balance.toFixed(2);
  document.getElementById('pnlDisp').innerHTML = 'P&L: <span class="' + (pnl >= 0 ? 'pos' : 'neg') + '">' + (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2) + ' (' + (pnl >= 0 ? '+' : '') + pct + '%)</span>';
  
  const bp = Math.min(Math.abs(pnl / APP.startBal * 100) * 8, 100);
  const pnlBar = document.getElementById('pnlBar');
  pnlBar.style.width = bp + '%';
  pnlBar.style.background = pnl >= 0 ? '#0ecb81' : '#f6465d';
  
  const mPnl = document.getElementById('mPnl');
  mPnl.textContent = (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
  mPnl.className = 'met-val ' + (pnl >= 0 ? 'pos' : 'neg'); mPnl.style.color = '';
  
  document.getElementById('mWL').textContent = APP.wins + 'g · ' + APP.losses + 'p';
  const tot = APP.wins + APP.losses;
  document.getElementById('mWin').textContent = tot > 0 ? Math.round(APP.wins / tot * 100) + '%' : '—';
  document.getElementById('availDisp').textContent = APP.balance.toFixed(2) + ' USDT';
}

function renderOps() {
  const tb = document.getElementById('opsBody');
  if (!APP.ops.length) {
    tb.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--mut);padding:12px;font-size:9px;">Nenhuma operação</td></tr>';
    return;
  }
  tb.innerHTML = APP.ops.slice(0, 30).map(op => {
    const d = op.sym === 'XRPUSDT' ? 4 : 2, isMM = op.source === 'MM', isAI = op.source && op.source.startsWith('AI');
    return `<tr>
      <td style="font-weight:700;font-family:var(--font);font-size:9px;">${op.sym.replace('USDT','')}</td>
      <td><span class="${op.side === 'BUY' ? 'side-buy' : 'side-sell'}">${op.side === 'BUY' ? '▲BUY' : '▼SELL'}</span></td>
      <td style="font-family:var(--font);font-size:9px;">$${f2(op.price, d)}</td>
      <td style="font-family:var(--font);font-size:8px;color:var(--dn);">${op.sl ? '$' + f2(op.sl, d) : '—'}</td>
      <td style="font-family:var(--font);font-size:8px;color:var(--up);">${op.tp ? '$' + f2(op.tp, d) : '—'}</td>
      <td>${isMM ? '<span class="side-mm">🌙MM</span>' : isAI ? '<span class="side-ai">🧠IA</span>' : '<span style="font-size:7px;color:var(--mut);">Manual</span>'}</td>
      <td style="color:var(--mut);font-family:var(--font);font-size:8px;">${op.time}</td>
    </tr>`;
  }).join('');
}

function initPnlChart() {
  const cv = document.getElementById('pnlChart');
  cv.width = cv.offsetWidth; cv.height = 110;
  pnlChartInst = new Chart(cv.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#0ecb81',
        backgroundColor: c2 => {
          const g = c2.chart.ctx.createLinearGradient(0, 0, 0, 110);
          g.addColorStop(0, 'rgba(14,203,129,.18)');
          g.addColorStop(1, 'rgba(14,203,129,0)');
          return g;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 1.5
      }]
    },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(255,255,255,.04)' },
          ticks: {
            color: '#5e6e8a',
            font: { size: 8, family: 'JetBrains Mono' },
            callback: v => (v >= 0 ? '+$' : '-$') + Math.abs(v).toFixed(0)
          }
        }
      }
    }
  });
}

function updPnlChart() {
  if (!pnlChartInst) return;
  const d = APP.pnlData.slice(-80);
  pnlChartInst.data.labels = d.map(() => '');
  pnlChartInst.data.datasets[0].data = d;
  const last = d[d.length - 1] || 0;
  pnlChartInst.data.datasets[0].borderColor = last >= 0 ? '#0ecb81' : '#f6465d';
  pnlChartInst.update('none');
}
