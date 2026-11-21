interface DecodedPcm {
  readonly sampleRate: number;
  readonly channels: readonly Float32Array<ArrayBuffer>[];
}

export function copyDecodedPcm(decoded: AudioBuffer): DecodedPcm {
  // Copy before transferring buffers to a worker that must not detach playback data.
  return {
    sampleRate: decoded.sampleRate,
    channels: Array.from({ length: decoded.numberOfChannels }, (_, channel) =>
      decoded.getChannelData(channel).slice(),
    ),
  };
}
