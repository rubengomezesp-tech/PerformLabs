// PerformLabs — modelo financiero (algoritmo). Ejecutar: node scripts/business-model.mjs
// Moneda agnóstica (uso $ para casar con las cifras del fundador). Misma lógica en €.
// Objetivo: elegir el modelo que más gana PerformLabs SIN dejar de ser atractivo
// para el entrenador (que se quede ~70-80% de SUS ingresos).

// ---------------- Supuestos base (editables) ----------------
const ASSUMPTIONS = {
  avgClientsStart: 15, // clientes activos al lanzar
  avgClientsSteady: 40, // clientes activos en régimen (coach online medio)
  rampMonths: 6, // meses hasta llegar a régimen
  avgPrice: 50, // precio medio cliente/mes
  monthlyChurn: 0.05, // rotación de clientes (informativo)
  trainerLifetimeYears: 3, // vida media de un entrenador (conservador)
  stripePct: 0.029, // comisión Stripe variable
  stripeFixed: 0.3, // comisión Stripe fija por cobro
  annualFee: 100, // mantenimiento/año a PerformLabs
};

// Escenarios: [nombre, setup, share]
const SCENARIOS = [
  { name: "A  setup 5000 + 25%", setup: 5000, share: 0.25 },
  { name: "B  setup 3000 + 30%", setup: 3000, share: 0.30 },
  { name: "C  setup 0 + 35%", setup: 0, share: 0.35 },
  { name: "D  setup 5000 + 20%", setup: 5000, share: 0.20 },
  { name: "E  setup 4000 + 25%", setup: 4000, share: 0.25 },
];

const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
const pct = (n) => (n * 100).toFixed(0) + "%";

// Clientes activos del entrenador en el mes m (rampa lineal hasta régimen)
function clientsAtMonth(m) {
  const { avgClientsStart: s, avgClientsSteady: e, rampMonths: r } = ASSUMPTIONS;
  if (m >= r) return e;
  return Math.round(s + ((e - s) * m) / r);
}

// Ingreso de PerformLabs por UN entrenador a lo largo de `years` (setup + anual + 25% sobre bruto)
function perfLabsPerTrainer(setup, share, years) {
  const months = years * 12;
  let revShare = 0;
  for (let m = 0; m < months; m++) {
    const grossMRR = clientsAtMonth(m) * ASSUMPTIONS.avgPrice;
    revShare += grossMRR * share;
  }
  const annual = ASSUMPTIONS.annualFee * years;
  return { setup, annual, revShare, total: setup + annual + revShare };
}

// Lo que se queda el entrenador (75% del bruto) en régimen, mensual
function trainerNetSteady(share) {
  const grossMRR = ASSUMPTIONS.avgClientsSteady * ASSUMPTIONS.avgPrice;
  const stripe = ASSUMPTIONS.avgClientsSteady * (ASSUMPTIONS.avgPrice * ASSUMPTIONS.stripePct + ASSUMPTIONS.stripeFixed);
  const perfLabs = grossMRR * share;
  return { grossMRR, perfLabs, stripe, trainerNet: grossMRR - perfLabs - stripe, keepPct: 1 - share };
}

console.log("\n=== SUPUESTOS ===");
console.log(`Clientes: ${ASSUMPTIONS.avgClientsStart}→${ASSUMPTIONS.avgClientsSteady} en ${ASSUMPTIONS.rampMonths} meses · precio ${money(ASSUMPTIONS.avgPrice)}/mes · vida entrenador ${ASSUMPTIONS.trainerLifetimeYears} años`);

console.log("\n=== UNIT ECONOMICS POR ENTRENADOR (lo que gana PerformLabs) ===");
console.log("escenario              | régimen $/mes |  Año 1  |  LTV 3 años | entrenador se queda");
for (const s of SCENARIOS) {
  const steady = ASSUMPTIONS.avgClientsSteady * ASSUMPTIONS.avgPrice * s.share;
  const y1 = perfLabsPerTrainer(s.setup, s.share, 1).total;
  const ltv = perfLabsPerTrainer(s.setup, s.share, ASSUMPTIONS.trainerLifetimeYears).total;
  const keep = trainerNetSteady(s.share).keepPct;
  console.log(
    `${s.name.padEnd(22)} | ${money(steady).padStart(12)} | ${money(y1).padStart(7)} | ${money(ltv).padStart(10)} | ${pct(keep)} (${money(trainerNetSteady(s.share).trainerNet)}/mes)`,
  );
}

console.log("\n=== SENSIBILIDAD (modelo recomendado A: 5000 + 25%) — LTV 3 años según tamaño del entrenador ===");
console.log("clientes\\precio |   $30   |   $50   |   $80");
for (const c of [20, 40, 80]) {
  const row = [30, 50, 80].map((p) => {
    let rev = 0;
    for (let m = 0; m < 36; m++) rev += c * p * 0.25; // régimen fijo para sensibilidad
    return money(5000 + 300 + rev).padStart(8);
  });
  console.log(`${String(c).padEnd(15)}| ${row.join(" | ")}`);
}

console.log("\n=== PROYECCIÓN PLATAFORMA (modelo A) — cartera de entrenadores en régimen ===");
console.log("entrenadores | MRR PerformLabs | ARR PerformLabs");
const steadyPerTrainer = ASSUMPTIONS.avgClientsSteady * ASSUMPTIONS.avgPrice * 0.25;
for (const g of [10, 25, 50, 100]) {
  const mrr = g * steadyPerTrainer;
  console.log(`${String(g).padEnd(12)} | ${money(mrr).padStart(15)} | ${money(mrr * 12).padStart(15)}`);
}

console.log("\n=== RECOMENDACIÓN (algoritmo) ===");
// Score = LTV PerformLabs ponderado por atractivo para el entrenador (penaliza que se quede <72%)
const scored = SCENARIOS.map((s) => {
  const ltv = perfLabsPerTrainer(s.setup, s.share, ASSUMPTIONS.trainerLifetimeYears).total;
  const keep = 1 - s.share;
  const attractiveness = keep >= 0.72 ? 1 : keep / 0.72; // penaliza quedarse <72%
  const cashflow = s.setup / 5000; // valora el upfront (CAC/cashflow)
  const score = ltv * (0.7 * attractiveness + 0.3 * cashflow);
  return { ...s, ltv, keep, score };
}).sort((a, b) => b.score - a.score);
for (const s of scored) {
  console.log(`${s.name.padEnd(22)} | LTV ${money(s.ltv).padStart(8)} | entrenador ${pct(s.keep)} | score ${Math.round(s.score).toLocaleString("en-US")}`);
}
console.log(`\n→ GANADOR: ${scored[0].name}`);
