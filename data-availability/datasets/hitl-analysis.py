#!/usr/bin/env python3
"""
HITL Workflow Telemetry Analysis
Research Paper: "Modernization of Enterprise Payment Infrastructure:
A Case Study on LLM-Assisted Migration of Legacy Distributed Systems"

Reproduces the HITL telemetry summary reported in the Methods/Discussion
section and the appendix table, from the raw module-level observation log.

Column definitions (hitl-telemetry-log.csv):
  module_id                 : Unique module identifier (M01–M12)
  module_name               : Descriptive component name
  component_type            : Architectural layer of the component
  prompt_cycles             : Total LLM prompt iterations for this module
                              (includes initial prompt + all correction prompts)
  prompts_accepted          : Prompt outputs approved by human reviewer
                              on first review without further revision
  rollback_count            : Number of prompt outputs sent back for revision
                              (rollback_count = prompt_cycles − prompts_accepted)
  avg_correction_iterations : For rolled-back outputs, average number of
                              additional prompt cycles needed to reach acceptance
                              (0.0 if rollback_count == 0)
  validation_time_min       : Total human validation time in minutes per module
                              (includes security review + PCI-DSS compliance check)
  notes                     : Free-text rationale for rollback decisions

Derived summary statistics (Section: Methods / Appendix Table):
  - Prompt cycles per module : median and IQR of prompt_cycles
  - Acceptance ratio         : sum(prompts_accepted) / sum(prompt_cycles)
  - Rollback ratio           : 1 - acceptance ratio
  - Rollback depth           : weighted average of avg_correction_iterations,
                               weighted by rollback_count per module
  - Human validation time    : mean and IQR of validation_time_min

Usage:
    python3 hitl-analysis.py
"""

import pandas as pd
import numpy as np

CSV_PATH = "hitl-telemetry-log.csv"

df = pd.read_csv(CSV_PATH)

print("=" * 60)
print("HITL Workflow Telemetry — Module-Level Summary")
print("=" * 60)
print(f"\nN modules: {len(df)}")
print(f"\n{'Module':<35} {'Cycles':>6} {'Accepted':>8} "
      f"{'Rollbacks':>9} {'Corr.Depth':>10} {'Val.Time':>8}")
print("-" * 80)
for _, row in df.iterrows():
    print(f"{row['module_name']:<35} {row['prompt_cycles']:>6} "
          f"{row['prompts_accepted']:>8} {row['rollback_count']:>9} "
          f"{row['avg_correction_iterations']:>10.1f} "
          f"{row['validation_time_min']:>7}m")

# ── Prompt Cycles ─────────────────────────────────────────────────────────────
cycles = df["prompt_cycles"]
median_cycles = cycles.median()
q1_cycles = cycles.quantile(0.25)
q3_cycles = cycles.quantile(0.75)

print(f"\n── Prompt Cycles per Module ──")
print(f"  Median : {median_cycles}")
print(f"  Q1     : {q1_cycles}")
print(f"  Q3     : {q3_cycles}")
print(f"  IQR    : {q1_cycles} – {q3_cycles}")

# ── Acceptance & Rollback Ratio ───────────────────────────────────────────────
total_cycles    = df["prompt_cycles"].sum()
total_accepted  = df["prompts_accepted"].sum()
total_rollbacks = df["rollback_count"].sum()

acceptance_ratio = total_accepted / total_cycles
rollback_ratio   = total_rollbacks / total_cycles

print(f"\n── Acceptance / Rollback Ratio ──")
print(f"  Total prompt cycles  : {total_cycles}")
print(f"  Total accepted       : {total_accepted}")
print(f"  Total rolled back    : {total_rollbacks}")
print(f"  Acceptance ratio     : {acceptance_ratio*100:.1f}%")
print(f"  Rollback ratio       : {rollback_ratio*100:.1f}%")

# ── Rollback Depth ────────────────────────────────────────────────────────────
# Weighted average: weight each module's avg_correction_iterations
# by that module's rollback_count (so modules with more rollbacks count more)
modules_with_rollbacks = df[df["rollback_count"] > 0]
if len(modules_with_rollbacks) > 0:
    weighted_depth = np.average(
        modules_with_rollbacks["avg_correction_iterations"],
        weights=modules_with_rollbacks["rollback_count"]
    )
else:
    weighted_depth = 0.0

print(f"\n── Rollback Depth ──")
print(f"  Modules with at least one rollback : {len(modules_with_rollbacks)}")
print(f"  Avg correction iterations (weighted): {weighted_depth:.2f}")

# ── Human Validation Time ─────────────────────────────────────────────────────
vtime = df["validation_time_min"]
mean_vtime = vtime.mean()
q1_vtime   = vtime.quantile(0.25)
q3_vtime   = vtime.quantile(0.75)

print(f"\n── Human Validation Time ──")
print(f"  Mean : {mean_vtime:.1f} min")
print(f"  Q1   : {q1_vtime} min")
print(f"  Q3   : {q3_vtime} min")
print(f"  IQR  : {q1_vtime} – {q3_vtime} min")

# ── Appendix Table Summary ────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("APPENDIX TABLE — HITL Workflow Telemetry")
print("=" * 60)
print(f"  {'Metric':<40} {'Value'}")
print(f"  {'-'*55}")
print(f"  {'Prompt Cycles per Module (Median / IQR)':<40} "
      f"{median_cycles:.0f} (IQR: {q1_cycles:.2g} – {q3_cycles:.2g})")
print(f"  {'Acceptance Ratio':<40} {acceptance_ratio*100:.1f}%")
print(f"  {'Rollback Ratio':<40} {rollback_ratio*100:.1f}%")
print(f"  {'Rollback Depth (avg correction iterations)':<40} "
      f"{weighted_depth:.1f} iterations")
print(f"  {'Human Validation Time (Mean / IQR)':<40} "
      f"{mean_vtime:.0f} min (IQR: {q1_vtime:.0f} – {q3_vtime:.0f})")
print(f"  {'Sample Size':<40} N = {len(df)} modules")
print("=" * 60)
