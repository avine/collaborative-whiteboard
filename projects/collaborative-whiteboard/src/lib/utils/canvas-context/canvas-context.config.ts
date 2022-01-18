import { DrawOptions } from '../../cw.types';

export const getSelectionDrawOptions = (): DrawOptions => ({
  lineWidth: 1,
  color: '160, 160, 160',
  opacity: 0.85,
  fillOpacity: 0,
});

export const getBoundingSelectionDrawOptions = (): DrawOptions => ({
  lineWidth: 1,
  color: '160, 160, 160',
  opacity: 1,
  fillOpacity: 0.5,
});

export const getSelectionMoveDrawOptions = (): DrawOptions => ({
  lineWidth: 1,
  color: '160, 160, 160',
  opacity: 0.7,
  fillOpacity: 0.1,
});

export const SELECTION_SHIFT = 3;

export const SELECTION_LINE_DASH = [9, 6];

export const BOUNDING_SELECTION_LINE_DASH = [2, 3];

export const RESIZE_ACTION_WIDTH = 10;
