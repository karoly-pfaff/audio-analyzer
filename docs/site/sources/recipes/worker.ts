import { SignalAnalysisError, analyzeSignal } from '@karoly-pfaff/audio-analyzer/signal';
import type { SignalAnalysisSummary } from '@karoly-pfaff/audio-analyzer/signal';

type WorkerReply =
  | { readonly status: 'complete'; readonly summary: SignalAnalysisSummary }
  | {
      readonly status: 'failed';
      readonly code: SignalAnalysisError['code'] | 'unexpected-analysis-failure';
    };

// Install inside your bundler's dedicated worker entry. Unknown messages are validated by the API.
export function analyzeWorkerMessage(input: unknown): WorkerReply {
  try {
    return { status: 'complete', summary: analyzeSignal(input) };
  } catch (error) {
    if (error instanceof SignalAnalysisError) return { status: 'failed', code: error.code };
    return { status: 'failed', code: 'unexpected-analysis-failure' };
  }
}
