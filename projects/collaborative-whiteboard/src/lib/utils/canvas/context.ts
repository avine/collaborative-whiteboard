import { getDefaultCanvasSize } from '../../cw.config';
import { CanvasLine, CanvasLineSerie, CanvasPoint, CanvasSize, DrawEvent, DrawOptions } from '../../cw.types';

interface ICanvasContext {
  drawPoint: (data: CanvasPoint, options: DrawOptions) => void;
  drawLine: (data: CanvasLine, options: DrawOptions) => void;
  drawLineSerie: (data: CanvasLineSerie, options: DrawOptions) => void;
  drawRect: (data: CanvasLine, options: DrawOptions) => void;
  drawFillRect: (data: CanvasLine, options: DrawOptions) => void;
  drawClear: (data: CanvasLine, options: DrawOptions) => void;
}

const getCanvasContextMethod: Record<DrawEvent['type'], keyof ICanvasContext> = {
  point: 'drawPoint',
  line: 'drawLine',
  lineSerie: 'drawLineSerie',
  rect: 'drawRect',
  fillRect: 'drawFillRect',
  clear: 'drawClear',
};

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

  handleEvent(event: DrawEvent) {
    this[getCanvasContextMethod[event.type]](event.data as any, event.options);
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

  drawRect([fromX, fromY, toX, toY]: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    const offset = this.getOffset(options);
    this.context.beginPath();
    this.context.rect(fromX + offset, fromY + offset, toX - fromX + offset, toY - fromY + offset);
    this.context.stroke();
  }

  drawFillRect(canvasLine: CanvasLine, options: DrawOptions) {
    this.applyDrawOptions(options);
    this.context.fillRect(...canvasLine);
  }

  drawClear(canvasLine: CanvasLine, _?: DrawOptions) { // Note: keep the second parameter for signature consistency
    this.context.clearRect(...canvasLine);
  }

  private applyDrawOptions(options: DrawOptions) {
    const rgba = `rgba(${options.color}, ${options.opacity})`;

    this.context.lineWidth = options.lineWidth;
    this.context.strokeStyle = rgba;
    this.context.fillStyle = rgba;
  }

  private getOffset(drawOptions: DrawOptions): number {
    return drawOptions.lineWidth % 2 === 1 ? 0.5 : 0;
  }
}
