import { MD5 } from 'object-hash';

import { getDefaultColors } from './cw.config';
import { CutRange, CutRangeArg, DrawClear, DrawEvent, DrawEventsBroadcast } from './cw.types';

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

export const mapDrawLineSerieToLines = (events: DrawEvent[]): DrawEvent[] => {
  const result: DrawEvent[] = [];
  events.forEach((event) => {
    if (event.type === 'lineSerie') {
      const { owner, options, data } = event;
      for (let i = 0; i < data.length - 3; i = i + 2) {
        result.push({
          owner,
          type: 'line',
          options,
          data: [data[i], data[i + 1], data[i + 2], data[i + 3]],
        });
      }
    } else {
      result.push(event);
    }
  });
  return result;
};

export const mapToDrawEventsBroadcast = (events: DrawEvent[], animate = false): DrawEventsBroadcast => ({
  animate,
  events: animate ? mapDrawLineSerieToLines(events) : events,
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
