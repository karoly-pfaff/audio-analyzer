# Analyzer architecture

Four public entries expose cohesive offline calculations: the root musical timeline, /signal
original-channel metrics/envelopes, /spectrum display FFT/full-spectrum centroid and /tempo
bounded quick estimation/relationships. Public types and algorithm/settings metadata belong to
their profile. The musical audio-rules-1.3.0-meyda-5.6.3 identity and pinned hashes are unchanged.

Signal and spectrum load Zod and shared PCM preparation only; they never load Meyda or music-tempo.
Tempo loads music-tempo and validation, without Meyda. The musical root loads Meyda. Dependencies
are ordinary pinned registry packages; all runtime imports are package-relative or declared.
Hosts own decoding, resampling/downmix preparation, workers, queues, active cancellation, playback,
storage and rendering. A synchronous cancellation flag cannot interrupt a blocked worker loop.

The spectrum keeps source-time/frequency/window/normalization metadata and Lab-compatible float
mixing. Quick labels expose their heuristic basis separately from observed-beat confidence.
The [README](../README.md) documents limits, errors, channel policies and units. Every production
source is covered by the strict per-file gate. Integration consumes a real tarball without source
aliases. No runtime data, source paths or dependencies refer to a sibling repository.
