import { parseSignalPcm } from '../contracts/signalPcm.ts';
import {
  DEFAULT_SIGNAL_SETTINGS,
  parseSignalSettings,
  SIGNAL_ANALYZER_VERSION,
} from '../contracts/signalSettings.ts';
import type { SignalAnalysisSummary } from '../contracts/signalSummary.ts';
import { findSignalRegions } from '../regions/signalRegions.ts';
import { measureDynamicRangeProxy } from '../regions/dynamicRangeProxy.ts';
import { measureSampleMetrics } from './sampleMetrics.ts';

export function analyzeSignal(
  input: unknown,
  settings: unknown = DEFAULT_SIGNAL_SETTINGS,
): SignalAnalysisSummary {
  const pcm = parseSignalPcm(input);
  const checked = parseSignalSettings(settings);
  const metrics = measureSampleMetrics(pcm.channels, checked);
  return {
    schemaVersion: 1,
    analyzerVersion: SIGNAL_ANALYZER_VERSION,
    settings: checked,
    durationSeconds: pcm.durationSeconds,
    sampleRate: pcm.sampleRate,
    frameCount: pcm.frameCount,
    channelCount: pcm.channels.length,
    ...metrics.aggregate,
    channelMetrics: metrics.channels,
    dynamicRangeProxyDb: measureDynamicRangeProxy(pcm, checked),
    silence: findSignalRegions(pcm, {
      kind: 'silence',
      threshold: checked.silenceThreshold,
      windowSeconds: checked.silenceWindowSeconds,
      maximumRegions: checked.maximumRegions,
    }),
    clipping: findSignalRegions(pcm, {
      kind: 'clipping',
      threshold: checked.clippingThreshold,
      windowSeconds: checked.clippingWindowSeconds,
      maximumRegions: checked.maximumRegions,
    }),
  };
}
