import { z } from 'zod';
import { parseSignalPcm } from '../contracts/signalPcm.ts';
import { SignalAnalysisError } from '../contracts/SignalAnalysisError.ts';
import { SIGNAL_ANALYZER_VERSION } from '../contracts/signalSettings.ts';
import { measureSignalWindow } from '../regions/signalWindow.ts';
import { createTransientActivity } from './transientActivity.ts';

export interface SignalEnvelope {
  readonly schemaVersion: 1;
  readonly analyzerVersion: string;
  readonly sampleRate: number;
  readonly frameCount: number;
  readonly channelCount: number;
  readonly durationSeconds: number;
  readonly channelPolicy: 'all-channel-extrema-and-rms';
  readonly minimum: Float32Array;
  readonly maximum: Float32Array;
  readonly rms: Float32Array;
  readonly transientActivity: Float32Array;
}

const RESOLUTION_SCHEMA = z.number().int().min(1).max(65_536);

export function createSignalEnvelope(input: unknown, columns = 1024): SignalEnvelope {
  const pcm = parseSignalPcm(input);
  if (!RESOLUTION_SCHEMA.safeParse(columns).success)
    throw new SignalAnalysisError('invalid-resolution');
  const ranges = Array.from({ length: columns }, (_, index) =>
    measureSignalWindow(pcm.channels, {
      start: Math.min(pcm.frameCount - 1, Math.floor((index * pcm.frameCount) / columns)),
      end: Math.min(pcm.frameCount, Math.ceil(((index + 1) * pcm.frameCount) / columns)),
    }),
  );
  const rms = Float32Array.from(ranges, (range) => range.rms);
  return {
    schemaVersion: 1,
    analyzerVersion: SIGNAL_ANALYZER_VERSION,
    sampleRate: pcm.sampleRate,
    frameCount: pcm.frameCount,
    channelCount: pcm.channels.length,
    durationSeconds: pcm.durationSeconds,
    channelPolicy: 'all-channel-extrema-and-rms',
    minimum: Float32Array.from(ranges, (range) => range.minimum),
    maximum: Float32Array.from(ranges, (range) => range.maximum),
    rms,
    transientActivity: createTransientActivity(rms),
  };
}
