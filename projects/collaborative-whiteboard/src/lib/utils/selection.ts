import { DEFAULT_OWNER } from '../cw.config';
import { DrawEvent } from '../cw.types';
import { SELECTION_SHIFT } from './canvas-context';
import { getBounding } from './canvas-context/canvas.context.utils';
import { getDrawEventUID } from './id';

export const getSelectionEvents = (events: DrawEvent[], owner = DEFAULT_OWNER): DrawEvent[] => {
  const selection: DrawEvent[] = events.length > 1 ? events.map((event) => ({ ...event, type: 'selection' })) : [];
  const lineWidthMax = events.reduce((max, { options: { lineWidth } }) => Math.max(max, lineWidth), 0);
  if (events.length) {
    selection.push({
      id: getDrawEventUID(),
      owner,
      type: 'boundingSelection',
      options: { lineWidth: lineWidthMax + 2 * SELECTION_SHIFT, opacity: 0, fillOpacity: 0, color: '0, 0, 0' },
      data: getBounding(...events.map(({ data }) => data)),
    });
  }
  return selection;
};
