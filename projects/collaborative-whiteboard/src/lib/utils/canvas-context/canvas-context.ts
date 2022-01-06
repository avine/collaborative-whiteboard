import { getDefaultCanvasSize } from '../../cw.config';
import { CanvasLine, CanvasLineSerie, CanvasPoint, CanvasSize, DrawEvent, DrawOptions } from '../../cw.types';
import { ICanvasContext } from './canvas.context.types';
import { getCanvasContextHandler } from './canvas.context.utils';

export class CanvasContext implements ICanvasContext {
  private canvasSize = getDefaultCanvasSize();

  // TODO: use path2DMap to draw paths when possible...
  private path2DMap = new Map<string, Path2D>();

  constructor(private context: CanvasRenderingContext2D) {}

  applyCanvasSize(canvasSize: CanvasSize) {
    this.canvasSize = canvasSize;
    this.setCanvasSize();
    this.setContextDefault();

    // note: changing the canvas size will reset its context...
    this.resetPaths2D();
  }

  private setCanvasSize() {
    this.context.canvas.width = this.canvasSize.width;
    this.context.canvas.height = this.canvasSize.height;
  }

  private setContextDefault() {
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  resetPaths2D() {
    this.path2DMap.clear();
  }

  getSelectedEventsId(x: number, y: number): string[] {
    return Array.from(this.path2DMap.entries())
      .filter(([, path2D]) => this.context.isPointInPath(path2D, x, y))
      .map(([eventId]) => eventId);
  }

  handleEvent({ id, type, data, options }: DrawEvent) {
    const path2D = this[getCanvasContextHandler[type]](data as any, options as any);
    this.path2DMap.set(id, path2D);
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
    const w = toX - fromX + offset;
    const h = toY - fromY + offset;
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
    const shiftX = (toX - fromX) / 2;
    const shiftY = (toY - fromY) / 2;
    const x = fromX + shiftX;
    const y = fromY + shiftY;
    const radiusX = Math.abs(shiftX);
    const radiusY = Math.abs(shiftY);
    const angle = options.angle ?? 2 * Math.PI;

    const path2D = new Path2D();
    const stroke = new Path2D();
    path2D.addPath(stroke);
    stroke.ellipse(x, y, radiusX, radiusY, 0, 0, angle);
    this.applyDrawOptions(options, false);
    this.context.stroke(stroke);

    const isComplete = options.angle === undefined;
    if (isComplete && options.fillOpacity) {
      const fillRadiusX = Math.max(0, radiusX - options.lineWidth / 2);
      const fillRadiusY = Math.max(0, radiusY - options.lineWidth / 2);

      const fill = new Path2D();
      fill.ellipse(x, y, fillRadiusX, fillRadiusY, 0, 0, angle);
      path2D.addPath(fill);
      this.applyDrawOptions(options);
      this.context.fill(fill);
    }
    return path2D;
  }

  drawFillRect(canvasLine: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    const path2D = new Path2D();
    path2D.rect(...canvasLine);
    this.context.fill(path2D);
    return path2D;
  }

  // Note: keep the second parameter for signature consistency
  drawClear(canvasLine: CanvasLine, _?: DrawOptions) {
    this.context.clearRect(...canvasLine);
    // Note: return a Path2D also for consistency
    return new Path2D();
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
