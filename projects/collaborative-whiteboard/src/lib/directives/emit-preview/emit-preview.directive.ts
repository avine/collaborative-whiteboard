import { Directive, HostListener, Input } from '@angular/core';

import { DEFAULT_DRAW_MODE, getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import { CanvasLine, CanvasPoint } from '../../cw.types';
import { CanvasContext } from '../../utils';

@Directive({
  selector: '[cwEmitPreview]',
})
export class CwEmitPreviewDirective {
  @Input() cwCanvasSize = getDefaultCanvasSize();

  @Input() cwContextOwner!: CanvasContext;

  @Input() cwDrawMode = DEFAULT_DRAW_MODE;

  @Input() cwDrawOptions = getDefaultDrawOptions();

  @HostListener('cwPointerStart', ['$event']) pointerStart([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (this.isDisabled) {
      return;
    }
    this.cwContextOwner.drawPoint(magnetized, this.cwDrawOptions); // ! FIXME: is it better not to draw this point ?
  }

  @HostListener('cwPointerMove', ['$event']) pointerMove([magnetized, original]: [number[], number[]]) {
    if (this.isDisabled) {
      return;
    }
    this.cwContextOwner.drawClear(this.canvasSizeAsLine);
    switch (this.cwDrawMode) {
      case 'brush': {
        this.cwContextOwner.drawLineSerie(magnetized, this.cwDrawOptions);
        break;
      }
      case 'line': {
        this.cwContextOwner.drawLine(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine,
          this.cwDrawOptions
        );
        break;
      }
      case 'rectangle': {
        this.cwContextOwner.drawRectangle(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine,
          this.cwDrawOptions
        );
        break;
      }
      case 'ellipse': {
        this.cwContextOwner.drawEllipse(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine,
          this.cwDrawOptions
        );
        break;
      }
    }
  }

  @HostListener('cwPointerEnd', ['$event']) pointerEnd([magnetized, original]: [number[], number[]]) {
    if (this.isDisabled) {
      return;
    }
    this.cwContextOwner.drawClear(this.canvasSizeAsLine);
  }

  private get isDisabled() {
    return this.cwDrawMode === 'selection';
  }

  private get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.cwCanvasSize.width, this.cwCanvasSize.height];
  }
}
