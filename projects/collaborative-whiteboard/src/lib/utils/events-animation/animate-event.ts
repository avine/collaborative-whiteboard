import { DrawEllipse, DrawEventAnimated, DrawLine, DrawLineSerie, DrawRectangle } from '../../cw.types';
import { buildBrushFrames, buildLineFrames } from './build-draw-mode-frames';
import { mapCanvasLineToLineSerie, smartConcatCanvasLineSeries } from './map-line-and-line-serie';

export const animateDrawLineSerie = (event: DrawLineSerie): DrawEventAnimated[] => {
  const result = buildBrushFrames(event.data).map((data) => ({ ...event, data, animate: true }));
  result.push({ ...event, animate: false });
  return result;
};

export const animateDrawLine = (event: DrawLine): DrawEventAnimated[] => {
  const result: DrawEventAnimated[] = buildLineFrames(mapCanvasLineToLineSerie(event.data)).map((data) => ({
    ...event,
    data,
    animate: true,
  }));
  result.push({ ...event, animate: false });
  return result;
};

export const animateDrawRectangle = (event: DrawRectangle): DrawEventAnimated[] => {
  const [fromX, fromY, toX, toY] = event.data;
  const canvasLineSerie = smartConcatCanvasLineSeries(
    mapCanvasLineToLineSerie([fromX, fromY, toX, fromY]),
    mapCanvasLineToLineSerie([toX, fromY, toX, toY]),
    mapCanvasLineToLineSerie([toX, toY, fromX, toY]),
    mapCanvasLineToLineSerie([fromX, toY, fromX, fromY])
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
  const STEP = 5; // px

  const [fromX, fromY, toX, toY] = event.data;
  // Ellipse perimeter approximation
  const perimeter =
    2 * Math.PI * Math.sqrt((Math.pow(Math.abs(toX - fromX), 2) + Math.pow(Math.abs(toY - fromY), 2)) / 2);
  const stepsCount = perimeter / STEP;

  const result: DrawEventAnimated[] = [];
  for (let i = 0; i < stepsCount; i += 1) {
    result.push({ ...event, options: { ...event.options, angle: ((2 * Math.PI) / stepsCount) * i }, animate: true });
  }
  result.push({ ...event, animate: false });
  return result;
};
