import { getDefaultCanvasSize } from '../../cw.config';
import { CanvasLine, CanvasLineSerie, CanvasPoint, CanvasSize, DrawEvent, DrawOptions } from '../../cw.types';
import { getSelectionDrawOptions, SELECTION_LINE_DASH, SELECTION_SHIFT } from './canvas-context.config';
import { DrawEventPath, DrawSelectionPath, ICanvasContext, SelectedAction } from './canvas.context.types';
import { getBoundingRect, getCanvasContextHandler } from './canvas.context.utils';

export class CanvasContext implements ICanvasContext {
  private canvasSize = getDefaultCanvasSize();

  private drawEventPaths: DrawEventPath[] = []; // TODO: use path2DMap to draw paths when possible...

  private drawSelectionPaths: DrawSelectionPath[] = [];

  constructor(private context: CanvasRenderingContext2D) {}

  applyCanvasSize(canvasSize: CanvasSize) {
    this.canvasSize = canvasSize;
    this.setCanvasSize();
    this.setContextDefault();

    // Note: changing the canvas size will reset its context.
    this.resetPaths();
  }

  private setCanvasSize() {
    this.context.canvas.width = this.canvasSize.width;
    this.context.canvas.height = this.canvasSize.height;
  }

  private setContextDefault() {
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  handleEvent({ id: eventId, type, data, options }: DrawEvent) {
    if (type === 'selection') {
      const actions = this.drawSelection(data, options);
      this.drawSelectionPaths.push(...actions.map((action) => ({ ...action, eventId })));
    } else {
      const path2D = this[getCanvasContextHandler[type]](data as any, options as any);
      if (path2D) {
        this.drawEventPaths.push({ path2D, eventId });
      }
    }
  }

  drawPoint([x, y]: CanvasPoint, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const path2D = new Path2D();
    path2D.arc(x + offset, y + offset, 1, 0, Math.PI * 2, true);
    this.context.stroke(path2D);
    return path2D;
  }

  drawLine([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const path2D = new Path2D();
    path2D.moveTo(fromX + offset, fromY + offset);
    path2D.lineTo(toX + offset, toY + offset);
    this.context.stroke(path2D);
    return path2D;
  }

  drawLineSerie(serie: CanvasLineSerie, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const path2D = new Path2D();
    path2D.moveTo(serie[0] + offset, serie[1] + offset);
    path2D.lineTo(serie[2] + offset, serie[3] + offset);
    for (let i = 4; i < serie.length; i = i + 2) {
      path2D.lineTo(serie[i] + offset, serie[i + 1] + offset);
    }
    this.context.stroke(path2D);
    return path2D;
  }

  drawRectangle([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const x = fromX + offset;
    const y = fromY + offset;
    const w = toX - fromX;
    const h = toY - fromY;
    const path2D = new Path2D();

    const stroke = new Path2D();
    stroke.rect(x, y, w, h);
    path2D.addPath(stroke);
    this.context.stroke(stroke);

    if (options.fillOpacity) {
      const xFactor = w >= 0 ? 1 : -1;
      const yFactor = h >= 0 ? 1 : -1;
      const fill = new Path2D();
      fill.rect(
        x + (xFactor * options.lineWidth) / 2,
        y + (yFactor * options.lineWidth) / 2,
        w - xFactor * options.lineWidth,
        h - yFactor * options.lineWidth
      );
      path2D.addPath(fill);
      this.context.fill(fill);
    }
    return path2D;
  }

  drawEllipse([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    const shiftX = Math.round((toX - fromX) / 2);
    const shiftY = Math.round((toY - fromY) / 2);
    const x = fromX + shiftX;
    const y = fromY + shiftY;
    const radiusX = Math.abs(shiftX);
    const radiusY = Math.abs(shiftY);
    const angle = options.angle ?? 2 * Math.PI;
    const offset = this.getOffset(options);

    const path2D = new Path2D();
    const stroke = new Path2D();
    path2D.addPath(stroke);
    stroke.ellipse(x + offset, y + offset, radiusX, radiusY, 0, 0, angle);
    this.applyDrawOptions(options, false);
    this.context.stroke(stroke);

    const isComplete = options.angle === undefined;
    if (isComplete && options.fillOpacity) {
      const fillRadiusX = Math.max(0, radiusX - options.lineWidth / 2);
      const fillRadiusY = Math.max(0, radiusY - options.lineWidth / 2);

      const fill = new Path2D();
      fill.ellipse(x + offset, y + offset, fillRadiusX, fillRadiusY, 0, 0, angle);
      path2D.addPath(fill);
      this.applyDrawOptions(options);
      this.context.fill(fill);
    }
    return path2D;
  }

  drawFillBackground(canvasLine: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    this.context.fillRect(...canvasLine);
  }

  // Note: keep the second parameter for signature consistency
  drawClear(canvasLine: CanvasLine, _?: DrawOptions) {
    this.context.clearRect(...canvasLine);
  }

  drawSelection(
    data: CanvasPoint | CanvasLine | CanvasLineSerie,
    eventDrawOptions: DrawOptions
  ): Omit<DrawSelectionPath, 'eventId'>[] {
    const [fromX, fromY, toX, toY] = getBoundingRect(data);
    const selectionDrawOptions = getSelectionDrawOptions();
    this.applyDrawOptions(selectionDrawOptions);
    const offset = this.getOffset(selectionDrawOptions);
    const x = fromX + offset;
    const y = fromY + offset;
    const w = toX - fromX;
    const h = toY - fromY;
    const xFactor = w >= 0 ? 1 : -1;
    const yFactor = h >= 0 ? 1 : -1;
    const shift = Math.round(eventDrawOptions.lineWidth / 2) + SELECTION_SHIFT;

    const select = new Path2D();
    select.rect(x - xFactor * shift, y - yFactor * shift, w + xFactor * 2 * shift, h + yFactor * 2 * shift);
    this.context.setLineDash(SELECTION_LINE_DASH);
    this.context.stroke(select);
    this.context.setLineDash([]);
    return [{ path2D: select, action: 'select' }];
  }

  // !FIXME: need to verify performance on this method...
  getSelectedDrawEventsIdInArea(canvasLine: CanvasLine): string[] {
    const fromX = Math.min(canvasLine[0], canvasLine[2]);
    const toX = Math.max(canvasLine[0], canvasLine[2]);
    const fromY = Math.min(canvasLine[1], canvasLine[3]);
    const toY = Math.max(canvasLine[1], canvasLine[3]);
    const eventsId = new Set<string>();
    for (let x = fromX; x <= toX; x++) {
      for (let y = fromY; y <= toY; y++) {
        this.getSelectedDrawEventsId(x, y).forEach((eventId) => eventsId.add(eventId));
      }
    }
    return Array.from(eventsId);
  }

  getSelectedDrawEventsId(x: number, y: number): string[] {
    return this.drawEventPaths
      .filter(({ path2D }) => this.context.isPointInPath(path2D, x, y))
      .map(({ eventId }) => eventId);
  }

  // !FIXME: est-ce qu'on devrait pas ne retourner qu'une seule action ?
  getSelectedActions(x: number, y: number): SelectedAction[] {
    return this.drawSelectionPaths
      .filter(({ path2D }) => this.context.isPointInPath(path2D, x, y))
      .map(({ eventId, action }) => ({ eventId, action }));
  }

  resetPaths() {
    this.drawEventPaths = [];
    this.drawSelectionPaths = [];
  }

  private applyDrawOptions({ color, opacity, fillOpacity, lineWidth }: DrawOptions, withFillStyle = true) {
    this.context.lineWidth = lineWidth;
    this.context.strokeStyle = `rgba(${color}, ${opacity})`;
    if (withFillStyle) {
      this.context.fillStyle = `rgba(${color}, ${fillOpacity})`;
    }
  }

  private getOffset(drawOptions: DrawOptions): number {
    return drawOptions.lineWidth % 2 === 1 ? 0.5 : 0;
  }
}
