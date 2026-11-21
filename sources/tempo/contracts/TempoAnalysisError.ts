const MESSAGES = {
  'invalid-settings': 'Quick tempo settings are outside the supported ranges.',
  'invalid-bpm': 'BPM comparisons require finite positive numbers.',
} as const;

export class TempoAnalysisError extends Error {
  readonly code: keyof typeof MESSAGES;

  constructor(code: keyof typeof MESSAGES) {
    super(MESSAGES[code]);
    this.name = 'TempoAnalysisError';
    this.code = code;
  }
}
