# Performance Testing Scripts

This directory contains load testing scripts that replicate the evaluation methodology described in Chapter 6 of the Research Paper.

## 📋 Files

### `payment-workflow.artillery.yml`
Artillery.io configuration for comprehensive payment workflow testing.

**Test Coverage:**
- Complete payment workflow (happy path)
- Session extension scenarios
- Customer balance queries
- Support agent impersonation
- Error recovery and validation

**Load Profile:**
- Virtual users: 5-50 concurrent (ramped)
- Total duration: 30 minutes
- Request timeout: 30 seconds
- Performance targets: p95 < 2s, p99 < 3s

### `payment-workflow-test.js`
Standalone Node.js script for performance testing without Artillery.

**Features:**
- Self-contained test scenarios
- Automatic metric collection
- Statistical analysis
- CSV export capability

### `payment-processor.js`
Custom Artillery processor for enhanced metrics.

**Capabilities:**
- Records detailed performance data
- Validates against performance targets
- Emits custom events for analysis
- Generates test data with faker.js

## 🚀 Quick Start

### Option 1: Artillery.io (Recommended for Load Testing)

**Installation:**
```bash
npm install -g artillery
npm install @faker-js/faker  # Required for payment-processor.js
```

**Basic Usage:**
```bash
# Run test against staging
artillery run payment-workflow.artillery.yml

# Run with custom target
artillery run payment-workflow.artillery.yml \
  --target https://your-test-env.example.com

# Generate detailed report
artillery run payment-workflow.artillery.yml \
  --output results.json
artillery report results.json --output report.html
open report.html
```

**Advanced Usage:**
```bash
# Override configuration
artillery run payment-workflow.artillery.yml \
  --config config.phases[0].duration=600 \
  --config config.phases[0].arrivalRate=100

# Run specific scenario only
artillery run payment-workflow.artillery.yml \
  --scenario-name "Complete Payment Workflow"

# Set custom environment variables
TEST_BASE_URL=https://custom.example.com \
artillery run payment-workflow.artillery.yml
```

### Option 2: Standalone Node.js Script

**Installation:**
```bash
npm install axios @faker-js/faker
```

**Usage:**
```bash
# Run test with default settings
node payment-workflow-test.js

# Set custom target
TEST_BASE_URL=https://your-env.example.com \
node payment-workflow-test.js

# Export metrics to file
node payment-workflow-test.js 2> metrics.json
```

**Customizing Test Parameters:**
```javascript
// Edit testConfig in payment-workflow-test.js
const testConfig = {
  baseUrl: 'https://your-env.example.com',
  virtualUsers: 100,     // Increase concurrent users
  duration: 3600,        // Run for 1 hour
  // ...
}
```

## 📊 Understanding Test Results

### Artillery Output Interpretation

```
Summary report @ 14:23:45(-0500)
  Scenarios launched:  1000
  Scenarios completed: 985
  Requests completed:  8850
  Mean response/sec:   49.2
  Response time (msec):
    min: 145
    max: 3420
    median: 1850
    p95: 2680
    p99: 3120
```

**Key Metrics:**
- **Scenarios completed/launched**: Success rate (target: >95%)
- **Mean response/sec**: Throughput
- **p95/p99**: Performance consistency (Research Paper targets: p95 < 2s)

### Standalone Script Output

```json
{
  "page_load_contact_info": {
    "count": 10,
    "mean": 1823,
    "median": 1798,
    "min": 1456,
    "max": 2234,
    "p95": 2156,
    "p99": 2234
  }
}
```

## 🎯 Test Scenarios Explained

### Scenario 1: Complete Payment Workflow (70% weight)

**Research Paper Reference:** "Payment completion time: 6.5s to 3.2s" (Chapter 6)

**Steps:**
1. Load contact information page
2. Submit customer details
3. Load payment information page
4. Check customer balance (async)
5. Select invoices and submit
6. Load payment details with processor iframe
7. Simulate payment processing
8. Load confirmation page

**Performance Target:** < 3.2 seconds total

### Scenario 2: Session Extension (10% weight)

**Research Paper Reference:** "Session timeout issues reduced by 89%" (Chapter 6)

**Steps:**
1. Create session by loading page
2. Simulate 25 minutes of user inactivity
3. Request session extension
4. Verify session still valid

**Performance Target:** < 500ms extension response

### Scenario 3: Customer Balance Query (Measured separately)

