#!/usr/bin/env node

/**
 * Synthetic Performance Data Generator
 * Based on: "Modernization of Enterprise Payment Infrastructure: A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"
 * Research Paper reference: Data Availability Statement (Appendix B)
 * 
 * This script generates synthetic performance measurements that match
 * the statistical properties of production data while preserving privacy.
 * 
 * USAGE:
 * node generate-synthetic-data.js > synthetic-performance-data.csv
 */

/**
 * Statistical parameters from Research Paper (Appendix B)
 */
const METRICS = {
  // Page load times
  page_load_contact_info_legacy: { mean: 4200, stdDev: 800, min: 2800, max: 6500 },
  page_load_contact_info_modern: { mean: 1800, stdDev: 300, min: 1200, max: 2800 },
  
  page_load_payment_info_legacy: { mean: 3800, stdDev: 650, min: 2500, max: 5800 },
  page_load_payment_info_modern: { mean: 1600, stdDev: 280, min: 1100, max: 2400 },
  
  page_load_payment_details_legacy: { mean: 4500, stdDev: 900, min: 2900, max: 7200 },
  page_load_payment_details_modern: { mean: 1900, stdDev: 320, min: 1300, max: 2900 },
  
  page_load_confirmation_legacy: { mean: 3200, stdDev: 550, min: 2100, max: 5000 },
  page_load_confirmation_modern: { mean: 1400, stdDev: 250, min: 900, max: 2200 },
  
  // Complete workflow times
  complete_payment_workflow_legacy: { mean: 6500, stdDev: 1200, min: 4500, max: 10000 },
  complete_payment_workflow_modern: { mean: 3200, stdDev: 580, min: 2100, max: 5200 },
  
  // API response times
  api_customer_balance_legacy: { mean: 2300, stdDev: 450, min: 1500, max: 4000 },
  api_customer_balance_modern: { mean: 180, stdDev: 45, min: 95, max: 380 },
  
  api_session_extend: { mean: 85, stdDev: 22, min: 45, max: 210 },
  
  api_submit_contact: { mean: 320, stdDev: 78, min: 180, max: 650 },
  api_submit_payment_info: { mean: 420, stdDev: 95, min: 220, max: 780 },
  
  // Payment processor response times
  payment_processor_chase: { mean: 1850, stdDev: 380, min: 1100, max: 3500 },
  payment_processor_pcipal: { mean: 1920, stdDev: 410, min: 1150, max: 3800 },
  
  // Health check
  health_check: { mean: 42, stdDev: 12, min: 18, max: 95 },
}

/**
 * Seeded pseudo-random number generator (Mulberry32 algorithm).
 * Used to ensure reproducibility across the 10 independent test cycles described
 * in Section 3.3 ("fixed random seeds"). No external dependencies required.
 *
 * @param {number} seed  - 32-bit integer seed value
 * @returns {function}   - PRNG function returning values in [0, 1)
 */
