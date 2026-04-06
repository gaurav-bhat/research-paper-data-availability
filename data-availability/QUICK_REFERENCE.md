# Quick Reference Guide

Complete data availability package for the Research Paper **"Modernization of Enterprise Payment Infrastructure: A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"**.

## 📦 Package Contents

```
data-availability/
├── README.md                                   # Data Availability Package - Index
├── QUICK_REFERENCE.md                          # This file
├── config-templates/                           # Configuration examples
│   ├── README.md                               # Config documentation
│   ├── env.example                             # Environment variables (60+ settings)
│   ├── session.config.ts                       # TypeScript session config
│   └── cloud-run.yaml                          # GCP deployment manifest
├── test-scenarios/                             # Performance testing
│   ├── README.md                               # Testing documentation
│   ├── payment-workflow.artillery.yml          # Artillery.io config
│   ├── payment-workflow-test.js                # Standalone test script
│   └── payment-processor.js                    # Custom Artillery processor
└── datasets/                                   # Synthetic data
    ├── README.md                               # Dataset documentation
    ├── generate-synthetic-data.js              # Data generator
    ├── synthetic-performance-data.csv          # Main dataset (1,800+ rows)
    ├── generation-stats.log                    # Statistical validation log
    ├── statistical-analysis.py                 # Full Section 3.3 statistical protocol
    ├── statistical-analysis-results.log        # Computed statistics output
    ├── hitl-telemetry-log.csv                  # HITL workflow observations (N=12 modules)
    ├── hitl-analysis.py                        # HITL summary stats (Methods/Appendix)
    └── hitl-analysis-results.log               # Pre-computed HITL telemetry output
```

## ⚡ Quick Start Commands

### Configuration Setup
```bash
# Copy environment template
cp config-templates/env.example .env

# Generate session encryption key
openssl rand -hex 32

# Deploy to Cloud Run
gcloud run services replace config-templates/cloud-run.yaml --region=us-central1
```

### Performance Testing
```bash
# Install Artillery
npm install -g artillery

# Run load test
cd test-scenarios
artillery run payment-workflow.artillery.yml --output results.json

# Generate HTML report
artillery report results.json --output report.html
```

### Dataset Analysis
```bash
# View first rows
head -20 datasets/synthetic-performance-data.csv

# Regenerate data
cd datasets
node generate-synthetic-data.js > synthetic-performance-data.csv
```

## 📊 Key Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Page Load Time** | 4.2s (σ=0.8s) | 1.8s (σ=0.3s) | **57%** ↓ |
| **Payment Completion** | 6.5s | 3.2s | **51%** ↓ |
| **Balance Query** | 2.3s (blocking) | 0.18s (async) | **92%** ↓ |
| **Runtime Anomaly Rate** | 0.21 per 10k requests | 0.07 per 10k requests | **67%** ↓ (Normalized) |
| **Deployment Time** | 4 hours | 12 minutes | **95%** ↓ |

## 🎯 Use Cases by Role

### Researchers / Academics
- **Validate methodology**: Use synthetic dataset to verify statistical claims
- **Reproduce analysis**: Run same calculations on provided data
- **Compare approaches**: Benchmark your migration against these results

**Start here:** `datasets/README.md` → Statistical validation section

### DevOps Engineers
- **Cloud deployment**: Use Cloud Run configuration as template
- **Secret management**: Follow GCP Secret Manager integration pattern
- **DR strategy**: Implement multi-region deployment

**Start here:** `config-templates/cloud-run.yaml`

### Performance Engineers
- **Load testing**: Run Artillery scripts against your environment
- **Metric collection**: Use custom processor for detailed analytics
- **Benchmark comparison**: Compare your results against dataset

**Start here:** `test-scenarios/payment-workflow.artillery.yml`

### Software Architects
- **Configuration patterns**: Learn environment management approach
- **Session strategy**: Understand stateless session design
- **Security practices**: Review security configurations

**Start here:** `config-templates/session.config.ts`

## 🔬 Validation Recipes

### Verify Page Load Improvement (57%)
```python
import pandas as pd
df = pd.read_csv('datasets/synthetic-performance-data.csv')
metric = df[df['metric_name'] == 'page_load_contact_info']
legacy = metric[metric['environment'] == 'legacy']['value'].mean()
modern = metric[metric['environment'] == 'modern']['value'].mean()
improvement = ((legacy - modern) / legacy) * 100
print(f"Page load improvement: {improvement:.1f}%")  # Expected: ~57%
```

### Run Full Statistical Analysis (Section 3.3)
```bash
# Runs IQR outlier removal, Shapiro-Wilk, Welch's t-test,
# 95% CI, Cohen's d, and Mann-Whitney U — all in one script
cd datasets
python3 statistical-analysis.py
# Output also saved to statistical-analysis-results.log
```

### Reproduce HITL Workflow Telemetry (Methods/Appendix)
```bash
cd datasets
python3 hitl-analysis.py
# Reproduces: prompt cycles median/IQR, acceptance ratio,
# rollback depth, and human validation time from N=12 modules
```

