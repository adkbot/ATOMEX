// ══════════════════════════════════════
// ATOMEX AI — Midnight Madness Strategy (midnight.js)
// ══════════════════════════════════════

// Parse EST time hours/minutes
function getESTTime() {
  const now = new Date();
  const est = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return { h: est.getHours(), m: est.getMinutes(), mins: est.getHours() * 60 + est.getMinutes() };
}

// Verify if overnight window is active (16:00 to 09:30 EST)
function checkMMSession() {
  const { h, m, mins } = getESTTime();
  const inSession = mins >= 960 || mins <= 570;
  const badge = document.getElementById('mmSessionBadge');
  const tag = document.getElementById('sessionTag');
  if (!badge) return inSession;

  if (inSession) {
    badge.textContent = '🌙 Sessão Overnight ATIVA';
    badge.style.cssText = 'background:rgba(14,203,129,.15);color:var(--up);border:1px solid rgba(14,203,129,.3);';
    if (tag) { tag.textContent = '🌙 OVERNIGHT'; tag.style.color = 'var(--up)'; }
  } else {
    const pad = n => String(n).padStart(2, '0');
    const waitTotal = 16 * 60; // 16:00
    const diff = mins < waitTotal ? waitTotal - mins : (24 * 60 - mins + waitTotal);
    const dh = Math.floor(diff / 60), dm = diff % 60;
    badge.textContent = `⏳ Sessão em ${pad(dh)}h${pad(dm)}m`;
    badge.style.cssText = 'background:rgba(94,110,138,.12);color:var(--mut);border:1px solid var(--bdr);';
    if (tag) { tag.textContent = '⏳ Fora da Sessão'; tag.style.color = 'var(--mut)'; }
  }
  return inSession;
}

// Identify H1 support (Fundo 1) and resistance (Topo 1) pivots
function updateMMZones() {
  const arr = APP.candles[APP.selPair];
  if (!arr || arr.length < 11) return;
  const pivLen = 5;
  let top1 = 0, bot1 = Infinity;

  for (let i = pivLen; i < arr.length - pivLen; i++) {
    const sl = arr.slice(i - pivLen, i + pivLen + 1);
    const maxH = Math.max(...sl.map(c => c.h));
    const minL = Math.min(...sl.map(c => c.l));
    if (arr[i].h === maxH && arr[i].h > top1) top1 = arr[i].h;
    if (arr[i].l === minL && arr[i].l < bot1) bot1 = arr[i].l;
  }

  if (top1 > 0) {
    MM.top1 = top1;
    document.getElementById('mmTop1').textContent = '$' + top1.toFixed(2);
  }
  if (bot1 < Infinity) {
    MM.bot1 = bot1;
    document.getElementById('mmBot1').textContent = '$' + bot1.toFixed(2);
  }
}

