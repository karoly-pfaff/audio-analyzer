import type { FrameFeatures } from '../../contracts/frameFeatures.ts';
import {
  clampFeature,
  percentile,
  quantizeFeature,
  featureValueAt,
} from '../../features/statistics/featureStatistics.ts';
import { DEFAULT_ONSET_SETTINGS, onsetSettingsSchema } from './onsetEvents.ts';
import type { OnsetEvent, OnsetSettings } from './onsetEvents.ts';

interface OnsetContext {
  readonly frames: FrameFeatures;
  readonly settings: OnsetSettings;
  readonly maximumFlux: number;
}

export function detectOnsets(
  frames: FrameFeatures,
  settings: OnsetSettings = DEFAULT_ONSET_SETTINGS,
): readonly OnsetEvent[] {
  const context = {
    frames,
    settings: onsetSettingsSchema.parse(settings),
    maximumFlux: frames.raw.flux.reduce((maximum, value) => Math.max(maximum, value), 0),
  };
  const onsets: OnsetEvent[] = [];
  for (let index = 0; index < frames.raw.flux.length; index += 1) {
    const onset = onsetAtFrame(context, index);
    if (onset) appendOnset(onsets, onset, context.settings.minimumGapSeconds);
  }
  return onsets;
}

function onsetAtFrame(context: OnsetContext, index: number): OnsetEvent | undefined {
  const flux = featureValueAt(context.frames.raw.flux, index);
  if (!hasOnsetAttack(context, index)) return undefined;
  const threshold = adaptiveFluxThreshold(context, index);
  if (flux <= threshold) return undefined;
  return {
    id: 'onset-' + context.frames.sourceSha256.slice(0, 12) + '-' + String(index),
    time: (index * context.frames.hopSize) / context.frames.sampleRate,
    strength: quantizeFeature(clampFeature(flux / context.maximumFlux)),
    confidence: quantizeFeature(clampFeature((flux - threshold) / (flux + threshold + 1e-12))),
  };
}

function hasOnsetAttack(context: OnsetContext, index: number): boolean {
  const flux = featureValueAt(context.frames.raw.flux, index);
  const rms = featureValueAt(context.frames.raw.rms, index);
  const previousRms = featureValueAt(context.frames.raw.rms, index - 2);
  return (
    rms >= 1e-5 &&
    flux >= rms * 0.01 &&
    (rms >= previousRms * 0.85 || flux >= context.maximumFlux * 0.2) &&
    isLocalFluxPeak(context.frames.raw.flux, index)
  );
}

function isLocalFluxPeak(flux: readonly number[], index: number): boolean {
  const value = featureValueAt(flux, index);
  const neighbors = flux.slice(Math.max(0, index - 2), index + 3);
  return value >= Math.max(...neighbors) && value > (flux[index - 1] ?? -1);
}

function adaptiveFluxThreshold(context: OnsetContext, index: number): number {
  const radius = Math.round(context.frames.featureHz / 2);
  const window = context.frames.raw.flux.slice(Math.max(0, index - radius), index + radius + 1);
  const median = percentile(window, 0.5);
  const deviation = percentile(
    window.map((value) => Math.abs(value - median)),
    0.5,
  );
  return (
    median * context.settings.thresholdMultiplier +
    deviation * context.settings.madMultiplier +
    context.maximumFlux * 0.005
  );
}

function appendOnset(onsets: OnsetEvent[], onset: OnsetEvent, minimumGapSeconds: number) {
  const previous = onsets.at(-1);
  if (!previous || onset.time - previous.time >= minimumGapSeconds) {
    onsets.push(onset);
    return;
  }
  if (onset.strength > previous.strength) onsets.splice(-1, 1, onset);
}
