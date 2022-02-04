import { DrawEllipse, DrawEventAnimated, DrawLine, DrawLineSerie, DrawRectangle } from '../../cw.types';
import { buildBrushFrames, buildLineFrames } from './build-frames';
import { STEP_LENGTH } from './config';
import { smartConcatCanvasLineSeries, splitCanvasLine, splitCanvasLineSerie } from './split-or-concat-lines';

export const animateDrawLine = (event: DrawLine): DrawEventAnimated[] => {
  const result: DrawEventAnimated[] = buildLineFrames(splitCanvasLine(event.data)).map((data) => ({
    ...event,
    data,
    animate: true,
  }));
  result.push({ ...event, animate: false });
  return result;
};

export const animateDrawLineSerie = (event: DrawLineSerie): DrawEventAnimated[] => {
  const result = buildBrushFrames(splitCanvasLineSerie(event.data)).map((data) => ({ ...event, data, animate: true }));
  result.push({ ...event, animate: false });
  return result;
};

export const animateDrawRectangle = (event: DrawRectangle): DrawEventAnimated[] => {
  const [fromX, fromY, toX, toY] = event.data;
  const canvasLineSerie = smartConcatCanvasLineSeries(
    splitCanvasLine([fromX, fromY, toX, fromY]),
    splitCanvasLine([toX, fromY, toX, toY]),
    splitCanvasLine([toX, toY, fromX, toY]),
    splitCanvasLine([fromX, toY, fromX, fromY])
  );
  const result = buildBrushFrames(canvasLineSerie).map(
    (data) =>
      ({
        ...event,
        type: 'lineSerie',
        data,
        animate: true,
      } as DrawEventAnimated)
  );
  result.push({ ...event, animate: false });
  return result;
};

export const animateDrawEllipse = (event: DrawEllipse): DrawEventAnimated[] => {
  const [fromX, fromY, toX, toY] = event.data;
  // Ellipse perimeter approximation
  const perimeter = Math.PI * Math.sqrt((Math.pow(Math.abs(toX - fromX), 2) + Math.pow(Math.abs(toY - fromY), 2)) / 2);
  const stepsCount = perimeter / STEP_LENGTH;

  const result: DrawEventAnimated[] = [];
  for (let i = 0; i < stepsCount; i += 1) {
    result.push({ ...event, options: { ...event.options, angle: ((2 * Math.PI) / stepsCount) * i }, animate: true });
  }
  result.push({ ...event, animate: false });
  return result;
};
