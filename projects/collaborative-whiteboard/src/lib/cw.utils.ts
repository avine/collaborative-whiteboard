import { MD5 } from 'object-hash';

import { getDefaultColors } from './cw.config';
import {
  CutRange,
  CutRangeArg,
  DrawClear,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawLine,
} from './cw.types';

export const getColorsMatrix = (colors = getDefaultColors(), maxColorsPerRow = 6) => {
  const matrix: string[][] = [];
  while (colors.length) {
    matrix.push(colors.splice(0, maxColorsPerRow));
  }
  return matrix;
};

export const getClearEvent = (): DrawClear => ({
  owner: '',
  type: 'clear',
});

export const mapDrawLineSerieToLines = (events: DrawEvent[]): DrawEventAnimated[] => {
  const result: DrawEventAnimated[] = [];
  events.forEach((event) => {
    if (event.type !== 'lineSerie') {
      result.push(event);
      return;
    }
    const { owner, options, data } = event;
    const animation: DrawEventAnimated[] = [];
    for (let i = 0; i < data.length - 3; i = i + 2) {
      animation.push({
        owner,
        type: 'line',
        options,
        data: [data[i], data[i + 1], data[i + 2], data[i + 3]],
        step: 'started',
      });
    }
    // Update first event
    animation[0] = { ...animation[0], step: 'start' };
    // Update last event
    animation[animation.length - 1] = {
      ...animation[animation.length - 1],
      step: 'end',
      canvasLineSerie: event.data,
    };
    result.push(...animation);
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

export const getHash = (event: DrawEvent) => MD5(event);
