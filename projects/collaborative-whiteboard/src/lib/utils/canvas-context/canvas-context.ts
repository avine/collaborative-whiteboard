import { getDefaultCanvasSize } from '../../cw.config';
import { CanvasLine, CanvasLineSerie, CanvasPoint, CanvasSize, DrawEvent, DrawOptions } from '../../cw.types';
import {
  BOUNDING_SELECTION_LINE_DASH,
  CANVAS_POINT_FAT,
  getBoundingSelectionDrawOptions,
  getSelectionDrawOptions,
  RESIZE_ACTION_WIDTH,
  SELECTION_LINE_DASH,
  SELECTION_SHIFT,
} from './canvas-context.config';
import {
  DrawEventAction,
  DrawEventInfo,
  ICanvasContext,
  ResizeAction,
  ResizeCorner,
  TranslateAction,
} from './canvas-context.types';
import { getBounding, getCanvasContextHandler, normalizeCanvasLine } from './canvas-context.utils';

export class CanvasContext implements ICanvasContext {
  private canvasSize = getDefaultCanvasSize();

  private drawEventInfos: DrawEventInfo[] = []; // TODO: use path2DMap to redraw paths when possible...

  private drawEventActions: DrawEventAction[] = [];

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
    switch (type) {
      case 'selection': {
        this.drawSelection(data, options);
        break;
      }
      case 'boundingSelection': {
        const actions = this.drawBoundingSelection(data as CanvasLine, options);
        this.drawEventActions.push(...actions.map((action) => ({ ...action, eventId } as DrawEventAction)));
        break;
      }
      default: {
        const info = this[getCanvasContextHandler[type]](data as any, options as any);
        if (info) {
          this.drawEventInfos.push({ ...info, eventId });
        }
        break;
      }
    }
  }

  drawPoint([x, y]: CanvasPoint, options: DrawOptions): Omit<DrawEventInfo, 'eventId'> {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const path2D = new Path2D();
    path2D.arc(x + offset, y + offset, 1, 0, Math.PI * 2, true);
    this.context.stroke(path2D);
    return {
      path2D,
      bounding: normalizeCanvasLine([
        x + offset - CANVAS_POINT_FAT,
        y + offset - CANVAS_POINT_FAT,
        x + offset + CANVAS_POINT_FAT,
        y + offset + CANVAS_POINT_FAT,
      ]),
    };
  }

  drawLine([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions): Omit<DrawEventInfo, 'eventId'> {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const path2D = new Path2D();
    path2D.moveTo(fromX + offset, fromY + offset);
    path2D.lineTo(toX + offset, toY + offset);
    this.context.stroke(path2D);
    return { path2D, bounding: normalizeCanvasLine([fromX + offset, fromY + offset, toX + offset, toY + offset]) };
  }

  drawLineSerie(serie: CanvasLineSerie, options: DrawOptions): Omit<DrawEventInfo, 'eventId'> {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    const path2D = new Path2D();
    path2D.moveTo(serie[0] + offset, serie[1] + offset);
    path2D.lineTo(serie[2] + offset, serie[3] + offset);
    for (let i = 4; i < serie.length; i = i + 2) {
      path2D.lineTo(serie[i] + offset, serie[i + 1] + offset);
    }
    this.context.stroke(path2D);
    return { path2D, bounding: getBounding(serie.map((n) => n + offset)) };
  }

  drawRectangle([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions): Omit<DrawEventInfo, 'eventId'> {
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
    return { path2D, bounding: normalizeCanvasLine([fromX + offset, fromY + offset, toX + offset, toY + offset]) };
  }

  drawEllipse([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions): Omit<DrawEventInfo, 'eventId'> {
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
    return { path2D, bounding: normalizeCanvasLine([fromX + offset, fromY + offset, toX + offset, toY + offset]) };
  }

  drawBackground(canvasLine: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    this.context.fillRect(...canvasLine);
  }

  // Note: keep the second parameter for signature consistency
  drawClear(canvasLine: CanvasLine, _?: DrawOptions) {
    this.context.clearRect(...canvasLine);
  }

  drawSelection(data: CanvasPoint | CanvasLine | CanvasLineSerie, eventDrawOptions: DrawOptions) {
    const [fromX, fromY, toX, toY] = getBounding(data);
    const selectionDrawOptions = getSelectionDrawOptions();
    this.applyDrawOptions(selectionDrawOptions);
    const offset = this.getOffset(selectionDrawOptions);
    const [x, y, w, h] = this.getSelectionRect([fromX, fromY, toX, toY], offset, eventDrawOptions.lineWidth);
    this.context.save();
    this.context.beginPath();
    this.context.rect(x, y, w, h);
    this.context.setLineDash(SELECTION_LINE_DASH);
    this.context.stroke();
    this.context.restore();
  }

  drawBoundingSelection(
    [fromX, fromY, toX, toY]: CanvasLine,
    eventDrawOptions: DrawOptions
  ): Omit<DrawEventAction, 'eventId'>[] {
    const selectionDrawOptions = getBoundingSelectionDrawOptions();
    this.applyDrawOptions(selectionDrawOptions);
    const offset = this.getOffset(selectionDrawOptions);
    const [x, y, w, h] = this.getSelectionRect([fromX, fromY, toX, toY], offset, eventDrawOptions.lineWidth);
    const translatePath = new Path2D();
    translatePath.rect(x, y, w, h);
    this.context.setLineDash(BOUNDING_SELECTION_LINE_DASH);
    this.context.stroke(translatePath);
    this.context.setLineDash([]);
    const bounding: CanvasLine = [fromX + offset, fromY + offset, toX + offset, toY + offset];
    const translateAction: Omit<TranslateAction, 'eventId'> = { path2D: translatePath, bounding, action: 'translate' };

    const a = RESIZE_ACTION_WIDTH; // Just an alias...
    const resizeAreas: Array<{ area: [number, number, number, number]; corner: ResizeCorner }> = [
      { area: [x - a, y - a, a, a], corner: 'topLeft' },
      { area: [x + w, y - a, a, a], corner: 'topRight' },
      { area: [x + w, y + h, a, a], corner: 'bottomRight' },
      { area: [x - a, y + h, a, a], corner: 'bottomLeft' },
    ];
    const resizeActions: Omit<ResizeAction, 'eventId'>[] = resizeAreas.map(({ area, corner }) => {
      const resizePath = new Path2D();
      resizePath.rect(...area);
      this.context.stroke(resizePath);
      this.context.fill(resizePath);
      return { path2D: resizePath, action: 'resize', bounding, corner };
    });

    return [translateAction, ...resizeActions];
  }

  getSelectedEventsIdInArea(canvasLine: CanvasLine): string[] {
    const [fromOuterX, fromOuterY, toOuterX, toOuterY] = normalizeCanvasLine(canvasLine);
    return this.drawEventInfos
      .filter(
        ({ bounding: [fromInnerX, fromInnerY, toInnerX, toInnerY] }) =>
          fromOuterX <= fromInnerX && toOuterX >= toInnerX && fromOuterY <= fromInnerY && toOuterY >= toInnerY
      )
      .map(({ eventId }) => eventId);
  }

  getSelectedEventsId(x: number, y: number): string[] {
    return this.drawEventInfos
      .filter(({ bounding: [fromX, fromY, toX, toY] }) => x >= fromX && x <= toX && y >= fromY && y <= toY)
      .map(({ eventId }) => eventId);
  }

  getSelectedAction(x: number, y: number): DrawEventAction | undefined {
    return this.drawEventActions.filter(({ path2D }) => this.context.isPointInPath(path2D, x, y))[0];
  }

  resetPaths() {
    this.drawEventInfos = [];
    this.drawEventActions = [];
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

  /**
   * @returns `CanvasPath.rect()` parameters as array `[x, y, w, h]`
   */
  private getSelectionRect(
    [fromX, fromY, toX, toY]: CanvasLine,
    offset: number,
    lineWidth: number
  ): [number, number, number, number] {
    const x = fromX + offset;
    const y = fromY + offset;
    const w = toX - fromX;
    const h = toY - fromY;

    const xFactor = w >= 0 ? 1 : -1;
    const yFactor = h >= 0 ? 1 : -1;

    const shift = Math.round(lineWidth / 2) + SELECTION_SHIFT;

    return [x - xFactor * shift, y - yFactor * shift, w + xFactor * 2 * shift, h + yFactor * 2 * shift];
  }
}