**Research Paper Reference:** "Eliminating 2.3s blocking time" (Chapter 6)

**Comparison:**
- Legacy: Synchronous query blocking page render (2.3s)
- Modern: Asynchronous query after page load (180ms)

### Scenario 4: Support Agent Impersonation (5% weight)

**Research Paper Reference:** "Customer impersonation feature" (Chapter 3)

**Steps:**
1. Enable impersonation mode
2. Enter customer information
3. Process payment on behalf of customer

**Performance Target:** No degradation vs. normal workflow

### Scenario 5: Error Handling (10% weight)

**Research Paper Reference:** "Production errors decreased 67%" (Chapter 6)

**Test Cases:**
- Invalid form input (validation errors)
- Session timeout scenarios
- Invalid customer number lookups
- Network timeout simulation

**Success Criteria:** Graceful error handling, no 500 errors

## 📈 Performance Targets (from Research Paper)

| Metric | Legacy Baseline | Modern Target | Improvement |
|--------|----------------|---------------|-------------|
| Page Load Time | 4.2s | 1.8s | 57% |
| Payment Completion | 6.5s | 3.2s | 51% |
| Balance Query | 2.3s | 0.18s | 92% |
| Session Extension | N/A | <0.5s | New feature |
| Error Rate | 342/week | 113/week | 67% |

## 🔧 Customization Guide

### Adjusting Load Patterns

Edit `payment-workflow.artillery.yml`:

```yaml
config:
  phases:
    # Higher load
    - duration: 600
      arrivalRate: 100  # Changed from 50
      
    # Spike testing
    - duration: 60
      arrivalRate: 200
      name: "Spike test"
```

### Adding Custom Scenarios

```yaml
scenarios:
  - name: "Your Custom Scenario"
    weight: 5  # 5% of traffic
    flow:
      - get:
          url: "/your-endpoint"
          expect:
            - statusCode: 200
      - think: 2
      - post:
          url: "/your-submit"
          json:
            field: "value"
```

### Custom Metrics

Add to `payment-processor.js`:

```javascript
function recordCustomMetric(requestParams, response, context, ee, next) {
  const duration = response.timings.phases.total
  ee.emit('histogram', 'custom.your_metric.duration', duration)
  return next()
}

module.exports = {
  recordCustomMetric,
  // ... existing exports
}
```

## 📊 Analyzing Results

### Generate HTML Report

```bash
artillery run payment-workflow.artillery.yml --output results.json
artillery report results.json --output report.html
open report.html
```

### Export to CSV

```bash
# Using jq to convert JSON to CSV
cat results.json | jq -r '
  .aggregate.latency | 
  ["min","max","median","p95","p99"] as $headers |
  ([$headers] + [.min,.max,.median,.p95,.p99]) |
  @csv
' > latency-results.csv
```

### Compare with Research Paper Benchmarks

```python
import json
import pandas as pd

# Load your test results
with open('results.json') as f:
    data = json.load(f)

# Compare with Research Paper targets
targets = {
    'p95': 2000,  # 2 seconds
    'p99': 3000,  # 3 seconds
}

actual = data['aggregate']['latency']

for metric, target in targets.items():
    actual_value = actual[metric]
    status = '✓' if actual_value < target else '✗'
    print(f"{status} {metric}: {actual_value}ms (target: {target}ms)")
```

## 🐛 Troubleshooting

### "Connection refused" errors

```bash
# Verify target is accessible
curl -I https://your-target.example.com/api/health

# Check network connectivity
ping your-target.example.com

# Verify TLS/SSL certificate
openssl s_client -connect your-target.example.com:443
```

### "CSRF token" errors

The test scripts expect CSRF tokens in responses. Update your app to include:

```html
<meta name="csrf-token" content="{{ csrfToken }}">
```

Or disable CSRF for test endpoints (NOT recommended for production).

### High error rates

```bash
# Increase timeout
artillery run payment-workflow.artillery.yml \
  --config config.http.timeout=60

# Reduce concurrent load
artillery run payment-workflow.artillery.yml \
  --config config.phases[0].arrivalRate=10
```

## 📚 Additional Resources

- **Artillery.io Documentation**: https://artillery.io/docs
- **Research Paper Chapter 6**: Evaluation Methodology
- **Load Testing Best Practices**: See ../README.md

## ⚖️ License

MIT License - Use freely with attribution

---

**Last Updated**: January 25, 2026
