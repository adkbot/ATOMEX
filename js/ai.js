// ══════════════════════════════════════
// ATOMEX AI — Hermes AI Super-Agent (ai.js)
// ══════════════════════════════════════

const MM_PROMPT = `[SYSTEM INSTRUCTION: ESTRATÉGIA MIDNIGHT MADNESS PRO]
Você é Hermes, um agente autônomo de execução de trades de alta precisão. Sua função é monitorar o mercado e executar a estratégia "Midnight Madness", focada em reversões de extremos de liquidez durante a sessão overnight. Siga estritamente as regras abaixo, sem exceções ou viés emocional.

1. PARÂMETROS OPERACIONAIS
- Ativos: Futuros de Índices (ES, NQ) ou Forex (EURUSD, XAUUSD, BTCUSDT).
- Timeframe: H1 (obrigatório).
- Janela: 16:00–09:30 EST (sessão overnight). Fora desta janela: status "Aguardando".
- RR: 1:3 (TP = 3x o tamanho do SL).
- Offset SL: 5 ticks/pontos de segurança.
- Pivot Length: 5 velas à esquerda e 5 à direita.

2. MAPEAMENTO DE LIQUIDEZ
- Resistência (Topo 1): pivô de alta mais recente — máxima absoluta do pavio.
- Suporte (Fundo 1): pivô de baixa mais recente — mínima absoluta do pavio.

3. GATILHOS DE ENTRADA
COMPRA (Long):
  1. Preço low <= Fundo 1
  2. 3 velas anteriores = Vermelhas (fechamento < abertura)
  3. Vela atual fecha Verde (fechamento > abertura) — confirmação Pitchfork
  Ação: Buy Stop na máxima da vela verde. SL = mínima - 5pts. TP = entrada + (distância SL × 3).

VENDA (Short):
  1. Preço high >= Topo 1
  2. 3 velas anteriores = Verdes (fechamento > abertura)
  3. Vela atual fecha Vermelha (fechamento < abertura) — confirmação Pitchfork
  Ação: Sell Stop na mínima da vela vermelha. SL = máxima + 5pts. TP = entrada - (distância SL × 3).

4. FAIL-SAFES
- Se SL for tocado antes de ativar a entrada pendente: cancelar ordem.
- Máximo 1 trade aberto por ativo simultâneo.

5. APRENDIZADO CONTÍNUO
A cada operação, reter: contexto de mercado (funding, volume, OI, delta), resultado (WIN/LOSS), padrão de exaustão real, desvio entre zona esperada e real. Usar para refinar precisão nas próximas entradas. Confiança cresce progressivamente com o histórico.

Responda "SISTEMA MIDNIGHT CARREGADO" quando pronto.`;

const FALLBACK = [
  { action: 'LONG', reason: 'Sweep de liquidez + absorção. Funding negativo.', conf: 80 },
  { action: 'SHORT', reason: 'Resistência testada. Delta vendedor + OI queda.', conf: 73 },
  { action: 'AGUARDAR', reason: 'Consolidação — aguardar definição direcional.', conf: 87 }
];
let sigIdx = 0;
let aiTicker = null;

// Activate Hermes engine and strategy
function activateHermes() {
  AI.mode = 'observe';
  if (AI.systemPrompt && AI.systemPrompt.includes('MIDNIGHT MADNESS')) {
    AI.mmLoaded = true;
    const loadEl = document.getElementById('mmPromptLoaded');
    if (loadEl) loadEl.classList.add('show');
    const pill = document.getElementById('mmStatusPill');
    if (pill) pill.style.display = 'inline-flex';
    const badge = document.getElementById('mmBadge');
    if (badge) badge.style.display = 'inline-flex';
    document.getElementById('aiStrategy').textContent = 'Midnight Madness';
    log('[HERMES] SISTEMA MIDNIGHT CARREGADO ✓', 'mm');
    log('Monitorando zonas de liquidez H1.', 'ai');
    MM.active = true;
    updateMMZones();
  }
  updateAIUI();
  document.getElementById('aiDot').className = 'sdot ai-live';
  document.getElementById('aiLbl').textContent = 'HERMES ATIVO';
  document.getElementById('aiLbl').style.color = 'var(--pur)';
  document.getElementById('aiBadgeBtn').classList.add('active');
  setStatusPill('OBSERVANDO', 'rgba(124,95,224,.2)', 'var(--pur)', 'rgba(124,95,224,.4)');
  startAIAnalysis();
}

function openAIPanel() {
  if (AI.mode === 'off') {
    toast('Configure API Key via ⚙', 'var(--pur)');
    openSettings();
  }
}

