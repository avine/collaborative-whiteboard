import { Directive, ElementRef, HostListener, Input } from '@angular/core';

import { DEFAULT_DRAW_MODE, getDefaultDrawOptions } from '../../cw.config';
import { CanvasLine, CanvasPoint } from '../../cw.types';
import { CanvasContext } from '../../utils';

@Directive({
  selector: '[cwEmitPreview]',
})
export class CwEmitPreviewDirective {
  @Input() cwEmitPreview = false;

  @Input() cwDrawMode = DEFAULT_DRAW_MODE;

  @Input() cwDrawOptions = getDefaultDrawOptions();

  @Input() cwContext!: CanvasContext;

  @HostListener('cwPointerStart', ['$event']) pointerStart([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (!this.cwEmitPreview) {
      return;
    }
    this.cwContext.drawPoint(magnetized, this.cwDrawOptions);
  }

  @HostListener('cwPointerMove', ['$event']) pointerMove([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (!this.cwEmitPreview) {
      return;
    }
    this.cwContext.drawClear(this.canvasSizeAsLine);
    switch (this.cwDrawMode) {
      case 'brush': {
        this.cwContext.drawLineSerie(magnetized, this.cwDrawOptions);
        break;
      }
      case 'line': {
        this.cwContext.drawLine([...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine, this.cwDrawOptions);
        break;
      }
      case 'rectangle': {
        this.cwContext.drawRectangle(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine,
          this.cwDrawOptions
        );
        break;
      }
      case 'ellipse': {
        this.cwContext.drawEllipse(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine,
          this.cwDrawOptions
        );
        break;
      }
    }
  }

  @HostListener('cwPointerEnd', ['$event']) pointerEnd([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (!this.cwEmitPreview) {
      return;
    }
    this.cwContext.drawClear(this.canvasSizeAsLine);
  }

  constructor(private canvasRef: ElementRef<HTMLCanvasElement>) {}

  get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height];
  }
}
