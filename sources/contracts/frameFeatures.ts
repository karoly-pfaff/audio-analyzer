import { z } from 'zod';
import { ANALYSIS_SAMPLE_RATE, MAX_ANALYSIS_SAMPLES } from './analysisPcm.ts';

export const FRAME_SIZE = 1024;
export const HOP_SIZE = 256;
export const FEATURE_HZ = ANALYSIS_SAMPLE_RATE / HOP_SIZE;

export const RAW_CHANNELS = [
  'rms',
  'sub',
  'bass',
  'mid',
  'high',
  'centroidHz',
  'flatness',
  'flux',
] as const;

const RAW_VALUES = z.array(z.number().nonnegative()).max(155040);
const NORMALIZED_VALUES = z.array(z.number().min(0).max(1)).max(155040);

export const frameFeatureDataSchema = z.strictObject({
  schemaVersion: z.literal(1),
  sourceSha256: z.string().regex(/^[a-f0-9]{64}$/),
  sampleRate: z.literal(ANALYSIS_SAMPLE_RATE),
  sampleCount: z.number().int().positive().max(MAX_ANALYSIS_SAMPLES),
  durationSeconds: z.number().positive().max(1800),
  frameSize: z.literal(FRAME_SIZE),
  hopSize: z.literal(HOP_SIZE),
  featureHz: z.literal(FEATURE_HZ),
  inputPeak: z.number().nonnegative(),
  normalizationGain: z.number().positive().max(1),
  raw: z.strictObject({
    rms: RAW_VALUES,
    sub: RAW_VALUES,
    bass: RAW_VALUES,
    mid: RAW_VALUES,
    high: RAW_VALUES,
    centroidHz: RAW_VALUES,
    flatness: RAW_VALUES,
    flux: RAW_VALUES,
  }),
  channels: z.strictObject({
    energy: NORMALIZED_VALUES,
    sub: NORMALIZED_VALUES,
    bass: NORMALIZED_VALUES,
    mid: NORMALIZED_VALUES,
    high: NORMALIZED_VALUES,
    brightness: NORMALIZED_VALUES,
    roughness: NORMALIZED_VALUES,
    onsetStrength: NORMALIZED_VALUES,
  }),
});

export type FrameFeatures = z.infer<typeof frameFeatureDataSchema>;

export type RawFeatureChannels = FrameFeatures['raw'];

export const frameFeaturesSchema = frameFeatureDataSchema.refine(
  (frames) => {
    const count = Math.ceil(frames.sampleCount / HOP_SIZE);
    return (
      [...Object.values(frames.raw), ...Object.values(frames.channels)].every(
        (channel) => channel.length === count,
      ) && Math.abs(frames.durationSeconds - frames.sampleCount / frames.sampleRate) < 1e-9
    );
  },
  { message: 'Frame counts and duration must match the source sample clock.' },
);
