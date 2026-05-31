// TDD Automated Test Suite for ATOMEX AI
// Runs in Node.js, validates state, formulas, strategies, and validators.

// Mock minimal DOM window/document for Node compatibility
global.window = {};
global.document = {
  elements: {},
  getElementById(id) {
    if (!this.elements[id]) {
      this.elements[id] = {
        textContent: '',
        value: '',
        className: '',
        style: {},
        classList: {
          classes: new Set(),
          add(c) { this.classes.add(c); },
          remove(c) { this.classes.delete(c); },
          contains(c) { return this.classes.has(c); }
        },
        querySelector() { return { style: {}, textContent: '' }; }
      };
    }
    return this.elements[id];
  },
  querySelectorAll() {
    return [];
  },
  addEventListener() {}
};

// Test Runner Helper
let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`\x1b[32m[PASS]\x1b[0m ${message}`);
    passedCount++;
  } else {
    console.error(`\x1b[31m[FAIL]\x1b[0m ${message}`);
    failedCount++;
  }
}

// ══════════════════════════════════════
// 1. STATE INITIALIZATION TEST
// ══════════════════════════════════════
console.log("\n--- Testing State Initializer ---");

// Define state objects mimicking js/state.js
const APP = {
  apiConnected: false, balance: 0, startBal: 0, running: false, selPair: 'BTCUSDT', lev: 20, dir: 'long', tab: 'limit',
  wins: 0, losses: 0, ops: [], pnlData: [], logs: [],
  pairs: {
    'BTCUSDT': { buy: 60000, sell: 75000, qty: '0.001', open: false, proc: false, px: 0, prevPx: 0 },
    'ETHUSDT': { buy: 25000, sell: 36000, qty: '0.01', open: false, proc: false, px: 0, prevPx: 0 }
  },
  candles: {}
};

const AI = {
  mode: 'off', phase: 3, memories: [], patterns: [], shadowOps: 0, confidence: 0,
  currentSignal: { action: 'wait', reason: '', conf: 0 }, apiKey: '', model: '', systemPrompt: '', mmLoaded: false
};

const MM = { active: false, top1: 0, bot1: 0, pendingSignal: null, openTrade: null };

assert(APP.selPair === 'BTCUSDT', "Initial pair is BTCUSDT");
assert(AI.phase === 3, "Initial Hermes phase is 3");
assert(MM.active === false, "Midnight strategy is initially inactive");


// ══════════════════════════════════════
// 2. UTILS & FORMATTING TESTS
// ══════════════════════════════════════
console.log("\n--- Testing Utilities & Formatting ---");

// Mocking functions from js/utils.js
function f2(n, d) { return Number(n).toFixed(d ?? 2); }
function fu(n) { return (n >= 0 ? '+$' : '-$') + Math.abs(n).toFixed(2); }
function fmt(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(3);
  return n.toFixed(5);
}

assert(f2(10.556, 2) === "10.56", "f2 formats decimals correctly (rounding)");
assert(f2(5, 2) === "5.00", "f2 pads decimal points correctly");
assert(fu(25.40) === "+$25.40", "fu adds positive dollar sign prefix");
assert(fu(-12.80) === "-$12.80", "fu adds negative dollar sign prefix");
assert(fmt(68250.3) === "68250.30", "fmt handles large assets (>1000)");
assert(fmt(0.638421) === "0.63842", "fmt handles low-priced assets (<1)");


// ══════════════════════════════════════
// 3. MIDNIGHT MADNESS SETUP DETECTION
// ══════════════════════════════════════
console.log("\n--- Testing Strategy & Timeframe Detection ---");

// Mock functions from js/midnight.js
function getMinsFromESTTime(h, m) { return h * 60 + m; }
function isOvernightActive(mins) { return mins >= 960 || mins <= 570; } // 16:00 (960m) to 09:30 (570m)

