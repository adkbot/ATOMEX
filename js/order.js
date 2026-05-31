// ══════════════════════════════════════
// ATOMEX AI — Operations & Calculations (order.js)
// ══════════════════════════════════════

let levOpen = false;
let advOpen = false;
let trOpen = false;

// Append executed operation to history array
function pushOp(sym, side, price, qty, sl, tp, source) {
  APP.ops.unshift({ sym, side, price, qty, sl, tp, pnl: null, time: new Date().toLocaleTimeString('pt-BR'), source });
  renderOps();
}

function setMgn(m, btn) {
  document.querySelectorAll('.op-topbar .seg').forEach(b => b.classList.remove('act'));
  btn.classList.add('act');
  toast('Margem: ' + (m === 'cross' ? 'Cruzada' : 'Isolada'));
  calc();
}

function togLev() {
  levOpen = !levOpen;
  document.getElementById('levBox').className = 'lev-box' + (levOpen ? ' show' : '');
}

function updLev(v) {
  APP.lev = parseInt(v);
  document.getElementById('levVal').textContent = v + 'x';
  document.getElementById('levBtn').textContent = v + 'x';
  calc();
}

function snapLev(v) {
  document.getElementById('levSlider').value = v;
  updLev(v);
}

function togAdv() {
  advOpen = !advOpen;
  document.getElementById('advBox').className = 'adv-box' + (advOpen ? ' show' : '');
}

function setDir(d) {
  APP.dir = d;
  document.getElementById('dL').className = 'dir-l' + (d === 'long' ? ' act' : '');
  document.getElementById('dS').className = 'dir-s' + (d === 'short' ? ' act' : '');
  calc();
}

function setTab(t, el) {
  APP.tab = t;
  document.querySelectorAll('.op-tab').forEach(b => b.classList.remove('act'));
  el.classList.add('act');
  document.getElementById('pxBlock').style.display = t === 'market' ? 'none' : 'block';
  document.getElementById('condBox').className = 'cond-box' + (t === 'cond' ? ' show' : '');
  calc();
}

function onPxTyp(v) {
  if (v === 'Mercado') {
    document.getElementById('pxInp').value = f2(APP.pairs['BTCUSDT'].px || 67420);
  }
  calc();
}

function onSl(v) {
  document.getElementById('sizeSlider').value = v;
  document.getElementById('slPctLbl').textContent = v + '%';
  const lev = parseInt(document.getElementById('levSlider').value) || 20;
  const bal = APP.apiConnected ? APP.balance : 0;
  const maxU = (bal * parseInt(v)) / 100 * lev;
  const px = parseFloat(document.getElementById('pxInp').value) || APP.pairs['BTCUSDT'].px || 67420;
  document.getElementById('qtyInp').value = f2(maxU / px, 6);
  calc();
}

function calc() {
  const px = parseFloat(document.getElementById('pxInp').value) || APP.pairs['BTCUSDT'].px || 67420;
  const qty = parseFloat(document.getElementById('qtyInp').value) || 0;
  const lev = parseInt(document.getElementById('levSlider').value) || 20;
  
  const noc = px * qty;
  const mgn = noc / lev;
  const liq = APP.dir === 'long' ? px * (1 - (1 / lev) + 0.005) : px * (1 + (1 / lev) - 0.005);

  document.getElementById('mgnDisp').textContent = mgn > 0 ? '$' + f2(mgn, 4) : '—';
  document.getElementById('liqDisp').textContent = qty > 0 ? '$' + f2(liq) : '—';
  document.getElementById('nocDisp').textContent = noc > 0 ? '$' + f2(noc) : '—';
  document.getElementById('levMgn').textContent = mgn > 0 ? '$' + f2(mgn, 4) : '—';
  document.getElementById('levLiq').textContent = qty > 0 ? '$' + f2(liq) : '—';

  const ba = qty > 0 ? f2(qty, 6) : '0.000';
  const baPx = APP.tab === 'market' ? 'mercado' : ('$' + f2(px));
  document.getElementById('buyAmt').textContent = ba + ' BTC @ ' + baPx;
  document.getElementById('sellAmt').textContent = ba + ' BTC @ ' + baPx;
}

function togTpsl(v) {
  document.getElementById('tpslBox').className = 'tpsl-box' + (v ? ' show' : '');
}

