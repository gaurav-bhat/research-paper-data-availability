/**
 * Performance Testing Script - Payment Portal
 * Based on: "Modernization of Enterprise Payment Infrastructure: A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"
 * Research Paper reference: Evaluation methodology (Section 3.3)
 * 
 * This script simulates realistic payment workflows for performance testing.
 * Can be used with Artillery.io or run standalone with Node.js.
 * 
 * REQUIREMENTS:
 * npm install artillery axios @faker-js/faker
 * 
 * USAGE:
 * artillery run payment-workflow.artillery.yml
 * OR
 * node payment-workflow-test.js
 */

import axios from 'axios'
import { faker } from '@faker-js/faker'

/**
 * Test Configuration
 * Research Paper reference: "100 measurements per metric during business hours (aggregated across 10 independent load-test cycles)"
 */
export const testConfig = {
  // Target environment
  baseUrl: process.env.TEST_BASE_URL || 'https://pay-staging.example.com',
  
  // Load profile
  virtualUsers: 50,  // Concurrent users
  duration: 1800,    // Test duration in seconds (30 minutes)
  rampUpTime: 300,   // Ramp up to max users over 5 minutes
  
  // Request timeouts
  timeout: 30000,    // 30 seconds
  
  // Think times (user delays between actions)
  thinkTime: {
    min: 2000,       // Minimum 2 seconds
    max: 10000,      // Maximum 10 seconds
  },
  
  // Performance thresholds (from Research Paper)
  performanceTargets: {
    pageLoadTime: 2000,        // 2 seconds max
    paymentCompletion: 3200,   // 3.2 seconds max
    apiResponseTime: 500,      // 500ms max for API calls
  },
}

/**
 * Test Scenarios
 * Research Paper reference: Payment workflow implementation (Section 3)
 */
export class PaymentWorkflowTest {
  constructor(baseUrl) {
    this.baseUrl = baseUrl
    this.axios = axios.create({
      baseURL: baseUrl,
      timeout: testConfig.timeout,
      headers: {
        'User-Agent': 'PerformanceTest/1.0',
      },
    })
    this.metrics = []
  }

