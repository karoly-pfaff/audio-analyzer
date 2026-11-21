import Meyda from 'meyda';
import { z } from 'zod';
import { AudioAnalysisError } from '../../contracts/AudioAnalysisError.ts';
import { ANALYSIS_SAMPLE_RATE } from '../../contracts/analysisPcm.ts';
import { FRAME_SIZE } from '../../contracts/frameFeatures.ts';
import { windowRms } from './featureWindow.ts';
import { featureValueAt } from '../statistics/featureStatistics.ts';

export interface SpectrumFeatures {
  readonly magnitudes: Float32Array;
  readonly rms: number;
  readonly sub: number;
  readonly bass: number;
  readonly mid: number;
  readonly high: number;
  readonly centroidHz: number;
  readonly flatness: number;
  readonly flux: number;
}

const MEYDA_SPECTRUM_SCHEMA = z
  .strictObject({
    amplitudeSpectrum: z
      .instanceof(Float32Array)
      .refine(
        (bins) =>
          bins.length === FRAME_SIZE / 2 &&
          bins.every((value) => Number.isFinite(value) && value >= 0),
      ),
    spectralCentroid: z.union([
      z
        .number()
        .nonnegative()
        .max(FRAME_SIZE / 2),
      z.nan(),
    ]),
    spectralFlatness: z.union([
      z
        .number()
        .min(0)
        .max(1 + 1e-10),
      z.nan(),
    ]),
  })
  .refine(
    (result) =>
      !result.amplitudeSpectrum.some((value) => value > 0) ||
      (Number.isFinite(result.spectralCentroid) && Number.isFinite(result.spectralFlatness)),
  );

interface MeydaExtractorPort {
  readonly extract: (features: readonly string[], signal: Float32Array) => unknown;
}

// Upstream's CJS runtime and ESM declarations disagree under NodeNext. Validate the narrow port;
// pass through only the dependency's opaque receiver state for its documented extract method.
const MEYDA_RECEIVER_SCHEMA = z.looseObject({
  extract: z.custom<MeydaExtractorPort['extract']>((value) => typeof value === 'function'),
});

export function createSpectrumExtractor(): (
  window: Float32Array,
  previous: Float32Array,
) => SpectrumFeatures {
  // Meyda.extract uses its receiver. A per-analysis clone isolates all mutable DSP state.
  const extractor = {
    ...MEYDA_RECEIVER_SCHEMA.parse(Meyda),
    bufferSize: FRAME_SIZE,
    sampleRate: ANALYSIS_SAMPLE_RATE,
    windowingFunction: 'hanning',
  };
  return (window, previous) => extractSpectrumFrame(extractor, { window, previous });
}

function extractSpectrumFrame(
  extractor: MeydaExtractorPort,
  frame: { readonly window: Float32Array; readonly previous: Float32Array },
): SpectrumFeatures {
  const rms = windowRms(frame.window);
  if (rms <= 1e-12) return createSilentSpectrum();
  const result = MEYDA_SPECTRUM_SCHEMA.safeParse(
    extractor.extract(['amplitudeSpectrum', 'spectralCentroid', 'spectralFlatness'], frame.window),
  );
  if (!result.success) throw new AudioAnalysisError('analysis-failed');
  const magnitudes = result.data.amplitudeSpectrum;
  return {
    magnitudes,
    rms,
    sub: bandPower(magnitudes, [20, 60]),
    bass: bandPower(magnitudes, [60, 250]),
    mid: bandPower(magnitudes, [250, 2000]),
    high: bandPower(magnitudes, [2000, ANALYSIS_SAMPLE_RATE / 2]),
    ...spectralShape(result.data),
    flux: positiveSpectralFlux(magnitudes, frame.previous),
  };
}

function spectralShape(
  result: z.infer<typeof MEYDA_SPECTRUM_SCHEMA>,
): Pick<SpectrumFeatures, 'centroidHz' | 'flatness'> {
  // A sample exactly on a Hann endpoint has time-domain RMS but zero spectral power.
  if (!result.amplitudeSpectrum.some((value) => value > 0)) return { centroidHz: 0, flatness: 0 };
  return {
    centroidHz: (result.spectralCentroid * ANALYSIS_SAMPLE_RATE) / FRAME_SIZE,
    flatness: Math.min(1, result.spectralFlatness),
  };
}

function createSilentSpectrum(): SpectrumFeatures {
  return {
    magnitudes: new Float32Array(FRAME_SIZE / 2),
    rms: 0,
    sub: 0,
    bass: 0,
    mid: 0,
    high: 0,
    centroidHz: 0,
    flatness: 0,
    flux: 0,
  };
}

function bandPower(magnitudes: Float32Array, range: readonly [number, number]): number {
  const first = Math.ceil((range[0] * FRAME_SIZE) / ANALYSIS_SAMPLE_RATE);
  const last = Math.min(
    magnitudes.length,
    Math.ceil((range[1] * FRAME_SIZE) / ANALYSIS_SAMPLE_RATE),
  );
  let power = 0;
  for (let index = first; index < last; index += 1) power += featureValueAt(magnitudes, index) ** 2;
  // One-sided Parseval power, corrected for the Hann window's mean-square gain.
  return (2 * power) / (FRAME_SIZE * FRAME_SIZE * 0.375);
}

function positiveSpectralFlux(magnitudes: Float32Array, previous: Float32Array): number {
  let flux = 0;
  for (let index = 0; index < magnitudes.length; index += 1)
    flux += Math.max(0, featureValueAt(magnitudes, index) - featureValueAt(previous, index));
  return flux / FRAME_SIZE;
}
