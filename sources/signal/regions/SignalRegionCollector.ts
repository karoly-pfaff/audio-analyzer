import type { SignalRegion, SignalRegionSummary } from '../contracts/signalSummary.ts';

export class SignalRegionCollector {
  private readonly regions: SignalRegion[] = [];
  private readonly sampleRate: number;
  private readonly maximumRegions: number;
  private regionStart = -1;
  private regionCount = 0;
  private longestRegionSamples = 0;

  constructor(options: { readonly sampleRate: number; readonly maximumRegions: number }) {
    this.sampleRate = options.sampleRate;
    this.maximumRegions = options.maximumRegions;
  }

  observe(isInside: boolean, offset: number): void {
    if (isInside && this.regionStart < 0) this.regionStart = offset;
    if (!isInside && this.regionStart >= 0) {
      this.appendRegion(offset);
      this.regionStart = -1;
    }
  }

  finish(frameCount: number): SignalRegionSummary {
    if (this.regionStart >= 0) this.appendRegion(frameCount);
    return {
      regions: this.regions,
      regionCount: this.regionCount,
      regionsTruncated: this.regionCount > this.regions.length,
      longestRegionSeconds: this.longestRegionSamples / this.sampleRate,
    };
  }

  private appendRegion(end: number): void {
    this.regionCount += 1;
    this.longestRegionSamples = Math.max(this.longestRegionSamples, end - this.regionStart);
    if (this.regions.length < this.maximumRegions)
      this.regions.push({
        startSeconds: this.regionStart / this.sampleRate,
        endSeconds: end / this.sampleRate,
      });
  }
}
