const MESSAGES = {
  'invalid-pcm': 'Decoded audio is empty, nonfinite, truncated or exceeds the analysis limits.',
  'source-changed':
    'The project audio no longer matches its imported fingerprint. Import it again.',
  'decode-failed': 'Audio decoding failed. Check the local media tools and source file.',
  'analysis-failed': 'Audio analysis failed; no successful timeline was produced.',
  'cache-invalid': 'The analysis cache is damaged or incompatible. Rebuild it explicitly.',
  'analysis-busy':
    'Another project operation holds .project.lock. Verify ownership before recovering a stale lock.',
  'score-conflict':
    'The stored score references another analysis. Preserve it and resolve the analysis change explicitly.',
  cancelled: 'Audio analysis was cancelled.',
  'timed-out': 'Audio analysis exceeded its time limit.',
} as const;

export class AudioAnalysisError extends Error {
  readonly code: keyof typeof MESSAGES;

  constructor(code: keyof typeof MESSAGES) {
    super(MESSAGES[code]);
    this.name = 'AudioAnalysisError';
    this.code = code;
  }
}
