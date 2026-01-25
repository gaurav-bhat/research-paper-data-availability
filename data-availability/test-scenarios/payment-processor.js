/**
 * Artillery Processor for Custom Payment Workflow Logic
 * Companion file to payment-workflow.artillery.yml
 */

const { faker } = require('@faker-js/faker')

/**
 * Record metric with timestamp
 */
function recordMetric(requestParams, response, context, ee, next) {
  const duration = response.timings.phases.total || 0
  
  ee.emit('counter', `custom.${requestParams.name || 'request'}.count`, 1)
  ee.emit('histogram', `custom.${requestParams.name || 'request'}.duration`, duration)
  
  return next()
}

/**
 * Record balance query performance
 */
function recordBalanceQuery(requestParams, response, context, ee, next) {
  const duration = response.timings.phases.total || 0
  
  ee.emit('histogram', 'custom.balance_query.duration', duration)
  
  // Check if it was blocking (synchronous) or non-blocking (async)
  if (duration > 1000) {
    ee.emit('counter', 'custom.balance_query.slow', 1)
  }
  
  return next()
}

/**
 * Record payment details page load
 */
function recordPaymentDetailsLoad(requestParams, response, context, ee, next) {
  const duration = response.timings.phases.total || 0
  
  ee.emit('histogram', 'custom.payment_details_page.duration', duration)
  
  // Validate against target (2 seconds from Research Paper)
  if (duration > 2000) {
    ee.emit('counter', 'custom.payment_details_page.exceeded_target', 1)
  }
  
  return next()
}

/**
 * Record session extension
 */
function recordSessionExtension(requestParams, response, context, ee, next) {
  const duration = response.timings.phases.total || 0
  
  ee.emit('histogram', 'custom.session_extension.duration', duration)
  ee.emit('counter', 'custom.session_extension.success', 1)
  
  return next()
}

/**
 * Record health check
 */
function recordHealthCheck(requestParams, response, context, ee, next) {
  const duration = response.timings.phases.total || 0
  
  ee.emit('histogram', 'custom.health_check.duration', duration)
  
  return next()
}

/**
 * Generate random test data
 */
function generateTestData(context, events, done) {
  context.vars.firstName = faker.person.firstName()
  context.vars.lastName = faker.person.lastName()
  context.vars.email = faker.internet.email()
  context.vars.companyName = faker.company.name()
  context.vars.phoneNumber = faker.phone.number()
  context.vars.customerNumber = `CUST${faker.string.numeric(6)}`
  
  return done()
}

module.exports = {
  recordMetric,
  recordBalanceQuery,
  recordPaymentDetailsLoad,
  recordSessionExtension,
  recordHealthCheck,
  generateTestData,
}
