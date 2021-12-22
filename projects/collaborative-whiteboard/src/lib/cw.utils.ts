import { MD5 } from 'object-hash';

import { getDefaultColors } from './cw.config';
import {
  CutRange,
  CutRangeArg,
  DrawClear,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawType,
} from './cw.types';

export const getColorsMatrix = (colors = getDefaultColors(), maxColorsPerRow = 6) => {
  const matrix: string[][] = [];
  while (colors.length) {
    matrix.push(colors.splice(0, maxColorsPerRow));
  }
  return matrix;
};

export const getClearEvent = (): DrawClear => ({ owner: '', type: 'clear' });

export const mapToDrawEventsAnimated = (events: DrawEvent[]): DrawEventAnimated[] => {
  const result: DrawEventAnimated[] = [];
  events.forEach((event) => {
    if (event.type !== 'lineSerie') {
      result.push(event);
      return;
    }
    const { owner, options, data } = event;
    const animated: DrawEventAnimated[] = [];
    for (let i = 0; i < data.length - 3; i = i + 2) {
      animated.push({
        owner,
        type: 'line',
        options,
        data: [data[i], data[i + 1], data[i + 2], data[i + 3]],
        step: 'started',
      });
    }
    // Update first event
    animated[0] = { ...animated[0], step: 'start' };
    // Update last event
    animated[animated.length - 1] = {
      ...animated[animated.length - 1],
      step: 'end',
      canvasLineSerie: data,
    };
    result.push(...animated);
  });
  return result;
};

export const mapToDrawEventsBroadcast = (events: DrawEvent[], animate = false): DrawEventsBroadcast => ({
  animate,
  events,
});

export const normalizeCutRange = (data: CutRangeArg): CutRange => {
  const compareNumbers = (a: number, b: number) => {
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    return 0;
  };
  const [from, to] = Array.isArray(data) ? [...data].sort(compareNumbers) : [data, data];
  return [Math.max(0, from), Math.max(0, to)];
};

export const keepDrawEventsAfterClearEvent = (events: DrawEvent[]): DrawEvent[] => {
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === 'clear') {
      return events.slice(i + 1);
    }
  }
  return events;
};

export const inferDrawType = (dataLength: number): DrawType =>
  dataLength === 2 ? 'point' : dataLength === 4 ? 'line' : 'lineSerie';

export const translate = (event: DrawEvent, x: number, y: number): DrawEvent => {
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

export const getHash = (event: DrawEvent) => MD5(event);
