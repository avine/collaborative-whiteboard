import { DrawEvent, DrawEventAnimated } from '../../cw.types';
import { animateDrawEllipse, animateDrawLine, animateDrawLineSerie, animateDrawRectangle } from './animate-event';

// Alternate implementation
/*type DrawTypeToAnimate = Extract<DrawType, 'line' | 'lineSerie' | 'rectangle' | 'ellipse'>;

export const animateDrawEventMap: Record<DrawTypeToAnimate, (event: any) => DrawEventAnimated[]> = {
  line: animateDrawLine,
  lineSerie: animateDrawLineSerie,
  rectangle: animateDrawRectangle,
  ellipse: animateDrawEllipse,
};

export const mapToDrawEventsAnimated = (events: DrawEvent[]): (DrawEvent | DrawEventAnimated)[] => {
  const result: (DrawEvent | DrawEventAnimated)[] = [];
  events.forEach((event) => {
    if (event.type in animateDrawEventMap) {
      result.push(...animateDrawEventMap[event.type as DrawTypeToAnimate](event));
    } else {
      result.push(event);
    }
  });
  return result;
};*/

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
