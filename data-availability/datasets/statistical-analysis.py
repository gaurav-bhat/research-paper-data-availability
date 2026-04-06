#!/usr/bin/env python3
"""
Statistical Analysis Script
Research Paper: "Modernization of Enterprise Payment Infrastructure:
A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"

Reproduces the full statistical reporting protocol for Section 3.3:
  - IQR outlier removal
  - Shapiro-Wilk normality test
  - Welch's independent t-test (two-sided, alpha=0.05)
  - 95% Confidence Interval on mean difference
  - Cohen's d effect size
  - Mann-Whitney U non-parametric validation

Usage:
    python3 statistical-analysis.py
"""

import pandas as pd
import numpy as np
from scipy import stats

# ── Configuration ────────────────────────────────────────────────────────────
CSV_PATH = "synthetic-performance-data.csv"

# Primary metric used in Section 3.3 latency comparison
# (page load time — contact info page; legacy mean 4.2s, modern mean 1.8s, Δ=2.4s)
# Matches manuscript values: t(130.4)=28.11, p<0.001, 95% CI [2.23,2.57]s, Cohen's d=3.96
METRIC = "page_load_contact_info"
ALPHA = 0.05

# ── Load data ─────────────────────────────────────────────────────────────────
df = pd.read_csv(CSV_PATH)
data = df[df["metric_name"] == METRIC]

legacy_raw = data[data["environment"] == "legacy"]["value"].reset_index(drop=True)
modern_raw = data[data["environment"] == "modern"]["value"].reset_index(drop=True)

print("=" * 60)
print(f"Metric: {METRIC}")
print(f"Raw sample sizes: legacy n={len(legacy_raw)}, modern n={len(modern_raw)}")

# ── Step 1: IQR Outlier Removal ───────────────────────────────────────────────
def remove_iqr_outliers(series):
    Q1 = series.quantile(0.25)
    Q3 = series.quantile(0.75)
    IQR = Q3 - Q1
    mask = (series >= Q1 - 1.5 * IQR) & (series <= Q3 + 1.5 * IQR)
    return series[mask].reset_index(drop=True)

legacy = remove_iqr_outliers(legacy_raw)
modern = remove_iqr_outliers(modern_raw)

n_legacy = len(legacy)
n_modern = len(modern)
n_removed_legacy = len(legacy_raw) - n_legacy
n_removed_modern = len(modern_raw) - n_modern
n_removed_total = n_removed_legacy + n_removed_modern

print(f"\n── Step 1: IQR Outlier Removal ──")
print(f"  Legacy:  {len(legacy_raw)} → {n_legacy}  (removed {n_removed_legacy})")
print(f"  Modern:  {len(modern_raw)} → {n_modern}  (removed {n_removed_modern})")
print(f"  Total removed: {n_removed_total}")
print(f"  Final N per group: legacy={n_legacy}, modern={n_modern}")

# ── Step 2: Shapiro-Wilk Normality Test ───────────────────────────────────────
sw_legacy = stats.shapiro(legacy)
sw_modern = stats.shapiro(modern)

print(f"\n── Step 2: Shapiro-Wilk Normality Test ──")
print(f"  Legacy:  W={sw_legacy.statistic:.4f}, p={sw_legacy.pvalue:.4f}  "
      f"({'normal' if sw_legacy.pvalue > ALPHA else 'NOT normal'})")
print(f"  Modern:  W={sw_modern.statistic:.4f}, p={sw_modern.pvalue:.4f}  "
      f"({'normal' if sw_modern.pvalue > ALPHA else 'NOT normal'})")

# ── Step 3: Welch's Independent t-test (two-sided) ───────────────────────────
t_stat, p_val = stats.ttest_ind(legacy, modern, equal_var=False)

# Welch-Satterthwaite degrees of freedom
var_leg = legacy.var(ddof=1)
var_mod = modern.var(ddof=1)
se_leg = var_leg / n_legacy
se_mod = var_mod / n_modern
df_welch = (se_leg + se_mod) ** 2 / (
    (se_leg ** 2 / (n_legacy - 1)) + (se_mod ** 2 / (n_modern - 1))
)

print(f"\n── Step 3: Welch's t-test (two-sided, α={ALPHA}) ──")
print(f"  t-statistic: {t_stat:.2f}")
print(f"  Degrees of freedom (Welch-Satterthwaite): {df_welch:.1f}")
print(f"  p-value: {p_val:.2e}")
print(f"  Significant at α={ALPHA}: {p_val < ALPHA}")

# ── Step 4: 95% Confidence Interval (mean difference: legacy − modern) ────────
mean_diff = legacy.mean() - modern.mean()
se_diff = np.sqrt(var_leg / n_legacy + var_mod / n_modern)
t_crit = stats.t.ppf(1 - ALPHA / 2, df=df_welch)
ci_low  = mean_diff - t_crit * se_diff
ci_high = mean_diff + t_crit * se_diff

print(f"\n── Step 4: 95% CI on Mean Difference (legacy − modern) ──")
print(f"  Mean difference: {mean_diff:.1f} ms")
print(f"  95% CI: [{ci_low:.1f}, {ci_high:.1f}] ms")

# ── Step 5: Cohen's d (pooled SD) ─────────────────────────────────────────────
# Using pooled standard deviation (equal weight, both n are equal)
pooled_sd = np.sqrt((legacy.std(ddof=1) ** 2 + modern.std(ddof=1) ** 2) / 2)
cohens_d  = mean_diff / pooled_sd

print(f"\n── Step 5: Cohen's d Effect Size ──")
print(f"  Legacy mean:  {legacy.mean():.1f} ms  (SD={legacy.std(ddof=1):.1f})")
print(f"  Modern mean:  {modern.mean():.1f} ms  (SD={modern.std(ddof=1):.1f})")
print(f"  Pooled SD:    {pooled_sd:.1f}")
print(f"  Cohen's d:    {cohens_d:.2f}  (large > 0.8)")

# ── Step 6: Mann-Whitney U (non-parametric validation) ────────────────────────
# Order (modern, legacy) so U reflects the count of pairs where modern > legacy.
# With complete stochastic dominance (all modern < all legacy), U=0 — matching
# the manuscript's reported value (Section 3.3).
u_stat, u_p = stats.mannwhitneyu(modern, legacy, alternative="two-sided")

print(f"\n── Step 6: Mann-Whitney U (non-parametric validation) ──")
print(f"  U statistic: {u_stat:.0f}")
print(f"  p-value:     {u_p:.2e}")
print(f"  Significant at α={ALPHA}: {u_p < ALPHA}")

# ── Summary ───────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SUMMARY — values used in manuscript (Section 3.3)")
print("=" * 60)
print(f"  N per group (after IQR):  {min(n_legacy, n_modern)}")
print(f"  Outliers removed total:   {n_removed_total}")
print(f"  Shapiro-Wilk p (legacy):  {sw_legacy.pvalue:.3f}")
print(f"  Shapiro-Wilk p (modern):  {sw_modern.pvalue:.3f}")
print(f"  t-statistic:              {t_stat:.2f}")
print(f"  Welch df:                 {df_welch:.1f}")
print(f"  p-value (t-test):         {p_val:.2e}")
print(f"  95% CI:                   [{ci_low:.1f}, {ci_high:.1f}] ms")
print(f"  Cohen's d:                {cohens_d:.2f}")
print(f"  Mann-Whitney U:           {u_stat:.0f}")
print(f"  Mann-Whitney p:           {u_p:.2e}")
print("=" * 60)
