export type Owner = number | string;

export interface Background {
  owner: Owner;
  transparent: boolean;
  color: string;
  opacity: number;
}

export type DrawMode = 'brush' | 'line' | 'rectangle' | 'ellipse' | 'selection';

export interface CanvasSize {
  width: number;
  height: number;
}

export type CanvasPoint = [number, number];

export type CanvasLine = [number, number, number, number];

export type CanvasLineSerie = number[];

export type DrawType =
  | 'point'
  | 'line'
  | 'lineSerie'
  | 'rectangle'
  | 'ellipse'
  | 'background'
  | 'clear'
  | 'selection'
  | 'boundingSelection';

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
  dataSnapshot?: CanvasPoint | CanvasLine | CanvasLineSerie;
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

export interface DrawBackground extends DrawBase {
  type: 'background';
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

export interface DrawBoundingSelection extends DrawBase {
  type: 'boundingSelection';
  data: CanvasLine;
}

export type DrawEvent =
  | DrawPoint
  | DrawLine
  | DrawLineSerie
  | DrawRectangle
  | DrawEllipse
  | DrawBackground
  | DrawClear
  | DrawSelection
  | DrawBoundingSelection;

export type DrawEventAnimated = (DrawLine | DrawLineSerie | DrawRectangle | DrawEllipse) & { animate: boolean };

export interface DrawEventsBroadcast {
  animate: boolean;
  events: DrawEvent[];
}

export type DrawTransportAction = 'add' | 'remove' | 'translate' | 'resize';

export interface DrawTransportBase {
  action: DrawTransportAction;
}

export interface DrawTransportAdd extends DrawTransportBase {
  action: 'add';
  events: DrawEvent[];
}

export interface DrawTransportRemove extends DrawTransportBase {
  action: 'remove';
  eventsId: string[];
}

export interface DrawTransportTranslate extends DrawTransportBase {
  action: 'translate';
  eventsId: string[];
  translate: CanvasPoint;
}

export interface DrawTransportResize extends DrawTransportBase {
  action: 'resize';
  eventsId: string[];
  origin: [number, number];
  scale: [number, number];
}

export type DrawTransport = DrawTransportAdd | DrawTransportRemove | DrawTransportTranslate | DrawTransportResize;
