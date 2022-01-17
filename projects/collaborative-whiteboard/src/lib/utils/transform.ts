import { DrawEvent } from '../cw.types';

export const translateEvent = (event: DrawEvent, x: number, y: number): DrawEvent => {
  const result = { ...event };
  if (!result.data) {
    return result;
  }
  result.data = [...result.data];
  for (let i = 0; i < result.data.length - 1; i += 2) {
    result.data[i] = result.data[i] + x;
    result.data[i + 1] = result.data[i + 1] + y;
  }
  return result;
};
