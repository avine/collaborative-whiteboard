export const getAnimFrameRate = (steps: number): number => {
  // According to `getAnimFlushCount` implementation, when `broadcastEventsBuffer`
  // is of length 475, then `expectedAnimDuration` is about 100.
  const expectedFrameCount = steps / 4.75;

  // Note that in reality, the animation will take more time to complete...
  const expectedAnimDuration = 1000; // ms

  const frameRate = expectedAnimDuration / expectedFrameCount;

  const isTooSlow = frameRate > 60;
  const isTooFast = frameRate < 12; // around 90Hz

  return isTooSlow || isTooFast ? 0 : frameRate;
};

export const getAnimFlushCount = (remain: number, total: number) => {
  // Let's do some easing!
  const count = Math.round((Math.sin((remain / total) * Math.PI) * total) / 50) + 1;
  return Math.min(count, remain);
};
