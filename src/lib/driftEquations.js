/**
 * Drift Detection Equation Engine
 * Implements the actual mathematical formulas from the research:
 * MMD, K-S Test, PSI, SPC (X-bar/CUSUM), ADWIN
 */

// ─── MMD: Maximum Mean Discrepancy ─────────────────────────────────────────
// MMD²(P,Q) = E[k(x,x')] - 2E[k(x,y)] + E[k(y,y')]
// Using RBF kernel: k(x,y) = exp(-||x-y||² / 2σ²)

export function rbfKernel(x, y, sigma = 1.0) {
  const diff = x - y;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

export function computeMMD(samplesP, samplesQ, sigma = 1.0) {
  const n = samplesP.length;
  const m = samplesQ.length;

  let kPP = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      kPP += rbfKernel(samplesP[i], samplesP[j], sigma);
    }
  }
  kPP /= n * n;

  let kQQ = 0;
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < m; j++) {
      kQQ += rbfKernel(samplesQ[i], samplesQ[j], sigma);
    }
  }
  kQQ /= m * m;

  let kPQ = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < m; j++) {
      kPQ += rbfKernel(samplesP[i], samplesQ[j], sigma);
    }
  }
  kPQ = (2 / (n * m)) * kPQ;

  const mmd2 = kPP - kPQ + kQQ;
  return Math.max(0, mmd2);
}

// ─── K-S Test: Kolmogorov-Smirnov Statistic ────────────────────────────────
// D = sup_x |F1(x) - F2(x)|
// Critical value at α=0.05: 1.36 / sqrt(n) for equal sample sizes

export function computeKSStatistic(sample1, sample2) {
  const sorted1 = [...sample1].sort((a, b) => a - b);
  const sorted2 = [...sample2].sort((a, b) => a - b);
  const n1 = sorted1.length;
  const n2 = sorted2.length;

  const allValues = [...new Set([...sorted1, ...sorted2])].sort((a, b) => a - b);
  let maxDiff = 0;

  for (const val of allValues) {
    const cdf1 = sorted1.filter(x => x <= val).length / n1;
    const cdf2 = sorted2.filter(x => x <= val).length / n2;
    maxDiff = Math.max(maxDiff, Math.abs(cdf1 - cdf2));
  }

  const criticalValue = 1.36 / Math.sqrt((n1 * n2) / (n1 + n2));
  const pValue = Math.exp(-2 * maxDiff * maxDiff * (n1 * n2) / (n1 + n2));
  const driftDetected = maxDiff > criticalValue;

  return { statistic: maxDiff, criticalValue, pValue, driftDetected };
}

// ─── PSI: Population Stability Index ───────────────────────────────────────
// PSI = Σ (actual% - expected%) × ln(actual% / expected%)
// PSI < 0.1 → stable | 0.1–0.2 → moderate shift | > 0.2 → major shift

export function computePSI(baselineDist, currentDist, numBins = 10) {
  const min = Math.min(...baselineDist, ...currentDist);
  const max = Math.max(...baselineDist, ...currentDist);
  const binWidth = (max - min) / numBins;

  const bins = Array.from({ length: numBins }, (_, i) => ({
    lower: min + i * binWidth,
    upper: min + (i + 1) * binWidth,
  }));

  let psi = 0;
  const contributions = [];

  for (const bin of bins) {
    const baseCount = baselineDist.filter(x => x >= bin.lower && x < bin.upper).length;
    const currCount = currentDist.filter(x => x >= bin.lower && x < bin.upper).length;

    const baselineRate = Math.max(baseCount / baselineDist.length, 1e-6);
    const currentRate = Math.max(currCount / currentDist.length, 1e-6);

    const contrib = (currentRate - baselineRate) * Math.log(currentRate / baselineRate);
    psi += contrib;
    contributions.push({
      bin: `${bin.lower.toFixed(1)}-${bin.upper.toFixed(1)}`,
      baseline: (baselineRate * 100).toFixed(1),
      current: (currentRate * 100).toFixed(1),
      contribution: contrib,
    });
  }

  const severity = psi < 0.1 ? 'stable' : psi < 0.2 ? 'moderate' : 'severe';
  return { psi, severity, contributions };
}

