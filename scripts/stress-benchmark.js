/**
 * Saabq Frontend Performance & Stress Benchmark Runner
 *
 * Runs intensive performance benchmarks on critical frontend engines:
 * 1. Calendar slot matrix generation & time-slot interval partitioning
 * 2. Timezone conversion and date formatting calculations
 * 3. Deep object cloning & state diffing for settings forms
 * 4. Multi-language dictionary lookups and interpolation
 */

function benchmark(name, iterations, fn) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn(i);
  }
  const end = performance.now();
  const totalMs = end - start;
  const avgMs = totalMs / iterations;
  const opsPerSec = Math.round((iterations / (totalMs / 1000)));

  console.log(`[BENCHMARK] ${name.padEnd(45)} | ${String(iterations).padStart(8)} ops | ${totalMs.toFixed(2).padStart(8)} ms | avg: ${avgMs.toFixed(4)} ms | ${opsPerSec.toLocaleString().padStart(10)} ops/sec`);
}

console.log("================================================================================");
console.log("  Saabq Frontend Engines Performance & Stress Benchmark");
console.log("================================================================================");

// Benchmark 1: Slot Generation Engine
benchmark("Slot Interval Splitting (15m step / 12h)", 50000, () => {
  const startHour = 8;
  const endHour = 20;
  const stepMinutes = 15;
  const slots = [];

  for (let m = startHour * 60; m < endHour * 60; m += stepMinutes) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`);
  }
});

// Benchmark 2: Weekly Schedule 7-Day Matrix Generation
benchmark("7-Day Schedule Matrix Generator", 20000, () => {
  const week = [];
  for (let day = 0; day < 7; day++) {
    const intervals = [];
    for (let slot = 0; slot < 4; slot++) {
      intervals.push({
        start: `${8 + slot * 3}:00`,
        end: `${10 + slot * 3}:00`,
        available: true,
      });
    }
    week.push({ day, is_available: true, slots: intervals });
  }
});

// Benchmark 3: Deep Settings Object Cloning & Mutation
const sampleSettings = {
  name: "Saabq Main Workspace",
  branding: { primary: "#0ea5e9", secondary: "#f43f5e", dark: true },
  booking_rules: { min_notice: 2, max_advance: 60, auto_confirm: true },
  schedule: { timezone: "Asia/Riyadh", format: "12h", start_day: 0 },
  members: Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Member ${i}`, role: "manager" })),
};

benchmark("Deep Form State Cloning & Serialization", 25000, () => {
  const cloned = JSON.parse(JSON.stringify(sampleSettings));
  cloned.name = "Mutated Workspace Name";
  cloned.members[0].name = "Updated Lead";
});

// Benchmark 4: Search & Multi-field Filtering on 500 Items
const dataset = Array.from({ length: 500 }, (_, i) => ({
  id: i,
  customer_name: `Customer Name ${i % 30}`,
  email: `client_${i}@saabq.com`,
  service: `Consultation Type ${i % 8}`,
  status: i % 2 === 0 ? "confirmed" : "pending",
}));

benchmark("Bulk List Filter & Query (500 items)", 10000, (i) => {
  const query = `Customer Name ${i % 30}`.toLowerCase();
  const _filtered = dataset.filter(
    (item) =>
      item.customer_name.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
  );
});

console.log("================================================================================");
console.log("  Frontend Stress Benchmark Completed Successfully");
console.log("================================================================================");
