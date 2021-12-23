export interface DrawBackground {
  color: string;
  opacity: number;
}

export type Owner = number | string;

export interface CanvasSize {
  width: number;
  height: number;
}

export type CanvasPoint = [number, number];

export type CanvasLine = [number, number, number, number];

export type CanvasLineSerie = number[];

export type DrawType = 'point' | 'line' | 'lineSerie' | 'fillRect' | 'clear';

export interface DrawOptions {
  lineWidth: number;
  color: string;
  opacity: number;
}

export interface DrawBase {
  owner: Owner;
  type: DrawType;
}

export interface DrawPoint extends DrawBase {
  type: 'point';
  data: CanvasPoint;
  options: DrawOptions;
}

export interface DrawLine extends DrawBase {
  type: 'line';
  data: CanvasLine;
  options: DrawOptions;
}

export interface DrawLineSerie extends DrawBase {
  type: 'lineSerie';
  data: CanvasLineSerie;
  options: DrawOptions;
}

export interface DrawFillRect extends DrawBase {
  type: 'fillRect';
  data?: CanvasLine;
  options: DrawOptions; // Note: `lineWidth` is not relevant in this case.
}

export interface DrawClear extends DrawBase {
  type: 'clear';
  data?: CanvasLine;
}

export type DrawEvent = DrawPoint | DrawLine | DrawLineSerie | DrawFillRect | DrawClear;

export type DrawEventAnimated =
  | DrawPoint
  | (DrawLine & ({ step?: 'start' | 'started' } | { step: 'end'; canvasLineSerie: CanvasLineSerie }))
  | DrawFillRect
  | DrawClear;

export interface DrawEventsBroadcast {
  animate: boolean;
  events: DrawEvent[];
}

export type DrawAction = 'add' | 'remove';

export interface DrawTransport {
  action: DrawAction;
  events: DrawEvent[];
}

export type CutRange = [number, number];

export type CutRangeArg = CutRange | number;
