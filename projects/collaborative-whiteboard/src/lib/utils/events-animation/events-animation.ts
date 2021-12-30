import { DrawEvent, DrawEventAnimated } from '../../cw.types';
import { animateDrawEllipse, animateDrawLine, animateDrawLineSerie, animateDrawRectangle } from './animate-event';

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
      case 'rectangle': {
        result.push(...animateDrawRectangle(event));
        break;
      }
      case 'ellipse': {
        result.push(...animateDrawEllipse(event));
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
