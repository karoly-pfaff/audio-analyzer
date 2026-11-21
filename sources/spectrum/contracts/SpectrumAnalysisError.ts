const MESSAGES = {
  'invalid-settings': 'Spectrum settings are outside the supported ranges.',
  'numeric-overflow': 'Signal amplitudes exceed the finite FFT calculation range.',
} as const;

export class SpectrumAnalysisError extends Error {
  readonly code: keyof typeof MESSAGES;

  constructor(code: keyof typeof MESSAGES) {
    super(MESSAGES[code]);
    this.name = 'SpectrumAnalysisError';
    this.code = code;
  }
}