function calcTpsl() {
  const entry = parseFloat(document.getElementById('pxInp').value) || 67420;
  const qty = parseFloat(document.getElementById('qtyInp').value) || 0;
  const tp = parseFloat(document.getElementById('tpInp').value) || 0;
  const sl = parseFloat(document.getElementById('slInp').value) || 0;

  if (tp && qty) {
    const pnl = (APP.dir === 'long' ? tp - entry : entry - tp) * qty;
    document.getElementById('tpPnl').textContent = (pnl >= 0 ? '+' : '') + fu(pnl);
  }
  if (sl && qty) {
    const pnl = (APP.dir === 'long' ? sl - entry : entry - sl) * qty;
    document.getElementById('slPnl').textContent = (pnl >= 0 ? '+' : '') + fu(pnl);
  }
  if (tp && sl) {
    document.getElementById('rrR').textContent = f2(Math.abs(tp - entry) / Math.abs(sl - entry), 2) + 'R';
  }
}

function validate() {
  const qty = parseFloat(document.getElementById('qtyInp').value) || 0;
  const px = parseFloat(document.getElementById('pxInp').value) || 0;
  const ro = document.getElementById('roChk').checked;

  if (qty <= 0) { toast('Quantidade inválida', 'var(--ylw)'); return false; }
  if (px <= 0 && APP.tab !== 'market') { toast('Preço inválido', 'var(--ylw)'); return false; }
  if (!APP.apiConnected) { toast('Conecte sua API via ⚙ para ordens reais.', 'var(--ylw)'); return false; }
  
  if (px * qty / (parseInt(document.getElementById('levSlider').value) || 20) > APP.balance && !ro) {
    toast('Margem insuficiente', 'var(--dn)');
    return false;
  }

  if (document.getElementById('tpslChk').checked) {
    const tp = parseFloat(document.getElementById('tpInp').value) || 0;
    const sl = parseFloat(document.getElementById('slInp').value) || 0;
    if (APP.dir === 'long' && tp && tp <= px) { toast('TP deve ser acima do preço', 'var(--dn)'); return false; }
    if (APP.dir === 'long' && sl && sl >= px) { toast('SL deve ser abaixo do preço', 'var(--dn)'); return false; }
    if (APP.dir === 'short' && tp && tp >= px) { toast('TP deve ser abaixo do preço', 'var(--dn)'); return false; }
    if (APP.dir === 'short' && sl && sl <= px) { toast('SL deve ser acima do preço', 'var(--dn)'); return false; }
  }
  return true;
}

function execOrd(side) {
  if (!validate()) return;
  const qty = f2(parseFloat(document.getElementById('qtyInp').value), 6);
  const px = document.getElementById('pxInp').value;
  const tif = document.getElementById('tifSel').value;
  const confirm = document.getElementById('confirmOrd').checked;

  if (confirm) {
    const ok = window.confirm('Confirmar?\n' + side + ' ' + qty + ' BTC @ $' + px + '\nTIF: ' + tif);
    if (!ok) return;
  }

  APP.balance -= (side === 'BUY' ? 1 : -1) * (Math.random() * 8);
  APP.pnlData.push(APP.balance - APP.startBal);
  
  pushOp('BTCUSDT', side, parseFloat(px), qty, 0, 0, 'MANUAL');
  updPnlChart();
  updateMetrics();

  if (AI.mode !== 'off') {
    log('[HERMES] Gravou entrada manual: ' + side + ' @ $' + px, 'ai');
    setTimeout(() => {
      const win = Math.random() > 0.4;
      saveMMMemory({ dir: side === 'BUY' ? 'LONG' : 'SHORT', entry: parseFloat(px), sl: 0, tp: 0, reason: 'Manual @ $' + px, conf: Math.floor(Math.random() * 20 + 65) }, win, (win ? 1 : -1) * (Math.random() * 60 + 10), false);
    }, 1500);
  }

  toast(side + ' enviado: ' + qty + ' BTC @ $' + px, side === 'BUY' ? 'var(--up)' : 'var(--dn)');
  log('Manual ' + side + ': BTCUSDT ' + qty + ' @ $' + px, side === 'BUY' ? 'ok' : 'warn');
}

function togTransfer() {
  trOpen = !trOpen;
  document.getElementById('trBox').className = 'tr-box' + (trOpen ? ' show' : '');
}

function swpTr() {
  const f = document.getElementById('frW'), t = document.getElementById('toW');
  const tmp = f.value; f.value = t.value; t.value = tmp;
}

function doTr() {
  const a = parseFloat(document.getElementById('trAmt').value) || 0;
  if (a <= 0) { toast('Valor inválido', 'var(--ylw)'); return; }
  const fr = document.getElementById('frW').value, to = document.getElementById('toW').value;
  toast('$' + f2(a, 2) + ' transferido: ' + fr + ' → ' + to, 'var(--blu)');
  log('Transferência $' + f2(a, 2) + ' ' + fr + ' → ' + to, 'info');
  document.getElementById('trBox').className = 'tr-box';
  trOpen = false;
}
