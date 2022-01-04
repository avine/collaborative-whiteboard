import { CanvasSize, DrawMode, DrawOptions, FillBackground, Owner } from './cw.types';

export const DEFAULT_OWNER: Owner = 'guest';

export const DEFAULT_DRAW_MODE: DrawMode = 'brush';

export const getDefaultFillBackground = (owner: Owner = DEFAULT_OWNER): FillBackground => ({
  owner,
  transparent: true,
  color: '',
  opacity: 1,
});

// Colors palette: https://material.io/design/color/the-color-system.html#tools-for-picking-colors

// RGB colors (material 400)
export const getDefaultColors = () => [
  '239, 83, 80',
  '236, 64, 122',
  '171, 71, 188',
  '126, 87, 194',
  '92, 107, 192',
  '66, 165, 245',
  '129, 212, 250',
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

export const DEFAULT_COLOR = '66, 165, 245';

// RGB colors (material 800)
export const getDefaultFillBackgroundColor = () => [
  '198, 40, 40',
  '73, 20, 86',
  '106, 27, 154',
  '69, 39, 160',
  '40, 53, 147',
  '21, 101, 192',
  '2, 119, 189',
  '0, 131, 143',
  '0, 105, 92',
  '46, 125, 50',
  '85, 139, 47',
  '158, 157, 36',
  '249, 168, 37',
  '255, 143, 0',
  '239, 108, 0',
  '216, 67, 21',
  '78, 52, 46',
  '66, 66, 66',
];

export const getDefaultCanvasSize = (): CanvasSize => ({
  width: 300,
  height: 300,
});

export const getDefaultDrawOptions = (): DrawOptions => ({
  lineWidth: 4,
  color: DEFAULT_COLOR,
  opacity: 1,
  fillOpacity: 0,
});