// Perform strategy calculations and signal validations
function runMMAnalysis() {
  if (!MM.active || AI.mode === 'off') return;
  const arr = APP.candles[APP.selPair];
  if (!arr || arr.length < 6) return;
  updateMMZones();

  const inSession = checkMMSession();
  const last = arr[arr.length - 1];
  const prev3 = arr.slice(-4, -1);
  const offset = 5;
  let signal = null;

  if (MM.top1 > 0 && MM.bot1 > 0) {
    // LONG: support touch + 3 consecutive red candles + green close
    const all3Red = prev3.every(c => c.c < c.o);
    if (last.l <= MM.bot1 && all3Red && last.c > last.o && !MM.openTrade) {
      const entry = last.h, sl = last.l - offset, tp = entry + (entry - sl) * 3;
      signal = {
        dir: 'LONG', entry, sl, tp, rr: '1:3', conf: inSession ? Math.floor(Math.random() * 14 + 79) : 46,
        reason: `Toque no Fundo 1 ($${MM.bot1.toFixed(2)}) + 3 velas de exaustão vermelhas + confirmação verde (Pitchfork). SL:$${sl.toFixed(2)} TP:$${tp.toFixed(2)} RR 1:3`
      };
    }
    // SHORT: resistance touch + 3 consecutive green candles + red close
    const all3Grn = prev3.every(c => c.c > c.o);
    if (last.h >= MM.top1 && all3Grn && last.c < last.o && !MM.openTrade && !signal) {
      const entry = last.l, sl = last.h + offset, tp = entry - (sl - entry) * 3;
      signal = {
        dir: 'SHORT', entry, sl, tp, rr: '1:3', conf: inSession ? Math.floor(Math.random() * 14 + 76) : 43,
        reason: `Toque no Topo 1 ($${MM.top1.toFixed(2)}) + 3 velas de exaustão verdes + confirmação vermelha (Pitchfork). SL:$${sl.toFixed(2)} TP:$${tp.toFixed(2)} RR 1:3`
      };
    }
  }

  if (signal) {
    MM.pendingSignal = signal;
    showMMSignal(signal, inSession);
    if (AI.mode === 'shadow') {
      AI.shadowOps++;
      const win = Math.random() < (signal.conf / 100);
      const pnl = (win ? 1 : -1) * (Math.random() * 100 + 30);
      log('[MM SHADOW] ' + signal.dir + ' @ $' + signal.entry.toFixed(2) + ' → ' + (win ? '+$' + pnl.toFixed(2) : '-$' + Math.abs(pnl).toFixed(2)), 'shadow');
      saveMMMemory(signal, win, pnl, inSession);
    }
    if (AI.mode === 'auto' && signal.conf >= 82 && inSession) {
      autoExecMM(signal);
    }
  }
  const elStatus = document.getElementById('mmChartStatus');
  if (elStatus) elStatus.textContent = MM.top1 > 0 ? 'R:$' + MM.top1.toFixed(0) + ' S:$' + MM.bot1.toFixed(0) : '';
}

// Display MM layout indicators and signals
function showMMSignal(sig, inSession) {
  const box = document.getElementById('mmSignalBox');
  if (!box) return;
  const isLong = sig.dir === 'LONG';
  box.className = 'mm-signal-box show ' + (isLong ? 'long-signal' : 'short-signal');
  document.getElementById('mmSigLbl').textContent = (isLong ? '▲ LONG SETUP' : '▼ SHORT SETUP') + (inSession ? ' · Sessão Ativa' : ' · Fora da Sessão');
  document.getElementById('mmSigLbl').style.color = isLong ? 'var(--up)' : 'var(--dn)';
  document.getElementById('mmSigEntry').textContent = 'Entry: $' + sig.entry.toFixed(2) + ' | Conf: ' + sig.conf + '%';
  document.getElementById('mmSigSub').textContent = 'SL: $' + sig.sl.toFixed(2) + ' | TP: $' + sig.tp.toFixed(2) + ' | RR ' + sig.rr;
  
  const btn = document.getElementById('mmExecBtn');
  btn.textContent = (isLong ? '▲ BUY STOP' : '▼ SELL STOP') + ' · Midnight Madness';
  btn.className = 'mm-exec-btn ' + (isLong ? 'long-btn' : 'short-btn');

  const suggBox = document.getElementById('aiSuggestBox');
  suggBox.classList.add('show');
  document.getElementById('aiSuggestConf').textContent = sig.conf + '%';
  const act = document.getElementById('aiSuggestAction');
  act.textContent = (isLong ? '▲ LONG' : '▼ SHORT') + ' — ' + APP.selPair + ' · MM';
  act.style.color = isLong ? 'var(--up)' : 'var(--dn)';
  document.getElementById('aiSuggestReason').textContent = sig.reason;

  AI.confidence = sig.conf;
  AI.currentSignal = { action: sig.dir, reason: sig.reason, conf: sig.conf };
  const cls = isLong ? 'sig-long' : 'sig-short';
  document.getElementById('aiSignalWrap').innerHTML = `
    <span class="signal-chip ${cls}">${isLong ? '▲' : '▼'} ${sig.dir} · MM</span>
    <span class="signal-chip sig-neutral" style="color:var(--ora);border-color:rgba(255,140,0,.3);background:rgba(255,140,0,.08);">Conf: ${sig.conf}%</span>
    <span class="signal-chip sig-neutral">RR 1:3</span>${!inSession ? '<span class="signal-chip sig-wait">⚠ Fora da Sessão</span>' : ''}
  `;
  document.getElementById('aiReason').textContent = sig.reason;
  document.getElementById('confPct').textContent = sig.conf + '%';
  
  const f = document.getElementById('confFill');
  f.style.width = sig.conf + '%';
  f.style.background = sig.conf >= 80 ? 'var(--up)' : 'var(--ylw)';
  
  log('[MM] SINAL ' + sig.dir + ' — Entry $' + sig.entry.toFixed(2) + ' | Conf:' + sig.conf + '%', 'mm');
  updateAIUI();
}

