// ══════════════════════════════════════
// ATOMEX AI — Utility Helpers (utils.js)
// ══════════════════════════════════════

// Format numbers to fixed decimal points
function f2(n, d) {
  return Number(n).toFixed(d ?? 2);
}

// Format numbers into positive/negative dollar indicators
function fu(n) {
  return (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2);
}

// Asset-specific price display formatting
function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

// Display temporary notification toasts
function toast(msg, c) {
  const e = document.getElementById('toastEl');
  if (!e) return;
  e.textContent = msg;
  e.style.color = c || 'var(--txt)';
  e.classList.add('show');
  
  // Clear previous timeout if any
  if (window.toastTimeout) clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => e.classList.remove('show'), 3200);
}

// Log actions into the system output console
function log(msg, type) {
  const now = new Date().toLocaleTimeString('pt-BR');
  APP.logs.unshift({ msg: '[' + now + '] ' + msg, type: type || 'info' });
  
  if (APP.logs.length > 100) {
    APP.logs.pop();
  }
  
  const logBox = document.getElementById('logBox');
  if (logBox) {
    logBox.innerHTML = APP.logs.map(l => `<div class="ll ${l.type}">${l.msg}</div>`).join('');
  }
}

// System clock updating (EST zone)
function clkFn() {
  try {
    const t = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false });
    const clkEl = document.getElementById('clk');
    if (clkEl) {
      clkEl.textContent = t + ' EST';
    }
    if (MM.active) {
      checkMMSession();
    }
  } catch (e) {
    const clkEl = document.getElementById('clk');
    if (clkEl) {
      clkEl.textContent = new Date().toLocaleTimeString('pt-BR');
    }
  }
}
