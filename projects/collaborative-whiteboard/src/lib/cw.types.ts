export type Owner = number | string;

export interface FillBackground {
  owner: Owner;
  transparent: boolean;
  color: string;
  opacity: number;
}

export type DrawMode = 'selection' | 'brush' | 'line' | 'rectangle' | 'ellipse';

export interface CanvasSize {
  width: number;
  height: number;
}

export type CanvasPoint = [number, number];

export type CanvasLine = [number, number, number, number];

export type CanvasLineSerie = number[];

export type DrawType = 'point' | 'line' | 'lineSerie' | 'rectangle' | 'ellipse' | 'fillRect' | 'clear' | 'selection';

export interface DrawOptions {
  lineWidth: number;
  color: string;
  opacity: number;
  fillOpacity: number;
  angle?: number;
}

export interface DrawBase {
  id: string;
  owner: Owner;
  type: DrawType;
  options: DrawOptions;
}

export interface DrawPoint extends DrawBase {
  type: 'point';
  data: CanvasPoint;
}

export interface DrawLine extends DrawBase {
  type: 'line';
  data: CanvasLine;
}

export interface DrawLineSerie extends DrawBase {
  type: 'lineSerie';
  data: CanvasLineSerie;
}

export interface DrawRectangle extends DrawBase {
  type: 'rectangle';
  data: CanvasLine;
}

export interface DrawEllipse extends DrawBase {
  type: 'ellipse';
  data: CanvasLine;
}

export interface DrawFillRect extends DrawBase {
  type: 'fillRect';
  data: CanvasLine;
}

export interface DrawClear extends DrawBase {
  type: 'clear';
  data: CanvasLine;
}

export interface DrawSelection extends DrawBase {
  type: 'selection';
  data: CanvasPoint | CanvasLine | CanvasLineSerie;
}

export type DrawEvent =
  | DrawPoint
  | DrawLine
  | DrawLineSerie
  | DrawRectangle
  | DrawEllipse
  | DrawFillRect
  | DrawClear
  | DrawSelection;

export type DrawEventAnimated = (DrawLine | DrawLineSerie | DrawRectangle | DrawEllipse) & { animate: boolean };

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
