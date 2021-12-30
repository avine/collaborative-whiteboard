import { CanvasLine, CanvasLineSerie, DrawEvent, DrawEventAnimated, DrawLine, DrawLineSerie, DrawRect } from '../../cw.types';

const mapCanvasLineToLineSerie = (canvasLine: CanvasLine): CanvasLineSerie => {
  const DISTANCE_MIN = 30; // px
  const STEP = 10; // px

  const [fromX, fromY, toX, toY] = canvasLine;
  const distance = Math.sqrt(Math.pow(Math.abs(toX - fromX), 2) + Math.pow(Math.abs(toY - fromY), 2)); // Pythagore
  if (distance < DISTANCE_MIN) {
    return canvasLine;
  }

  const stepsCount = Math.floor(distance / STEP);
  const stepX = (toX - fromX) / stepsCount;
  const stepY = (toY - fromY) / stepsCount;

  const canvasLineSerie: CanvasLineSerie = [];
  for (let i = 0; i < stepsCount; i++) {
    canvasLineSerie.push(Math.round(fromX + i * stepX), Math.round(fromY + i * stepY));
  }
  canvasLineSerie.push(...canvasLine.slice(-2));
  return canvasLineSerie;
};

const animateCanvasLineSerie = (canvasLineSerie: CanvasLineSerie): CanvasLineSerie[] => {
  const result: CanvasLineSerie[] = [];
  for (let i = 4; i <= canvasLineSerie.length; i += 2) {
    result.push(canvasLineSerie.slice(0, i));
  }
  return result;
};

const smartConcatCanvasLineSeries = (...canvasLineSeries: CanvasLineSerie[]): CanvasLineSerie => {
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

const animateDrawLineSerie = (event: DrawLineSerie): DrawEventAnimated[] => {
  const result = animateCanvasLineSerie(event.data).map((data) => ({ ...event, data, animate: true }));
  result.push({ ...event, animate: false });
  return result;
};

const animateDrawLine = (event: DrawLine): DrawEventAnimated[] => {
  return animateDrawLineSerie({ ...event, type: 'lineSerie', data: mapCanvasLineToLineSerie(event.data) });
};

const animateDrawRect = (event: DrawRect): DrawEventAnimated[] => {
  const [fromX, fromY, toX, toY] = event.data;
  const canvasLineSerie = smartConcatCanvasLineSeries(
    mapCanvasLineToLineSerie([fromX, fromY, toX, fromY]),
    mapCanvasLineToLineSerie([toX, fromY, toX, toY]),
    mapCanvasLineToLineSerie([toX, toY, fromX, toY]),
    mapCanvasLineToLineSerie([fromX, toY, fromX, fromY])
  );
  const result = animateCanvasLineSerie(canvasLineSerie).map((data) => ({
    ...event,
    type: 'lineSerie',
    data,
    animate: true,
  } as DrawEventAnimated));
  result.push({ ...event, animate: false });
  return result;
};

export const mapToDrawEventsAnimated = (events: DrawEvent[]): (DrawEvent | DrawEventAnimated)[] => {
  const result: (DrawEvent | DrawEventAnimated)[] = [];
  events.forEach((event) => {
    switch (event.type) {
      case 'line': {
        result.push(...animateDrawLine(event));
        break;
      }
      case 'lineSerie': {
        result.push(...animateDrawLineSerie(event));
        break;
      }
      case 'rect': {
        result.push(...animateDrawRect(event));
        break;
      }
      default: {
        result.push(event);
        break;
      }
    }
  });
  return result;
};

export const isDrawEventAnimated = (event: DrawEvent | DrawEventAnimated): event is DrawEventAnimated => {
  const animate: keyof DrawEventAnimated = 'animate';
  return animate in event && [true, false].includes(event[animate]);
};
