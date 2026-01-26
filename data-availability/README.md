# Research Paper Data Availability Package - Index

**Research Paper:** "Modernization of Enterprise Payment Infrastructure: A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"  
**Package Version:** 1.0.0

---

## 📊 Dataset Specifications

**File:** `datasets/synthetic-performance-data.csv`

**Structure:**
- **Rows:** 1,801 (1 header + 1,800 measurements)
- **Columns:** 6 (timestamp, metric_name, value, environment, test_run, sample_id)
- **Metrics:** 18 different performance metrics
- **Measurements per metric:** 100 (50 legacy + 50 modern)
- **Time span:** 30 days (December 1, 2025 - January 24, 2026)
- **Format:** Standard CSV with ISO 8601 timestamps

**Statistical Properties Match Research Paper:**
- Page load times: Legacy 4.2s (σ=0.8s) → Modern 1.8s (σ=0.3s)
- Payment completion: Legacy 6.5s (σ=1.2s) → Modern 3.2s (σ=0.58s)
- Balance queries: Legacy 2.3s (σ=0.45s) → Modern 0.18s (σ=0.045s)

**Data Generation Method:**
- Box-Muller transform for normal distribution
- Bounded to realistic min/max values from production
- No PII or business-sensitive information
- Reproducible with provided generator script

---

## 🔬 Validation Checklist for Reviewers

### Methodology Verification

- [ ] **Test Setup**: Google Cloud Run, JMeter 5.5 (Section 3.3)
- [ ] **Workload**: 50 concurrent users, realistic payment workflows (Section 3.3)
- [ ] **Metrics**: All metrics defined in 'Table 2' with measurement methods
- [ ] **Sample Size**: 100 measurements per metric (n=100)
- [ ] **Statistical Tests**: T-tests reported with p-values < 0.001

### Data Availability Verification

- [ ] **Config Templates**: 3 files provided with security notes
- [ ] **Test Scripts**: 3 files (Artillery.yml + Node.js standalone + processor)
- [ ] **Synthetic Dataset**: CSV with 1,800 measurements matching statistics
- [ ] **Documentation**: 5 README files explaining all materials
- [ ] **Reproducibility**: Generator script provided to recreate dataset

### Metrics Operationalization

- [ ] **Runtime Anomalies**: Defined with thresholds (Appendix A)
  - Memory leaks: >500MB growth over 24h
  - Connection pool exhaustion: >5s wait time
  - Cache inconsistencies: Validation query mismatches
  
- [ ] **Environment Leakage**: Defined with examples (Appendix A)
  - Production using staging endpoints
  - Debug logs in production
  - Wrong database connections
  
- [ ] **Lifecycle Compression**: Defined with measurements (Appendix A)
  - Legacy: 6 weeks (feature → production)
  - Modern: 3 weeks (feature → production)
  - Components tracked: Design, Development, Testing, Deployment

---

## 🚀 Quick Start for Reviewers

### Option 1: Validate Dataset (Python)

```bash
# Requires: Python 3.8+, pandas, scipy
pip install pandas scipy matplotlib

# Download and analyze
cd datasets
python3 << 'EOF'
import pandas as pd
from scipy import stats

df = pd.read_csv('synthetic-performance-data.csv')

# Verify improvement claim
metric = df[df['metric_name'] == 'page_load_contact_info']
legacy_mean = metric[metric['environment'] == 'legacy']['value'].mean()
modern_mean = metric[metric['environment'] == 'modern']['value'].mean()
improvement = ((legacy_mean - modern_mean) / legacy_mean) * 100

print(f"Page Load Improvement: {improvement:.1f}%")
print(f"Research Paper Claims: 57%")
print(f"Match: {'✓' if 55 < improvement < 59 else '✗'}")

# Statistical significance
t_stat, p_value = stats.ttest_ind(
    metric[metric['environment'] == 'legacy']['value'],
    metric[metric['environment'] == 'modern']['value']
)
print(f"\nStatistical Significance: p={p_value:.6f}")
print(f"Highly Significant: {'✓' if p_value < 0.001 else '✗'}")
EOF
```

### Option 2: Review Configuration (No installation needed)

```bash
# View environment template
cat config-templates/env.example | head -50

# Check security annotations
grep -n "PLACEHOLDER\|SECRET\|PASSWORD" config-templates/env.example

# Review session security
grep -n "httpOnly\|secure\|sameSite" config-templates/session.config.ts
```

### Option 3: Inspect Test Scenarios (No installation needed)

```bash
# View test configuration
cat test-scenarios/payment-workflow.artillery.yml | head -50

# Check performance targets
grep -n "maxErrorRate\|p95\|p99" test-scenarios/payment-workflow.artillery.yml
```

---

## 📧 Information

**For Reviewers/Editors:**
- Questions about methodology: See `datasets/README.md`
- Data access issues: Check `README.md` → Data Availability section
- Technical questions: Each subdirectory has detailed README

**For Researchers:**
- Dataset requests: Contact Author
- Replication support: Contact Author
- Citation format: See `README.md` → Citation section

---

## ✅ Compliance Checklist

This package addresses journal requirements:

### Evaluation Methodology (Required)
✅ Test setup documented (GCP Cloud Run, 2Gi RAM, 1 CPU)  
✅ Workload specified (50 concurrent users, 30-min duration)  
✅ Metrics defined (18 metrics with measurement methods)  
✅ Sample size stated (n=100 per metric)  
✅ Number of runs documented (100 measurements over 30 days)  
✅ Statistical approach explained (t-tests, 95% CI, 2σ outlier handling)

### Data Availability (Required)
✅ Public materials listed (configs, scripts, synthetic data)  
✅ Restricted data explained (production metrics, source code, infrastructure)  
✅ Synthetic examples provided (1,800 measurements)  
✅ Configurations included (sanitized, documented)  
✅ Replication materials available (test scripts, data generator)  
✅ Access method specified (repository download, on request)

### Metrics Operationalization (Required)
✅ Runtime anomalies defined (with thresholds and detection methods)  
✅ Environment leakage explained (with examples and prevention)  
✅ Lifecycle compression measured (with time component breakdown)  
✅ All metrics include measurement methodology  
✅ Typical ranges provided for context

---

## 🔍 Verification Results

**Expected Outputs from Validation:**

| Test | Expected Result | Verification Method |
|------|----------------|---------------------|
| Page Load Improvement | ~57% | Python pandas calculation |
| Statistical Significance | p < 0.001 | Scipy t-test |
| Dataset Row Count | 1,801 rows | `wc -l` command |
| File Count | 14 files | `find . -type f` |
| Package Size | ~232 KB | `du -sh .` |

**All verifications should pass within ±5% tolerance for statistical values.**

---

## 📚 Related Research Paper Sections

**Methodology Description:**
- Research Paper Section 3.3: Evaluation Methodology
- Research Paper Appendix A: Metrics and Terminology
- Data Availability Statement

**Implementation Details:**
- Architecture Decisions → `config-templates/`
- Payment Flow → `test-scenarios/`
- Production Deployment → `config-templates/cloud-run.yaml`
- Section 3: Results → `datasets/synthetic-performance-data.csv`

---

