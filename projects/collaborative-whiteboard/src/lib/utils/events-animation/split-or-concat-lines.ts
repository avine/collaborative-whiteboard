import { CanvasLine, CanvasLineSerie } from '../../cw.types';

const DISTANCE_MIN = 30; // px
const STEP = 5; // px

const getDiagonal = ([fromX, fromY, toX, toY]: CanvasLine): number =>
  Math.sqrt(Math.pow(Math.abs(toX - fromX), 2) + Math.pow(Math.abs(toY - fromY), 2)); // Pythagore

/**
 * Split a straight line into several segments
 */
export const splitCanvasLine = (canvasLine: CanvasLine): CanvasLineSerie => {
  const distance = getDiagonal(canvasLine);
  if (distance < DISTANCE_MIN) {
    return canvasLine;
  }

  const stepsCount = Math.floor(distance / STEP);
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
