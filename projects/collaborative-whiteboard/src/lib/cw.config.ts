import { CanvasSize, DrawBackground, DrawOptions } from './cw.types';

export const getDefaultDrawBackground = (): DrawBackground => ({ color: '', opacity: 1 });

// RGB colors
export const getDefaultColors = () => [
  '239, 83, 80',
  '236, 64, 122',
  '171, 71, 188',
  '126, 87, 194',
  '92, 107, 192',
  '66, 165, 245',
  '41, 182, 246',
  '38, 198, 218',
  '38, 166, 154',
  '102, 187, 106',
  '156, 204, 101',
  '212, 225, 87',
  '255, 238, 88',
  '255, 202, 40',
  '255, 167, 38',
  '255, 112, 67',
  '141, 110, 99',
  '189, 189, 189',
];

export const defaultColor = '41, 182, 246';

export const getDefaultCanvasSize = (): CanvasSize => ({
  width: 300,
  height: 300,
});

export const getDefaultDrawOptions = (): DrawOptions => ({
  lineWidth: 4,
  color: defaultColor,
  opacity: 1,
});
