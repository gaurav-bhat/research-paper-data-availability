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
 * Generate normal distribution value (Box-Muller transform)
 */
function generateNormal(mean, stdDev) {
  const u1 = Math.random()
  const u2 = Math.random()
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
 * Generate timestamp within test period
 * Research Paper reference: "30-day rolling average post-deployment"
 */
function generateTimestamp(dayOffset) {
  const baseDate = new Date('2025-12-01T09:00:00Z') // Start of test period
  const offsetMs = dayOffset * 24 * 60 * 60 * 1000
  const randomTimeMs = Math.random() * 8 * 60 * 60 * 1000 // Random time within 8-hour business day
  
  return new Date(baseDate.getTime() + offsetMs + randomTimeMs).toISOString()
}

/**
 * Generate synthetic dataset
 */
function generateSyntheticData() {
  const measurements = []
  const measurementsPerMetric = 100 // 100 samples per metric
  const daysInTestPeriod = 30
  
  // Generate measurements for each metric
  for (const [metricName, params] of Object.entries(METRICS)) {
    const environment = metricName.includes('legacy') ? 'legacy' : 'modern'
    
    for (let i = 0; i < measurementsPerMetric; i++) {
      // Distribute measurements across 30-day test period
      const dayOffset = Math.floor((i / measurementsPerMetric) * daysInTestPeriod)
      
      const measurement = {
        timestamp: generateTimestamp(dayOffset),
        metric_name: metricName.replace(/_legacy|_modern/, ''),
        value: generateBoundedNormal(params),
        environment: environment,
        test_run: Math.floor(i / 10) + 1, // Group into test runs
        sample_id: i + 1,
      }
      
      measurements.push(measurement)
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
