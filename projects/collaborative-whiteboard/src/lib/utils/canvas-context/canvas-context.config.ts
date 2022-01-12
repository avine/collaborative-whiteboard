import { DrawOptions } from '../../cw.types';

export const getSelectionDrawOptions = (): DrawOptions => ({
  lineWidth: 1,
  color: '160, 160, 160',
  opacity: 1,
  fillOpacity: 0,
});

export const getSelectionMoveDrawOptions = (): DrawOptions => ({
  lineWidth: 1,
  color: '160, 160, 160',
  opacity: 0.7,
  fillOpacity: 0.1,
});

export const SELECTION_SHIFT = 3;

export const SELECTION_LINE_DASH = [9, 6];
