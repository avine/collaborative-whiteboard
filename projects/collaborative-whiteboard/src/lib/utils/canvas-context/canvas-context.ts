import { getDefaultCanvasSize } from '../../cw.config';
import { CanvasLine, CanvasLineSerie, CanvasPoint, CanvasSize, DrawEvent, DrawOptions } from '../../cw.types';
import { ICanvasContext } from './canvas.context.types';
import { getCanvasContextHandler } from './canvas.context.utils';

export class CanvasContext implements ICanvasContext {
  private canvasSize = getDefaultCanvasSize();

  constructor(private context: CanvasRenderingContext2D) {}

  applyCanvasSize(canvasSize: CanvasSize) {
    this.canvasSize = canvasSize;
    this.setCanvasSize();
    this.setContextDefault(); // note: changing the canvas size will reset its context...
  }

  private setCanvasSize() {
    this.context.canvas.width = this.canvasSize.width;
    this.context.canvas.height = this.canvasSize.height;
  }

  private setContextDefault() {
    this.context.lineCap = 'round';
    this.context.lineJoin = 'round';
  }

  handleEvent({ type, data, options }: DrawEvent) {
    this[getCanvasContextHandler[type]](data as any, options as any);
  }

  drawPoint([x, y]: CanvasPoint, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    this.context.beginPath();
    this.context.arc(x + offset, y + offset, 1, 0, Math.PI * 2, true);
    this.context.stroke();
  }

  drawLine([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    this.context.beginPath();
    this.context.moveTo(fromX + offset, fromY + offset);
    this.context.lineTo(toX + offset, toY + offset);
    this.context.stroke();
  }

  drawLineSerie(serie: CanvasLineSerie, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    this.context.beginPath();
    this.context.moveTo(serie[0] + offset, serie[1] + offset);
    this.context.lineTo(serie[2] + offset, serie[3] + offset);
    for (let i = 4; i < serie.length; i = i + 2) {
      this.context.lineTo(serie[i] + offset, serie[i + 1] + offset);
    }
    this.context.stroke();
  }

  drawRectangle([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    const offset = this.getOffset(options);
    const x = fromX + offset;
    const y = fromY + offset;
    const w = toX - fromX + offset;
    const h = toY - fromY + offset;

    this.applyDrawOptions(options);

    this.context.strokeRect(x, y, w, h);

    if (options.fillOpacity) {
      this.context.fillRect(
        x + options.lineWidth / 2,
        y + options.lineWidth / 2,
        w - options.lineWidth,
        h - options.lineWidth
      );
    }
  }

  drawEllipse([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    const shiftX = (toX - fromX) / 2;
    const shiftY = (toY - fromY) / 2;
    const x = fromX + shiftX;
    const y = fromY + shiftY;
    const radiusX = Math.abs(shiftX);
    const radiusY = Math.abs(shiftY);
    const angle = options.angle ?? 2 * Math.PI;

    this.applyDrawOptions(options, false);
    this.context.beginPath();
    this.context.ellipse(x, y, radiusX, radiusY, 0, 0, angle);
    this.context.stroke();

    const isComplete = options.angle === undefined;
    if (isComplete && options.fillOpacity) {
      const fillRadiusX = Math.max(0, radiusX - options.lineWidth / 2);
      const fillRadiusY = Math.max(0, radiusY - options.lineWidth / 2);

      this.applyDrawOptions(options);
      this.context.beginPath();
      this.context.ellipse(x, y, fillRadiusX, fillRadiusY, 0, 0, angle);
      this.context.fill();
    }
  }

  drawFillRect(canvasLine: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    this.context.fillRect(...canvasLine);
  }

  drawClear(canvasLine: CanvasLine, _?: DrawOptions) {
    // Note: keep the second parameter for signature consistency
    this.context.clearRect(...canvasLine);
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
