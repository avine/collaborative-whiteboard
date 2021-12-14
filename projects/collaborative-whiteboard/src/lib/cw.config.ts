import { CanvasSize, DrawClear, DrawOptions } from './cw.types';

export const getDefaultColors = () => [
  '#EF5350',
  '#EC407A',
  '#AB47BC',
  '#7E57C2',
  '#5C6BC0',
  '#42A5F5',
  '#29B6F6',
  '#26C6DA',
  '#26A69A',
  '#66BB6A',
  '#9CCC65',
  '#D4E157',
  '#FFEE58',
  '#FFCA28',
  '#FFA726',
  '#FF7043',
  '#8D6E63',
  '#BDBDBD',
];

export const defaultColor = '#29B6F6';

export const getDefaultCanvasSize = (): CanvasSize => ({
  width: 300,
  height: 300,
});

export const getDefaultDrawOptions = (): DrawOptions => ({
  lineWidth: 4,
  strokeStyle: defaultColor,
});