// ─── SPC: Statistical Process Control (X-bar chart) ────────────────────────
// Control limits: UCL = μ + 3σ, LCL = μ - 3σ
// CUSUM: C+ = max(0, C+_prev + (x - μ - k)), C- = max(0, C-_prev + (μ - k - x))
// where k = 0.5σ (allowance), h = 5σ (decision interval)

export function computeSPCLimits(baseline) {
  const n = baseline.length;
  const mean = baseline.reduce((a, b) => a + b, 0) / n;
  const variance = baseline.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return {
    mean,
    std,
    ucl: mean + 3 * std,
    lcl: mean - 3 * std,
    ucl2: mean + 2 * std,
    lcl2: mean - 2 * std,
  };
}

export function computeCUSUM(stream, mean, std, k = 0.5, h = 5) {
  const allowance = k * std;
  const decisionInterval = h * std;
  let cPlus = 0;
  let cMinus = 0;
  const results = [];

  for (const x of stream) {
    cPlus = Math.max(0, cPlus + (x - mean - allowance));
    cMinus = Math.max(0, cMinus + (mean - allowance - x));
    const alarm = cPlus > decisionInterval || cMinus > decisionInterval;
    results.push({ x, cPlus, cMinus, alarm, decisionInterval });
  }

  return results;
}

// ─── ADWIN: Adaptive Windowing ──────────────────────────────────────────────
// Maintains a sliding window W; splits into W0 and W1.
// Drift detected when |μ(W0) - μ(W1)| ≥ ε_cut
// ε_cut = sqrt((1/|W0| + 1/|W1|) * ln(4|W|/δ) / 2)

export function computeADWIN(stream, delta = 0.002) {
  const window = [];
  const results = [];
  let driftPoints = [];

  for (let i = 0; i < stream.length; i++) {
    window.push(stream[i]);
    const W = window.length;
    let driftDetected = false;

    for (let n0 = Math.floor(W / 2); n0 < W - 1; n0++) {
      const n1 = W - n0;
      const mean0 = window.slice(0, n0).reduce((a, b) => a + b, 0) / n0;
      const mean1 = window.slice(n0).reduce((a, b) => a + b, 0) / n1;
      const epsCut = Math.sqrt(((1 / n0 + 1 / n1) * Math.log(4 * W / delta)) / 2);

      if (Math.abs(mean0 - mean1) >= epsCut) {
        driftDetected = true;
        driftPoints.push(i);
        window.splice(0, n0);
        break;
      }
    }

    const windowMean = window.reduce((a, b) => a + b, 0) / window.length;
    results.push({
      index: i,
      value: stream[i],
      windowMean,
      windowSize: window.length,
      driftDetected,
    });
  }

  return { results, driftPoints };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function generateNormalSamples(mean, std, n) {
  const samples = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    samples.push(mean + std * z);
  }
  return samples;
}

export function interpretPSI(psi) {
  if (psi < 0.1) return { level: 'Stable', color: 'text-accent', description: 'No significant shift detected' };
  if (psi < 0.2) return { level: 'Moderate Shift', color: 'text-amber-400', description: 'Some change — monitor closely' };
  return { level: 'Major Shift', color: 'text-destructive', description: 'Significant population change — recalibrate model' };
}

export function interpretMMD(mmd2, threshold = 0.05) {
  if (mmd2 < threshold * 0.5) return { level: 'No Drift', color: 'text-accent' };
  if (mmd2 < threshold) return { level: 'Borderline', color: 'text-amber-400' };
  return { level: 'Drift Detected', color: 'text-destructive' };
}