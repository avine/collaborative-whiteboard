export type IconAlias =
  | 'fillBackground'
  | 'palette'
  | 'brush'
  | 'line'
  | 'rect'
  | 'arc'
  | 'undo'
  | 'redo'
  | 'cut'
  | 'undoAll'
  | 'guides'
  | 'redraw'
  | 'expand'
  | 'collapse'
  | 'drag'
  | 'dispose'
  | 'download';

export interface IconConfig {
  viewBox: string;
  d: string;
}

export type IconsMap = Record<IconAlias, IconConfig>;
