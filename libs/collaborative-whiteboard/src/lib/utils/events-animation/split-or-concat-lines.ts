import { CanvasLine, CanvasLineSerie } from '../../cw.types';
import { MIN_PATH_LENGTH, STEP_LENGTH } from './config';

const getDiagonal = ([fromX, fromY, toX, toY]: CanvasLine): number =>
  Math.sqrt(Math.pow(Math.abs(toX - fromX), 2) + Math.pow(Math.abs(toY - fromY), 2)); // Pythagore

/**
 * Split a straight line into several segments
 */
export const splitCanvasLine = (canvasLine: CanvasLine): CanvasLineSerie => {
  const pathLength = getDiagonal(canvasLine);
  if (pathLength < MIN_PATH_LENGTH) {
    return canvasLine;
  }

  const stepsCount = Math.floor(pathLength / STEP_LENGTH);
  const [fromX, fromY, toX, toY] = canvasLine;
  const stepX = (toX - fromX) / stepsCount;
  const stepY = (toY - fromY) / stepsCount;

  const round = (n: number) => Math.round(n * 10) / 10;

  const canvasLineSerie: CanvasLineSerie = [];
  for (let i = 0; i < stepsCount; i++) {
    canvasLineSerie.push(round(fromX + i * stepX), round(fromY + i * stepY));
  }
  canvasLineSerie.push(...canvasLine.slice(-2));
  return canvasLineSerie;
};

export const splitCanvasLineSerie = (serie: CanvasLineSerie): CanvasLineSerie => {
  const result: CanvasLineSerie = [];
  for (let i = 2; i < serie.length; i += 2) {
    const split = splitCanvasLine([serie[i - 2], serie[i - 1], serie[i], serie[i + 1]]);
    result.push(...(i === 2 ? split : split.slice(2)));
  }
  return result;
};

export const smartConcatCanvasLineSeries = (...canvasLineSeries: CanvasLineSerie[]): CanvasLineSerie => {
  const result: CanvasLineSerie = canvasLineSeries[0];
  for (let i = 1; i < canvasLineSeries.length; i += 1) {
    const prevSerie = canvasLineSeries[i - 1];
    const currSerie = canvasLineSeries[i];

    const [lastPrevX, lastPrevY] = prevSerie.slice(-2);
    const [firstCurrX, firstCurrY] = currSerie.slice(0, 2);

    result.push(...(firstCurrX === lastPrevX && firstCurrY === lastPrevY ? currSerie.slice(2) : currSerie));
  }
  return result;
};