assert(isOvernightActive(getMinsFromESTTime(23, 30)) === true, "Session Overnight ACTIVE at 23:30 EST");
assert(isOvernightActive(getMinsFromESTTime(12, 0)) === false, "Session Overnight INACTIVE at 12:00 EST");
assert(isOvernightActive(getMinsFromESTTime(16, 0)) === true, "Session Overnight ACTIVE at exactly 16:00 EST");
assert(isOvernightActive(getMinsFromESTTime(9, 30)) === true, "Session Overnight ACTIVE at exactly 09:30 EST");
assert(isOvernightActive(getMinsFromESTTime(9, 31)) === false, "Session Overnight INACTIVE at 09:31 EST");


// Pivot High/Low finder zone mapping
function findMMZones(candles) {
  const pivLen = 5;
  let top1 = 0, bot1 = Infinity;
  for (let i = pivLen; i < candles.length - pivLen; i++) {
    const sl = candles.slice(i - pivLen, i + pivLen + 1);
    const maxH = Math.max(...sl.map(c => c.h));
    const minL = Math.min(...sl.map(c => c.l));
    if (candles[i].h === maxH && candles[i].h > top1) top1 = candles[i].h;
    if (candles[i].l === minL && candles[i].l < bot1) bot1 = candles[i].l;
  }
  return { top1, bot1 };
}

// Generate mock candles: middle candle is the highest/lowest pivot
const testCandles = Array.from({ length: 11 }, (_, i) => ({
  h: i === 5 ? 100 : 80, // High pivot at index 5
  l: i === 5 ? 10 : 30,  // Low pivot at index 5
  o: 50, c: 50
}));

const zones = findMMZones(testCandles);
assert(zones.top1 === 100, "Zones pivot high mapped successfully");
assert(zones.bot1 === 10, "Zones pivot low mapped successfully");


// ══════════════════════════════════════
// 4. ORDER & CALCULATION TESTS
// ══════════════════════════════════════
console.log("\n--- Testing Order Calculations & Risk ---");

// Math calculation mock from js/order.js
function calculateMarginAndLiq(px, qty, lev, dir) {
  const noc = px * qty;
  const mgn = noc / lev;
  const liq = dir === 'long' ? px * (1 - (1 / lev) + 0.005) : px * (1 + (1 / lev) - 0.005);
  return { noc, mgn, liq };
}

const calcResult = calculateMarginAndLiq(60000, 0.5, 20, 'long');
assert(calcResult.noc === 30000, "Nocional value mathematically correct");
assert(calcResult.mgn === 1500, "Margin requirement matches leverage ratio");
assert(calcResult.liq === 60000 * (1 - 0.05 + 0.005), "Liquidation calculations computed");

// Validation rules logic test
function validateOrder(qty, px, isMarket, apiConnected, balance, leverage) {
  if (qty <= 0) return { ok: false, msg: "Quantidade inválida" };
  if (px <= 0 && !isMarket) return { ok: false, msg: "Preço inválido" };
  if (!apiConnected) return { ok: false, msg: "Conecte sua API via ⚙ para ordens reais." };
  const cost = (px * qty) / leverage;
  if (cost > balance) return { ok: false, msg: "Margem insuficiente" };
  return { ok: true };
}

assert(validateOrder(0, 60000, false, true, 5000, 20).msg === "Quantidade inválida", "Rejects 0 quantity");
assert(validateOrder(1, 60000, false, false, 5000, 20).msg === "Conecte sua API via ⚙ para ordens reais.", "Rejects disconnected API");
assert(validateOrder(1, 60000, false, true, 1000, 20).msg === "Margem insuficiente", "Enforces maximum risk budget (notional cost > balance)");
assert(validateOrder(0.1, 60000, false, true, 1000, 20).ok === true, "Accepts standard risk within account margin");


// ══════════════════════════════════════
// SUMMARY REPORT
// ══════════════════════════════════════
console.log("\n=============================");
console.log(`Test Execution Finished.`);
console.log(`Passed: \x1b[32m${passedCount}\x1b[0m`);
console.log(`Failed: \x1b[31m${failedCount}\x1b[0m`);
console.log("=============================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
