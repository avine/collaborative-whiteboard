import { DEFAULT_OWNER, getDefaultColors } from '../cw.config';
import { CanvasLine, DrawClear, DrawEvent, DrawEventsBroadcast, DrawFillRect, DrawType } from '../cw.types';
import { SELECTION_SHIFT } from './canvas-context/canvas-context.config';
import { getBoundingRect } from './canvas-context/canvas.context.utils';

export const getColorsMatrix = (colors = getDefaultColors(), maxColorsPerRow = 6) => {
  const matrix: string[][] = [];
  while (colors.length) {
    matrix.push(colors.splice(0, maxColorsPerRow));
  }
  return matrix;
};

export const getEmptyCanvasLine = (): CanvasLine => [0, 0, 0, 0];

export const isEmptyCanvasLine = ([fromX, fromY, toX, toY]: CanvasLine) => toX === fromX && toY === fromY;

export const getFillRectEvent = (color: string, fillOpacity = 1, owner = DEFAULT_OWNER): DrawFillRect => ({
  id: getEventUID(),
  owner,
  type: 'fillRect',
  data: getEmptyCanvasLine(),
  options: { lineWidth: 0, color, opacity: 0, fillOpacity }, // Note: `lineWidth` and  `opacity` are not relevant in this case
});

export const getClearEvent = (owner = DEFAULT_OWNER): DrawClear => ({
  id: getEventUID(),
  owner,
  type: 'clear',
  data: getEmptyCanvasLine(),
  options: { lineWidth: 0, color: '', opacity: 0, fillOpacity: 0 }, // Note: `options` is not relevant in this case
});

export const getSelectionEvents = (events: DrawEvent[], owner = DEFAULT_OWNER): DrawEvent[] => {
  const selection: DrawEvent[] = events.length > 1 ? events.map((event) => ({ ...event, type: 'selection' })) : [];
  const lineWidthMax = events.reduce((max, { options: { lineWidth } }) => Math.max(max, lineWidth), 0);
  if (events.length) {
    selection.push({
      id: getEventUID(),
      owner,
      type: 'selection',
      options: { lineWidth: lineWidthMax + 2 * SELECTION_SHIFT, opacity: 0, fillOpacity: 0, color: '0, 0, 0' },
      data: getBoundingRect(...events.map(({ data }) => data)),
    });
  }
  return selection;
};

export const mapToDrawEventsBroadcast = (events: DrawEvent[], animate = false): DrawEventsBroadcast => ({
  animate,
  events,
});

export const inferBasicDrawType = (dataLength: number): DrawType =>
  dataLength === 2 ? 'point' : dataLength === 4 ? 'line' : 'lineSerie';

export const translateDrawEvent = (event: DrawEvent, x: number, y: number): DrawEvent => {
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
    .substring(0, 4)}`;

export const getUID = (prefix = '') => (prefix ? `${prefix}-` : '') + Math.random().toString().substring(2);
