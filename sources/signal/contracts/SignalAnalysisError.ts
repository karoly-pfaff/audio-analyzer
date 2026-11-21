const MESSAGES = {
  'invalid-pcm':
    'Signal PCM must contain finite, equally sized nonempty Float32 channels within the input limits.',
  'invalid-settings': 'Signal analysis settings are outside the supported ranges.',
  'invalid-resolution': 'Signal envelope resolution must be an integer between 1 and 65536.',
} as const;

export class SignalAnalysisError extends Error {
  readonly code: keyof typeof MESSAGES;

  constructor(code: keyof typeof MESSAGES) {
    super(MESSAGES[code]);
    this.name = 'SignalAnalysisError';
    this.code = code;
  }
}