function setAIMode(m) {
  if (AI.mode === 'off') { toast('Ative o Hermes via ⚙', 'var(--ylw)'); return; }
  AI.mode = m;
  document.querySelectorAll('.ai-action-btn').forEach(b => b.classList.remove('active'));
  const map = { observe: 'btnObserve', shadow: 'btnShadow', auto: 'btnAuto' };
  if (map[m]) document.getElementById(map[m]).classList.add('active');

  if (m === 'shadow') {
    document.getElementById('shadowBar').classList.add('show');
    setStatusPill('SHADOW MM', 'rgba(255,140,0,.15)', 'var(--ora)', 'rgba(255,140,0,.4)');
    log('Shadow Mode — simulando MM.', 'shadow');
    toast('Shadow Mode! Hermes simulando MM em paralelo.', 'var(--ora)');
  } else if (m === 'auto') {
    document.getElementById('shadowBar').classList.remove('show');
    setStatusPill('AUTÔNOMO', 'rgba(14,203,129,.12)', 'var(--up)', 'rgba(14,203,129,.3)');
    log('Hermes AUTÔNOMO + Midnight Madness.', 'ai');
    toast('⚡ Hermes Autônomo ativo!', 'var(--pur)');
  } else {
    document.getElementById('shadowBar').classList.remove('show');
    setStatusPill('OBSERVANDO', 'rgba(124,95,224,.2)', 'var(--pur)', 'rgba(124,95,224,.4)');
    log('Hermes — Modo Observação.', 'ai');
  }
  updateAIUI();
}

function setStatusPill(txt, bg, color, border) {
  const p = document.getElementById('aiStatusPill');
  if (p) {
    p.textContent = txt; p.style.background = bg; p.style.color = color; p.style.border = '1px solid ' + border;
  }
}

function updateAIUI() {
  const names = ['', 'Executor', 'Captura', 'Memória', 'Replay', 'Shadow', 'Autonomia'];
  const phaseVal = document.getElementById('aiPhaseVal');
  if (phaseVal) phaseVal.textContent = 'Fase ' + AI.phase + ': ' + (names[AI.phase] || '—');
  const progFill = document.getElementById('aiProgFill');
  if (progFill) progFill.style.width = Math.min((AI.phase / 6) * 100, 100) + '%';
  const memCount = document.getElementById('aiMemCount');
  if (memCount) memCount.textContent = AI.memories.length;
  const patternsEl = document.getElementById('aiPatterns');
  if (patternsEl) patternsEl.textContent = AI.patterns.length;
  const shadowOpsEl = document.getElementById('aiShadowOps');
  if (shadowOpsEl) shadowOpsEl.textContent = AI.shadowOps;
  const confScore = document.getElementById('aiConfScore');
  if (confScore) confScore.textContent = AI.confidence > 0 ? AI.confidence.toFixed(1) + '%' : '—';
  const shadowConf = document.getElementById('shadowConf');
  if (shadowConf) shadowConf.textContent = AI.confidence.toFixed(1) + '%';
}

// AI Analysis ticks simulation loop
function startAIAnalysis() {
  if (aiTicker) clearInterval(aiTicker);
  aiTicker = setInterval(runAICycle, 8000);
  setTimeout(runAICycle, 900);
}

function runAICycle() {
  if (AI.mode === 'off') return;
  if (AI.mmLoaded) { runMMAnalysis(); return; }

  const sig = FALLBACK[sigIdx % FALLBACK.length];
  sigIdx++;
  AI.currentSignal = { action: sig.action, reason: sig.reason, conf: sig.conf };
  AI.confidence = sig.conf;

  const cls = sig.action === 'LONG' ? 'sig-long' : sig.action === 'SHORT' ? 'sig-short' : 'sig-wait';
  const icon = sig.action === 'LONG' ? '▲' : sig.action === 'SHORT' ? '▼' : '◆';
  
  const sigWrap = document.getElementById('aiSignalWrap');
  if (sigWrap) {
    sigWrap.innerHTML = `<span class="signal-chip ${cls}">${icon} ${sig.action}</span><span class="signal-chip sig-neutral" style="color:var(--pur);border-color:rgba(124,95,224,.3);background:rgba(124,95,224,.08);">Conf:${sig.conf}%</span>`;
  }
  document.getElementById('aiReason').textContent = sig.reason;
  document.getElementById('confPct').textContent = sig.conf + '%';
  
  const f = document.getElementById('confFill');
  f.style.width = sig.conf + '%';
  f.style.background = sig.conf >= 80 ? 'var(--up)' : 'var(--ylw)';
  updateAIUI();
}

