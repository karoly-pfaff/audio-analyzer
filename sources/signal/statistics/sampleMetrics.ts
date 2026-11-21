import type { SignalSettings } from '../contracts/signalSettings.ts';
import type { SignalSampleMetrics } from '../contracts/signalSummary.ts';

interface SampleTotals {
  readonly peak: number;
  readonly squares: number;
  readonly sum: number;
  readonly clipped: number;
  readonly silent: number;
  readonly count: number;
}

function collectSampleTotals(samples: Float32Array, settings: SignalSettings): SampleTotals {
  const totals = { peak: 0, squares: 0, sum: 0, clipped: 0, silent: 0, count: samples.length };
  for (const sample of samples) {
    totals.peak = Math.max(totals.peak, Math.abs(sample));
    totals.squares += sample * sample;
    totals.sum += sample;
    totals.clipped += Number(Math.abs(sample) >= settings.clippingThreshold);
    totals.silent += Number(Math.abs(sample) < settings.silenceThreshold);
  }
  return totals;
}

function combineSampleTotals(left: SampleTotals, right: SampleTotals): SampleTotals {
  return {
    peak: Math.max(left.peak, right.peak),
    squares: left.squares + right.squares,
    sum: left.sum + right.sum,
    clipped: left.clipped + right.clipped,
    silent: left.silent + right.silent,
    count: left.count + right.count,
  };
}

function amplitudeToDb(amplitude: number): number | null {
  return amplitude > 0 ? 20 * Math.log10(amplitude) : null;
}

function classifyClippingRisk(ratio: number): SignalSampleMetrics['clippingRisk'] {
  if (ratio === 0) return 'none';
  if (ratio < 0.00001) return 'low';
  if (ratio < 0.0001) return 'medium';
  return 'high';
}

function summarizeSampleTotals(totals: SampleTotals): SignalSampleMetrics {
  const rmsAmplitude = Math.sqrt(totals.squares / totals.count);
  const peakDb = amplitudeToDb(totals.peak);
  const rmsDb = amplitudeToDb(rmsAmplitude);
  return {
    peakAmplitude: totals.peak,
    peakDb,
    rmsAmplitude,
    rmsDb,
    crestFactorDb: rmsAmplitude > 0 ? 20 * Math.log10(totals.peak / rmsAmplitude) : null,
    dcOffset: totals.sum / totals.count,
    clippedSampleCount: totals.clipped,
    clippedSampleRatio: totals.clipped / totals.count,
    clippingRisk: classifyClippingRisk(totals.clipped / totals.count),
    silentSampleRatio: totals.silent / totals.count,
  };
}

export function measureSampleMetrics(
  channels: readonly Float32Array[],
  settings: SignalSettings,
): { readonly aggregate: SignalSampleMetrics; readonly channels: readonly SignalSampleMetrics[] } {
  const totals = channels.map((samples) => collectSampleTotals(samples, settings));
  return {
    aggregate: summarizeSampleTotals(
      totals.reduce(combineSampleTotals, {
        peak: 0,
        squares: 0,
        sum: 0,
        clipped: 0,
        silent: 0,
        count: 0,
      }),
    ),
    channels: totals.map(summarizeSampleTotals),
  };
}
