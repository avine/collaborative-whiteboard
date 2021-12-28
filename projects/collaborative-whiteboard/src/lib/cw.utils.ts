import { defaultOwner, getDefaultColors } from './cw.config';
import {
  CutRange,
  CutRangeArg,
  DrawClear,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawFillRect,
  DrawType,
} from './cw.types';

export const getColorsMatrix = (colors = getDefaultColors(), maxColorsPerRow = 6) => {
  const matrix: string[][] = [];
  while (colors.length) {
    matrix.push(colors.splice(0, maxColorsPerRow));
  }
  return matrix;
};

export const getFillRectEvent = (color: string, opacity = 1, owner = defaultOwner): DrawFillRect => ({
  id: getEventUID(),
  owner,
  type: 'fillRect',
  options: { lineWidth: 0, color, opacity },
});

export const getClearEvent = (owner = defaultOwner): DrawClear => ({
  id: getEventUID(),
  owner,
  type: 'clear',
});

export const mapToDrawEventsAnimated = (events: DrawEvent[]): (DrawEvent | DrawEventAnimated)[] => {
  const result: (DrawEvent | DrawEventAnimated)[] = [];
  events.forEach((event) => {
    switch (event.type) {
      case 'lineSerie': {
        const animatedLength = event.data.length / 2;
        const animated: DrawEventAnimated[] = Array(animatedLength)
          .fill(undefined)
          .map((_, index) => {
            // Note: for strong typing, we need to define the variable to return.
            const animatedStep: DrawEventAnimated = { ...event, step: 'progress', index: 2 * index + 2 };
            return animatedStep;
          });
        // Update first event
        animated[0] = { ...animated[0], step: 'start' };
        // Update last event
        animated[animatedLength - 1] = { ...animated[animatedLength - 1], step: 'end' };
        result.push(...animated);
        break;
      }
      default: {
        result.push(event);
        break;
      }
    }
  });
  return result;
};

export const isDrawEventAnimated = (event: DrawEvent | DrawEventAnimated): event is DrawEventAnimated => {
  const step: keyof DrawEventAnimated = 'step';
  const index: keyof DrawEventAnimated = 'index';
  return step in event && index in event;
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

export const getEventUID = () =>
  `${Date.now()}-${Math.round(Math.random() * 1e16)
    .toString(16)
    .substring(0, 8)}`;

export const getUID = (prefix = '') => (prefix ? `${prefix}-` : '') + Math.random().toString().substring(2);