### Load Test Your Environment
```bash
# Edit target URL in artillery config
sed -i '' 's|pay-staging.example.com|your-env.example.com|' \
  test-scenarios/payment-workflow.artillery.yml

# Run test
artillery run test-scenarios/payment-workflow.artillery.yml

# Check if you meet Research Paper's targets (p95 < 2s)
```

## 📖 Research Paper Cross-References

### The Legacy Landscape
- **Relates to:** `config-templates/env.example` (legacy vs. modern config)
- **Data:** N/A (Section 2)

### Planning the Migration
- **Relates to:** `config-templates/session.config.ts`
- **Data:** Architecture decisions (documented in configs)

### Core Development
- **Relates to:** All test scenarios
- **Data:** Payment flow timing in `synthetic-performance-data.csv`

### Production Readiness
- **Relates to:** `config-templates/cloud-run.yaml`
- **Data:** Deployment metrics, error rates in dataset

### Results & Business Impact
- **Relates to:** All materials
- **Data:** `datasets/synthetic-performance-data.csv` (all performance metrics)

### Metrics and Terminology
- **Defines:** All metric names in synthetic dataset
- **Validates:** Operational definitions with data

### Data Availability Statement
- **Documents:** This entire repository
- **Specifies:** How to access and use materials

## 🔒 Security Checklist

Before using in production:

- [ ] Replace all `[PLACEHOLDER]` values in configs
- [ ] Generate new session encryption key
- [ ] Store secrets in Secret Manager (not in files)
- [ ] Test in staging environment first
- [ ] Review and adjust rate limits
- [ ] Update URLs to your domains
- [ ] Configure proper CORS origins
- [ ] Enable production logging level
- [ ] Set up monitoring alerts
- [ ] Document any customizations

## 🐛 Common Issues

### "Secret not found" in Cloud Run
**Solution:** Create secret first
```bash
echo -n "your-value" | gcloud secrets create secret-name --data-file=-
gcloud secrets add-iam-policy-binding secret-name \
  --member="serviceAccount:SA@PROJECT.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Artillery test fails with 401
**Solution:** Adjust authentication in test script
```yaml
# Add auth header in payment-workflow.artillery.yml
config:
  http:
    headers:
      Authorization: "Bearer YOUR_TEST_TOKEN"
```

### CSV import error in Python
**Solution:** Specify encoding
```python
df = pd.read_csv('synthetic-performance-data.csv', encoding='utf-8')
```

## 📞 Getting Help

**Documentation Issues:**
- Check README files in each directory
- Review Research Paper sections referenced

**Technical Questions:**
- Artillery: https://artillery.io/docs
- Cloud Run: https://cloud.google.com/run/docs
- TypeScript: https://www.typescriptlang.org/docs

**Data Issues:**
- Regenerate synthetic data: `node generate-synthetic-data.js`
- Validate statistics: Check `generation-stats.log`
- Report problems: Open repository issue

## 📋 Validation Checklist

Use this to verify you've obtained all materials:

- [ ] Main README.md with overview
- [ ] README.md containing Dataset Specifications
- [ ] Configuration templates (3 files)
  - [ ] env.example
  - [ ] session.config.ts
  - [ ] cloud-run.yaml
- [ ] Testing scripts (3 files)
  - [ ] payment-workflow.artillery.yml
  - [ ] payment-workflow-test.js
  - [ ] payment-processor.js
- [ ] Synthetic dataset (7 files)
  - [ ] synthetic-performance-data.csv (1,800+ rows)
  - [ ] generate-synthetic-data.js
  - [ ] generation-stats.log
  - [ ] statistical-analysis.py
  - [ ] statistical-analysis-results.log
  - [ ] hitl-telemetry-log.csv
  - [ ] hitl-analysis.py
  - [ ] hitl-analysis-results.log
- [ ] Documentation (5 README files)

**Expected file count:** 20 files total

## 📊 Expected Dataset Statistics

When you analyze the synthetic dataset, expect these approximate values:

```
Page Load (Contact Info):
  Legacy:  mean=4200ms, σ=800ms,  n=100
  Modern:  mean=1800ms, σ=300ms,  n=100
  t-test:  p < 0.001 (highly significant)

Payment Completion:
  Legacy:  mean=6500ms, σ=1200ms, n=100
  Modern:  mean=3200ms, σ=580ms,  n=100
  t-test:  p < 0.001 (highly significant)

Customer Balance Query:
  Legacy:  mean=2300ms, σ=450ms,  n=100
  Modern:  mean=180ms,  σ=45ms,   n=100
  t-test:  p < 0.001 (highly significant)
```

## 🎓 Learning Path

**Beginner (Just want to understand the results):**
1. Read main README.md
2. View synthetic-performance-data.csv in Excel/Google Sheets
3. Compare legacy vs. modern values visually
4. Read Research Paper to understand context

**Intermediate (Want to validate claims):**
1. Install Python with pandas, scipy
2. Run validation recipes (see above)
3. Generate comparison visualizations
4. Verify statistical significance

**Advanced (Want to replicate in your environment):**
1. Set up staging environment
2. Customize configuration templates
3. Run Artillery load tests
4. Compare your results to synthetic dataset
5. Document differences and similarities