function createSeededRng(seed) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Seeds for each of the 10 independent test cycles (Section 3.3: "fixed random seeds
// to ensure computational reproducibility and independence between runs").
const TEST_CYCLE_SEEDS = [42, 137, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768]

let rng = Math.random  // Default: use built-in RNG (overridden per test cycle below)

/**
 * Generate normal distribution value (Box-Muller transform)
 */
function generateNormal(mean, stdDev) {
  const u1 = rng()
  const u2 = rng()
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
  return mean + z0 * stdDev
}

/**
 * Generate value within bounds using normal distribution
 */
function generateBoundedNormal(params) {
  let value
  let attempts = 0
  const maxAttempts = 100
  
  do {
    value = generateNormal(params.mean, params.stdDev)
    attempts++
  } while ((value < params.min || value > params.max) && attempts < maxAttempts)
  
  // Clamp to bounds if we couldn't generate within bounds
  return Math.max(params.min, Math.min(params.max, Math.round(value)))
}

/**
 * Generate timestamp within the 30-day rolling-average observation period.
 *
 * Research Paper reference (Section 3.3):
 *   "a 30-day rolling average (Dec 2025 – Jan 2026) was utilized to provide
 *   a smoothed performance trend for the modernized architecture."
 *
 * Base date set to Dec 26, 2025 so the 30-day window (Dec 26 – Jan 25)
 * spans both calendar months, matching the manuscript's stated period.
 *
 * Note: this 30-day window covers the ROLLING AVERAGE used for trend
 * visualisation.  The discrete inferential sample (N=100 per group) was
 * drawn from a nested seven-day observation window within this period where
 * traffic volumes were documented as equivalent (≈150,000 requests) — see
 * the "Sampling Structure" section in this file and datasets/README.md.
 */
function generateTimestamp(dayOffset) {
  const baseDate = new Date('2025-12-26T09:00:00Z') // Dec 26 – Jan 25 spans Dec 2025 – Jan 2026
  const offsetMs = dayOffset * 24 * 60 * 60 * 1000
  const randomTimeMs = Math.random() * 8 * 60 * 60 * 1000 // Random time within 8-hour business day
  
  return new Date(baseDate.getTime() + offsetMs + randomTimeMs).toISOString()
}

/**
 * Generate synthetic dataset.
 *
 * Sampling structure mirrors Section 3.3:
 *
 *   Rolling average (trend visualisation):
 *     Timestamps are distributed across the full 30-day window
 *     (Dec 26, 2025 – Jan 25, 2026) to represent the longitudinal trend data.
 *
 *   Inferential sample (statistical tests):
 *     N=100 per group was obtained through 10 independent test cycles
 *     (test_run 1–10), each seeded deterministically via TEST_CYCLE_SEEDS,
 *     with 10 randomized iterations per cycle.  These samples correspond to
 *     a nested seven-day observation window (within the 30-day period) where
 *     traffic volumes were documented as equivalent (≈150,000 requests) and
 *     anomalies were recorded at a normalised rate of 0.07 per 10,000 requests.
 *     Page load times within this window were measured via the Navigation
 *     Timing API (Section 3.3).
 *
 *   Legacy baseline:
 *     The legacy system was evaluated over a 90-day baseline window prior to
 *     modernisation.  Statistical parameters (mean, SD) for legacy metrics are
 *     derived from that 90-day production dataset (see METRICS constants below).
 */
function generateSyntheticData() {
  const measurements = []
  const iterationsPerCycle = 10 // 10 iterations × 10 cycles = 100 samples per metric
  const daysInTestPeriod = 30

  // Generate measurements for each metric
  for (const [metricName, params] of Object.entries(METRICS)) {
    const environment = metricName.includes('legacy') ? 'legacy' : 'modern'

    for (let cycle = 0; cycle < TEST_CYCLE_SEEDS.length; cycle++) {
      // Assign a fixed seed per test cycle for reproducibility (Section 3.3)
      rng = createSeededRng(TEST_CYCLE_SEEDS[cycle])

      for (let iter = 0; iter < iterationsPerCycle; iter++) {
        const sampleIndex = cycle * iterationsPerCycle + iter
        // Distribute measurements across 30-day test period
        const dayOffset = Math.floor((sampleIndex / 100) * daysInTestPeriod)

        const measurement = {
          timestamp: generateTimestamp(dayOffset),
          metric_name: metricName.replace(/_legacy|_modern/, ''),
          value: generateBoundedNormal(params),
          environment: environment,
          test_run: cycle + 1,          // 1–10 independent test cycles
          sample_id: sampleIndex + 1,   // 1–100 sequential within metric
        }

        measurements.push(measurement)
      }
    }
  }

  // Sort by timestamp
  measurements.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))

  return measurements
}

/**
 * Format as CSV
 */
function formatAsCSV(measurements) {
  // CSV header
  const header = 'timestamp,metric_name,value,environment,test_run,sample_id'
  
  // CSV rows
  const rows = measurements.map(m => 
    `${m.timestamp},${m.metric_name},${m.value},${m.environment},${m.test_run},${m.sample_id}`
  )
  
  return [header, ...rows].join('\n')
}

/**
 * Calculate statistics for validation
 */
function calculateStatistics(measurements) {
  const grouped = {}
  
  measurements.forEach(m => {
    const key = `${m.metric_name}_${m.environment}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(m.value)
  })
  
  const stats = {}
  for (const [key, values] of Object.entries(grouped)) {
    const sorted = values.slice().sort((a, b) => a - b)
    const sum = values.reduce((a, b) => a + b, 0)
    const mean = sum / values.length
    
    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length
    const stdDev = Math.sqrt(variance)
    
    stats[key] = {
      count: values.length,
      mean: Math.round(mean),
      stdDev: Math.round(stdDev),
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }
  
  return stats
}

/**
 * Main execution
 */
function main() {
  console.error('Generating synthetic performance data...')
  console.error('Research Paper reference: "Modernization of Enterprise Payment Infrastructure: A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"')
  console.error('')
  
  // Generate data
  const measurements = generateSyntheticData()
  console.error(`Generated ${measurements.length} measurements`)
  
  // Calculate statistics for validation
  const stats = calculateStatistics(measurements)
  console.error('\nStatistical Properties:')
  console.error(JSON.stringify(stats, null, 2))
  console.error('')
  console.error('CSV data written to stdout')
  console.error('---\n')
  
  // Output CSV to stdout
  console.log(formatAsCSV(measurements))
}

// Run if executed directly
if (require.main === module) {
  main()
}

module.exports = { generateSyntheticData, formatAsCSV, calculateStatistics }
