import type { FrameFeatures, RawFeatureChannels } from '../../contracts/frameFeatures.ts';
import { clampFeature, percentile, quantizeFeature } from '../statistics/featureStatistics.ts';

export function normalizeFeatureChannels(raw: RawFeatureChannels): FrameFeatures['channels'] {
  const maximumRms = raw.rms.reduce((maximum, value) => Math.max(maximum, value), 0);
  const hasSignal = maximumRms >= 1e-5;
  const bandFloor = Math.max(1e-12, maximumRms * maximumRms * 1e-4);
  return {
    energy: normalizeFeatureValues(raw.rms, hasSignal),
    sub: normalizeFeatureValues(raw.sub, hasSignal, bandFloor),
    bass: normalizeFeatureValues(raw.bass, hasSignal, bandFloor),
    mid: normalizeFeatureValues(raw.mid, hasSignal, bandFloor),
    high: normalizeFeatureValues(raw.high, hasSignal, bandFloor),
    brightness: normalizeFeatureValues(raw.centroidHz, hasSignal),
    roughness: raw.flatness.map((value) => (hasSignal ? quantizeFeature(clampFeature(value)) : 0)),
    onsetStrength: normalizeFeatureValues(raw.flux, hasSignal),
  };
}

function normalizeFeatureValues(
  values: readonly number[],
  active: boolean,
  minimum = 1e-12,
): number[] {
  const upperPercentile = percentile(values, 0.95);
  const high =
    upperPercentile > minimum
      ? upperPercentile
      : values.reduce((maximum, value) => Math.max(maximum, value), 0);
  if (!active || high <= minimum) return values.map(() => 0);
  const low = percentile(values, 0.1);
  // A steady active tone must remain steady, rather than amplifying numerical ripple.
  if (high - low < high * 0.1)
    return values.map((value) => quantizeFeature(clampFeature(value / high)));
  return values.map((value) => quantizeFeature(clampFeature((value - low) / (high - low))));
}