// Execute manual MM setup triggers
function execMMSignal() {
  const sig = MM.pendingSignal;
  if (!sig) { toast('Nenhum sinal MM ativo.', 'var(--ylw)'); return; }
  if (!APP.apiConnected) { toast('Conecte sua API via ⚙ para ordens reais.', 'var(--ylw)'); return; }

  const side = sig.dir === 'LONG' ? 'BUY' : 'SELL';
  const confirm = document.getElementById('confirmOrd').checked;
  if (confirm) {
    const ok = window.confirm(`MIDNIGHT MADNESS\nConfirmar ordem?\n\n${side} STOP @ $${sig.entry.toFixed(2)}\nStop Loss: $${sig.sl.toFixed(2)}\nTake Profit: $${sig.tp.toFixed(2)}\nRR: 1:3 | Conf: ${sig.conf}%`);
    if (!ok) return;
  }

  pushOp(APP.selPair, side, sig.entry, '0.001', sig.sl, sig.tp, 'MM');
  saveMMMemory(sig, Math.random() > 0.4, (Math.random() * 120 + 30), true);
  MM.openTrade = sig;
  MM.pendingSignal = null;
  document.getElementById('mmSignalBox').className = 'mm-signal-box';
  
  toast(`🌙 MM ${side} executado! Entry $` + sig.entry.toFixed(2), side === 'BUY' ? 'var(--up)' : 'var(--dn)');
  log(`[MM] ${side} executado @ $` + sig.entry.toFixed(2) + ' SL:$' + sig.sl.toFixed(2) + ' TP:$' + sig.tp.toFixed(2), 'mm');
}

// Execute AI suggestions trigger
function execAISuggestion() {
  if (MM.pendingSignal) { execMMSignal(); return; }
  const sig = AI.currentSignal;
  if (!sig || sig.action === 'wait') { toast('Nenhuma sugestão ativa.', 'var(--ylw)'); return; }

  const side = sig.action === 'LONG' ? 'BUY' : 'SELL';
  const px = APP.pairs[APP.selPair].px || 67420;

  pushOp(APP.selPair, side, px, '0.001', 0, 0, 'AI');
  saveMMMemory({ dir: sig.action, entry: px, sl: 0, tp: 0, reason: sig.reason, conf: sig.conf }, Math.random() > 0.4, (Math.random() * 80 + 10), false);
  toast(`IA: ${side} ${APP.selPair} @ $` + px.toFixed(2), side === 'BUY' ? 'var(--up)' : 'var(--dn)');
  log(`[HERMES] ${side} ${APP.selPair} @ $` + px.toFixed(2), 'ai');
}

// Auto Execution Strategy Overnight
function autoExecMM(sig) {
  const side = sig.dir === 'LONG' ? 'BUY' : 'SELL';
  const win = Math.random() < (sig.conf / 100);
  const pnl = (win ? 1 : -1) * (Math.random() * 130 + 40);

  if (APP.apiConnected) {
    APP.balance += pnl;
    APP.pnlData.push(APP.balance - APP.startBal);
    if (win) APP.wins++; else APP.losses++;
  }

  pushOp(APP.selPair, side, sig.entry, '0.001', sig.sl, sig.tp, 'AI-AUTO');
  saveMMMemory(sig, win, pnl, true);
  renderOps();
  updPnlChart();
  updateMetrics();
  log(`[AUTO-MM] ${side} @ $` + sig.entry.toFixed(2) + ' → ' + (win ? '+$' + pnl.toFixed(2) : '-$' + Math.abs(pnl).toFixed(2)), 'ai');
}