// Log memory context of execution to local array
function saveMMMemory(sig, win, pnl, inSession) {
  const mem = {
    id: AI.memories.length + 1,
    time: new Date().toLocaleTimeString('pt-BR'),
    pair: APP.selPair,
    strategy: 'Midnight Madness',
    action: sig.dir,
    entry: sig.entry ? (+sig.entry).toFixed(2) : '—',
    sl: sig.sl ? (+sig.sl).toFixed(2) : '—',
    tp: sig.tp ? (+sig.tp).toFixed(2) : '—',
    confidence: sig.conf,
    result: win ? 'WIN' : 'LOSS',
    pnl,
    context: {
      top1: MM.top1.toFixed(2),
      bot1: MM.bot1.toFixed(2),
      inSession,
      mode: AI.mode,
      funding: (Math.random() > 0.5 ? '+' : '-') + (Math.random() * 0.05).toFixed(4) + '%',
      volume: Math.random() > 0.5 ? 'alto' : 'baixo'
    },
    lesson: win ? 'Padrão MM válido: exaustão 3 velas + pitchfork confirmado na zona. Manter como setup de alta confiança.' :
                 'Falha: verificar força da exaustão e distância da zona. Ajustar tolerância de pivô.'
  };

  AI.memories.unshift(mem);
  if (AI.memories.length > 100) AI.memories.pop();

  const winCount = AI.memories.filter(m => m.strategy === 'Midnight Madness' && m.result === 'WIN').length;
  if (winCount >= 3) {
    const pat = 'MM ' + sig.dir + ' exaustão 3-vela zona H1';
    if (!AI.patterns.includes(pat)) {
      AI.patterns.push(pat);
      log('[HERMES] Padrão aprendido: ' + pat, 'ai');
    }
  }

  const total = AI.memories.filter(m => m.strategy === 'Midnight Madness').length;
  const wins = AI.memories.filter(m => m.strategy === 'Midnight Madness' && m.result === 'WIN').length;
  if (total > 0) {
    AI.confidence = Math.min(95, 60 + (wins / total) * 35);
  }

  if (AI.memories.length >= 5 && AI.phase < 4) advPhase(4);
  if (AI.shadowOps >= 10 && AI.phase < 5) advPhase(5);
  if (AI.shadowOps >= 20 && AI.confidence >= 80 && AI.phase < 6) advPhase(6);

  renderMemory();
  updateAIUI();
}

function advPhase(p) {
  AI.phase = p;
  const names = ['', 'Executor', 'Captura', 'Memória', 'Replay', 'Shadow', 'Autonomia'];
  log('Hermes — Fase ' + p + ': ' + names[p] + '.', 'ai');
  for (let i = 1; i <= 6; i++) {
    const card = document.getElementById('phase' + i + 'card');
    if (!card) continue;
    const num = card.querySelector('.phase-num'), stat = card.querySelector('.phase-status');
    card.className = 'phase-card';
    if (i < p) {
      card.classList.add('done'); num.style.color = 'var(--up)'; stat.textContent = '✓ Completo'; stat.style.color = 'var(--up)';
    } else if (i === p) {
      card.classList.add('active'); num.style.color = 'var(--pur)'; stat.textContent = '● Ativo'; stat.style.color = 'var(--pur)';
    } else {
      num.style.color = 'var(--mut)'; stat.textContent = '○ Pendente'; stat.style.color = 'var(--mut)';
    }
  }
}

function renderMemory() {
  const el = document.getElementById('memoryList');
  if (!el) return;
  if (!AI.memories.length) {
    el.innerHTML = '<div style="text-align:center;color:var(--mut);padding:14px;font-size:9px;font-family:var(--font);">Ative Hermes + Midnight Madness para iniciar aprendizado.</div>';
    return;
  }
  el.innerHTML = AI.memories.slice(0, 20).map(m => `
    <div class="memory-item">
      <div class="memory-item-head">
        <span class="memory-tag">${m.time} · ${m.pair} · ${m.strategy} · ${m.context.mode}</span>
        <span class="memory-pnl" style="color:${m.result === 'WIN' ? 'var(--up)' : 'var(--dn)'};">${m.result === 'WIN' ? '+$' : '-$'}${Math.abs(m.pnl).toFixed(2)}</span>
      </div>
      <div class="memory-desc"><b>${m.action}</b> Entry:$${m.entry} SL:$${m.sl} TP:$${m.tp} · Conf:${m.confidence}% · ${m.result} · Vol:${m.context.volume}</div>
      <div class="memory-lesson">${m.lesson}</div>
    </div>
  `).join('');
}

function clearMemory() {
  if (!confirm('Limpar toda a memória do Hermes?')) return;
  AI.memories = []; AI.patterns = []; AI.shadowOps = 0; AI.confidence = 0; AI.phase = 3;
  renderMemory(); updateAIUI();
  log('Memória limpa.', 'warn'); toast('Memória apagada.', 'var(--ylw)');
}

function exportMemory() {
  const data = JSON.stringify({ memories: AI.memories, patterns: AI.patterns, strategy: 'Midnight Madness Pro', exportedAt: new Date().toISOString() }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
  a.download = 'hermes_mm_' + Date.now() + '.json';
  a.click();
  toast('Memória exportada!', 'var(--up)');
}