  /**
   * Generate realistic test data
   */
  generateTestData() {
    return {
      customer: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: faker.internet.email(),
        companyName: faker.company.name(),
        phoneNumber: faker.phone.number(),
        customerNumber: `CUST${faker.string.numeric(6)}`,
      },
      payment: {
        amount: faker.number.int({ min: 10000, max: 500000 }), // $100 - $5000
        currency: faker.helpers.arrayElement(['USD', 'GBP', 'EUR', 'CAD']),
        invoices: [
          `INV${faker.string.numeric(8)}`,
          `INV${faker.string.numeric(8)}`,
        ],
      },
    }
  }

  /**
   * Simulate user think time
   */
  async thinkTime() {
    const delay = faker.number.int({
      min: testConfig.thinkTime.min,
      max: testConfig.thinkTime.max,
    })
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Record performance metric
   */
  recordMetric(metricName, startTime, success = true, error = null) {
    const duration = Date.now() - startTime
    this.metrics.push({
      timestamp: new Date().toISOString(),
      metric_name: metricName,
      value: duration,
      environment: 'test',
      success,
      error: error?.message,
    })
    return duration
  }

  /**
   * Scenario 1: Complete Payment Workflow (Happy Path)
   * Research Paper reference: "Payment completion time: 6.5s to 3.2s"
   */
  async completePaymentWorkflow() {
    const testData = this.generateTestData()
    const workflowStartTime = Date.now()

    try {
      // Step 1: Load contact information page
      let stepStartTime = Date.now()
      const contactPage = await this.axios.get('/contact-information')
      this.recordMetric('page_load_contact_info', stepStartTime, true)
      
      await this.thinkTime()

      // Step 2: Submit contact information
      stepStartTime = Date.now()
      const contactSubmit = await this.axios.post('/contact-information', testData.customer, {
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': this.extractCsrfToken(contactPage.data),
        },
      })
      this.recordMetric('api_submit_contact', stepStartTime, true)
      
      await this.thinkTime()

      // Step 3: Load payment information page (invoice selection)
      stepStartTime = Date.now()
      const paymentInfoPage = await this.axios.get('/payment-information')
      this.recordMetric('page_load_payment_info', stepStartTime, true)
      
      await this.thinkTime()

      // Step 4: Check customer balance (async)
      stepStartTime = Date.now()
      try {
        const balanceCheck = await this.axios.get(
          `/api/customer-balance/${testData.customer.customerNumber}`
        )
        this.recordMetric('api_customer_balance', stepStartTime, true)
      } catch (error) {
        // Balance check failure shouldn't block payment
        this.recordMetric('api_customer_balance', stepStartTime, false, error)
      }

      // Step 5: Submit payment information (invoice selection)
      stepStartTime = Date.now()
      const paymentSubmit = await this.axios.post('/payment-information', {
        invoices: testData.payment.invoices,
        amount: testData.payment.amount,
        currency: testData.payment.currency,
      })
      this.recordMetric('api_submit_payment_info', stepStartTime, true)
      
      await this.thinkTime()

      // Step 6: Load payment details page (payment processor iframe)
      stepStartTime = Date.now()
      const paymentDetailsPage = await this.axios.get('/payment-details')
      this.recordMetric('page_load_payment_details', stepStartTime, true)
      
      // Simulate payment processor interaction (we can't actually process in test)
      await this.thinkTime()

      // Step 7: Payment processing simulation
      stepStartTime = Date.now()
      // In real scenario, this would be iframe interaction
      // For testing, we simulate the processing time
      await new Promise(resolve => setTimeout(resolve, 2000))
      this.recordMetric('payment_processor_response', stepStartTime, true)

      // Step 8: Load confirmation page
      stepStartTime = Date.now()
      const confirmationPage = await this.axios.get('/payment-confirmation')
      this.recordMetric('page_load_confirmation', stepStartTime, true)

      // Record complete workflow time
      const totalDuration = this.recordMetric(
        'complete_payment_workflow',
        workflowStartTime,
        true
      )

      return {
        success: true,
        duration: totalDuration,
        testData,
      }

    } catch (error) {
      this.recordMetric('complete_payment_workflow', workflowStartTime, false, error)
      return {
        success: false,
        error: error.message,
        testData,
      }
    }
  }

  /**
   * Scenario 2: Session Extension Test
   * Research Paper reference: "Session timeout issues reduced by 89%"
   */
  async sessionExtensionTest() {
    const startTime = Date.now()

    try {
      // Load initial page to create session
      await this.axios.get('/contact-information')
      
      // Wait 25 minutes (near timeout)
      console.log('Simulating 25-minute user inactivity...')
      await new Promise(resolve => setTimeout(resolve, 25 * 60 * 1000))
      
      // Attempt session extension
      const extensionStartTime = Date.now()
      const extension = await this.axios.post('/api/session/extend')
      this.recordMetric('session_extension', extensionStartTime, true)
      
      // Verify session is still valid
      const verifyStartTime = Date.now()
      const verify = await this.axios.get('/contact-information')
      this.recordMetric('session_verify_after_extension', verifyStartTime, true)
      
      return { success: true }

    } catch (error) {
      this.recordMetric('session_extension_test', startTime, false, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Scenario 3: Customer Balance Query Performance
   * Research Paper reference: "Asynchronous balance check, eliminating 2.3s blocking time"
   */
  async balanceQueryPerformanceTest() {
    const testData = this.generateTestData()

    try {
      // Test synchronous (legacy) approach timing
      const syncStartTime = Date.now()
      await this.axios.get(`/api/customer-balance/${testData.customer.customerNumber}`)
      this.recordMetric('balance_query_async', syncStartTime, true)

      return { success: true }

    } catch (error) {
      this.recordMetric('balance_query_async', Date.now(), false, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Helper: Extract CSRF token from HTML
   */
  extractCsrfToken(html) {
    const match = html.match(/name="csrf-token" content="([^"]+)"/)
    return match ? match[1] : 'test-token'
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics() {
    return this.metrics
  }

  /**
   * Calculate statistics
   */
  calculateStats() {
    const grouped = {}
    
    this.metrics.forEach(metric => {
      if (!grouped[metric.metric_name]) {
        grouped[metric.metric_name] = []
      }
      grouped[metric.metric_name].push(metric.value)
    })

    const stats = {}
    for (const [name, values] of Object.entries(grouped)) {
      const sorted = values.sort((a, b) => a - b)
      const sum = values.reduce((a, b) => a + b, 0)
      
      stats[name] = {
        count: values.length,
        mean: sum / values.length,
        median: sorted[Math.floor(sorted.length / 2)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      }
    }

    return stats
  }
}

/**
 * Main test execution
 */
async function runPerformanceTest() {
  console.log('Starting performance test suite...')
  console.log(`Target: ${testConfig.baseUrl}`)
  console.log(`Virtual Users: ${testConfig.virtualUsers}`)
  console.log(`Duration: ${testConfig.duration}s`)
  console.log('---')

  const tester = new PaymentWorkflowTest(testConfig.baseUrl)
  const results = []

  // Run multiple iterations
  const iterations = 10 // Run 10 complete workflows for testing
  
  for (let i = 0; i < iterations; i++) {
    console.log(`Running iteration ${i + 1}/${iterations}...`)
    const result = await tester.completePaymentWorkflow()
    results.push(result)
    
    if (result.success) {
      console.log(`  ✓ Success - ${result.duration}ms`)
    } else {
      console.log(`  ✗ Failed - ${result.error}`)
    }
  }

  // Calculate and display statistics
  console.log('\n--- Performance Statistics ---')
  const stats = tester.calculateStats()
  console.log(JSON.stringify(stats, null, 2))

  // Export metrics to CSV
  const metrics = tester.exportMetrics()
  console.log(`\nTotal metrics collected: ${metrics.length}`)
  
  return { results, stats, metrics }
}

// Export for use in other scripts
export default PaymentWorkflowTest

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPerformanceTest()
    .then(() => console.log('\nTest completed successfully'))
    .catch(error => console.error('\nTest failed:', error))
}
