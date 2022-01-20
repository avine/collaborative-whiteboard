import { DEFAULT_OWNER } from '../cw.config';
import { CanvasLine, DrawClear, DrawFillBackground, DrawType } from '../cw.types';
import { getDrawEventUID } from './id';

export const getEmptyCanvasLine = (): CanvasLine => [0, 0, 0, 0];

export const isEmptyCanvasLine = ([fromX, fromY, toX, toY]: CanvasLine) => toX === fromX && toY === fromY;

export const getFillBackgroundEvent = (color: string, fillOpacity = 1, owner = DEFAULT_OWNER): DrawFillBackground => ({
  id: getDrawEventUID(),
  owner,
  type: 'fillBackground',
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

export const inferBasicDrawType = (dataLength: number): DrawType =>
  dataLength === 2 ? 'point' : dataLength === 4 ? 'line' : 'lineSerie';
