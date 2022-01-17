import { DEFAULT_OWNER } from '../cw.config';
import { CanvasLine, DrawClear, DrawEvent, DrawEventsBroadcast, DrawFillRect, DrawType } from '../cw.types';
import { getDrawEventUID } from './id';

export const getEmptyCanvasLine = (): CanvasLine => [0, 0, 0, 0];

export const isEmptyCanvasLine = ([fromX, fromY, toX, toY]: CanvasLine) => toX === fromX && toY === fromY;

export const getFillRectEvent = (color: string, fillOpacity = 1, owner = DEFAULT_OWNER): DrawFillRect => ({
  id: getDrawEventUID(),
  owner,
  type: 'fillRect',
  data: getEmptyCanvasLine(),
  options: { lineWidth: 0, color, opacity: 0, fillOpacity }, // Note: `lineWidth` and  `opacity` are not relevant in this case
});

export const getClearEvent = (owner = DEFAULT_OWNER): DrawClear => ({
  id: getDrawEventUID(),
  owner,
  type: 'clear',
  data: getEmptyCanvasLine(),
  options: { lineWidth: 0, color: '', opacity: 0, fillOpacity: 0 }, // Note: `options` is not relevant in this case
});

export const mapToDrawEventsBroadcast = (events: DrawEvent[], animate = false): DrawEventsBroadcast => ({
  animate,
  events,
});

export const inferBasicDrawType = (dataLength: number): DrawType =>
  dataLength === 2 ? 'point' : dataLength === 4 ? 'line' : 'lineSerie';
