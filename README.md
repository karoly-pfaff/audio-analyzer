# Audio Analyzer

TypeScript APIs for musical timelines, original-channel signal measurements, display spectra
and quick tempo estimates from decoded PCM.

## Install and import

Install a supplied package archive in your application:

```sh
npm install ./karoly-pfaff-audio-analyzer-0.1.0.tgz
```

For a published GitHub Packages version, authenticate with a personal access token (classic)
that has read:packages, then install the exact version. npm login stores credentials in your
user configuration; the project registry mapping contains no token.

```sh
npm login --scope=@karoly-pfaff --auth-type=legacy --registry=https://npm.pkg.github.com
npm config set @karoly-pfaff:registry=https://npm.pkg.github.com --location=project
npm install --save-exact @karoly-pfaff/audio-analyzer@0.1.0
```

The package uses ESM and includes TypeScript declarations. Supported Node.js versions are
24.18.1 through 24.x. Browser applications can import it through an ESM bundler.

| Import                                  | Input                                           | Result                                                                   |
| --------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| `@karoly-pfaff/audio-analyzer`          | Prepared 22,050 Hz mono PCM and source identity | Musical frame features, onsets, beats, sections and waveform peaks       |
| `@karoly-pfaff/audio-analyzer/signal`   | Original channel arrays and sample rate         | Sample metrics, silence/clipping regions and display envelopes           |
| `@karoly-pfaff/audio-analyzer/spectrum` | Original PCM and channel policy                 | Relative display magnitudes, source-time/frequency metadata and centroid |
| `@karoly-pfaff/audio-analyzer/tempo`    | Original PCM and prefix settings                | BPM estimate or explicit unavailable/failed/cancelled result             |

## Measure original samples

```ts
import { analyzeSignal, createSignalEnvelope } from '@karoly-pfaff/audio-analyzer/signal';

const input = {
  channels: [new Float32Array([0, 0.5, -0.5, 1.2])],
  sampleRate: 48_000,
};
const summary = analyzeSignal(input);
const envelope = createSignalEnvelope(input, 128);
// summary.peakAmplitude is approximately 1.2
// summary.clippedSampleCount === 1
// envelope.minimum, maximum, rms and transientActivity each have 128 values.
```

Input channels must be equally sized, nonempty finite Float32Arrays. Signal, spectrum and tempo
accept 1–32 channels, an integer rate from 1 through 768,000 Hz and at most 100,000,000 sample
values in total. Input objects contain only `channels` and `sampleRate`. `parseSignalPcm` returns
additional derived fields; pass the original two-field payload to analysis operations.

Signal measurements retain original amplitudes, including values above one. dB values use
amplitude one as their reference; zero amplitude has null dB and crest factor. Sample peak,
clipping labels and the dynamic-range proxy do not measure true peak, LUFS or loudness range.

## Analyze music

Prepare a separate mono 22,050 Hz copy, then call `createAnalysisPcm` and `analyzeAudio` with
actual source/PCM SHA-256 identities and decoder provenance. The musical limit is 30 minutes.
`createAnalysisPcm` copies and attenuates above-full-scale samples; it does not resample.

`AudioFeatureTimeline` contains source-time events and normalized frame channels. Read a frame
at `Math.floor(sourceSeconds * timeline.featureHz)` within `[0, durationSeconds)`. A nullable BPM
or beat phase represents absent evidence. Use observed beat times for timing rather than turning
a quick BPM estimate into a metronome.

## Spectrum and tempo

Spectrum defaults to arithmetic channel mean, 256 selected bins, at most 256 output frames and
a -80 dB relative floor. Use `binHz`, `maximumFrequencyHz` and `frameRanges` to label axes.
Magnitudes are relative values in [0, 1]. Reducing output frames limits storage while all source
windows still contribute. The independent centroid uses the full one-sided spectrum.

Quick tempo analyzes at most 60 seconds and 3,000,000 mono samples. Inspect `status` before
reading `bpm`, and retain analyzed-duration/truncation metadata. Its high/medium/low label is a
BPM-range heuristic rather than a probability. Numeric BPM comparison helpers distinguish close,
octave-related and mismatched tempos.

## Settings, errors and retained results

Omitting settings uses defaults. To override a field, spread the matching `DEFAULT_*` constant;
partial settings objects are rejected. Exported schemas support `parse` and `safeParse`.

Catch `AudioAnalysisError`, `SignalAnalysisError`, `SpectrumAnalysisError` or `TempoAnalysisError`
at their documented boundaries. Musical schema validation can throw Zod errors; quick-tempo
unavailability and backend failures are separate result states.

Calls run synchronously. Use application-owned workers for long recordings and terminate the
worker for active cancellation. Transfer owned PCM copies to preserve playback buffers.

Musical timelines support JSON serialization and `audioFeatureTimelineSchema` validation.
Spectrum/envelope typed arrays need an explicit array or binary representation. Save source/PCM
identity, preparation version, algorithm version and settings with cached results.

The [HTML API guide](https://karoly-pfaff.github.io/audio-analyzer/) contains complete settings tables, result-field
explanations, TypeScript examples and the searchable reference.

MIT licensed. See [LICENSE](LICENSE).
