import { Directive, ElementRef, HostListener, Input, NgZone, OnInit, Optional } from '@angular/core';

import { CwService } from '../../cw.service';
import { CanvasLine, CanvasPoint } from '../../cw.types';
import { CanvasContext, getSelectionMoveDrawOptions, ResizeAction } from '../../utils';

@Directive({
  selector: '[cwSelectionPreview]',
})
export class CwSelectionPreviewDirective implements OnInit {
  @Input() cwSelectionPreview = false;

  @Input() cwContext!: CanvasContext;

  @Input() cwContextResult!: CanvasContext;

  @HostListener('cwPointerStart', ['$event']) pointerStart([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (!this.cwSelectionPreview) {
      return;
    }
    const eventsId = this.cwContextResult.getSelectedEventsId(...original);
    if (eventsId.length) {
      this.skipUnselect = this.service?.addSelection(eventsId);
    }
    const action = this.cwContextResult.getSelectedAction(...original);
    if (action?.action === 'resize') {
      this.canResizeSelection = action;
    } else {
      this.canTranslateSelection = !!(action?.action === 'translate' || eventsId.length);
    }
  }

  @HostListener('cwPointerMove', ['$event']) pointerMove([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (!this.cwSelectionPreview) {
      return;
    }
    this.cwContext.drawClear(this.canvasSizeAsLine);
    if (this.canTranslateSelection) {
      this.ngZone.run(() => {
        const [fromX, fromY, toX, toY] = magnetized.slice(-4);
        this.service?.translateSelection(toX - fromX, toY - fromY);
      });
    } else if (this.canResizeSelection) {
      this.ngZone.run(() => {
        const { origin, scale } = this.getResizeConfig(magnetized);
        this.service?.resizeSelection(origin, scale);
      });
    } else {
      this.cwContext.drawRectangle(
        [...original.slice(0, 2), ...original.slice(-2)] as CanvasLine,
        getSelectionMoveDrawOptions()
      );
    }
  }

  @HostListener('cwPointerEnd', ['$event']) pointerEnd([magnetized, original]: [CanvasPoint, CanvasPoint]) {
    if (!this.cwSelectionPreview) {
      return;
    }
    this.cwContext.drawClear(this.canvasSizeAsLine);
    switch (original.length) {
      case 2: {
        if (this.skipUnselect) {
          break;
        }
        const eventsId = this.cwContextResult.getSelectedEventsId(...(original as CanvasPoint));
        if (eventsId.length) {
          this.service?.removeSelection(eventsId);
        } else {
          this.service?.clearSelection();
        }
        break;
      }
      default: {
        if (this.canTranslateSelection) {
          const [fromX, fromY, toX, toY] = [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine;
          this.service?.emitTranslatedSelection(toX - fromX, toY - fromY);
          break;
        }
        if (this.canResizeSelection) {
          const { origin, scale } = this.getResizeConfig(magnetized);
          this.service?.emitResizedSelection(origin, scale);
          break;
        }
        const canvasLine = [...original.slice(0, 2), ...original.slice(-2)] as CanvasLine;
        const eventsId = this.cwContextResult.getSelectedEventsIdInArea(canvasLine);
        if (eventsId.length) {
          this.service?.addSelection(eventsId);
        } else {
          this.service?.clearSelection();
        }
        break;
      }
    }
    this.skipUnselect = false;
    this.canTranslateSelection = false;
    this.canResizeSelection = undefined;
  }

  private skipUnselect = false;
  private canTranslateSelection = false;
  private canResizeSelection: ResizeAction | undefined = undefined;

  constructor(
    @Optional() private service: CwService,
    private canvasRef: ElementRef<HTMLCanvasElement>,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    console.log(1, this.cwContext);
  }

  private getResizeConfig(magnetized: number[]): { origin: CanvasPoint; scale: [number, number] } {
    const { bounding, corner } = this.canResizeSelection as ResizeAction;

    const [fromX, fromY, toX, toY] = bounding;

    const boundingOriginX = ['topRight', 'bottomRight'].includes(corner) ? fromX : toX;
    const boundingOriginY = ['bottomLeft', 'bottomRight'].includes(corner) ? fromY : toY;

    const [centerX, centerY] = this.getCanvasCenter('emit');
    const originX = Math.floor(boundingOriginX + centerX);
    const originY = Math.floor(boundingOriginY + centerY);

    const w = toX - fromX;
    const h = toY - fromY;

    const shiftRect = [...magnetized.slice(0, 2), ...magnetized.slice(-2)] as CanvasLine;
    const shiftW = shiftRect[2] - shiftRect[0];
    const shiftH = shiftRect[3] - shiftRect[1];

    const factorX = ['topRight', 'bottomRight'].includes(corner) ? 1 : -1;
    const factorY = ['bottomLeft', 'bottomRight'].includes(corner) ? 1 : -1;

    const scaleX = (w + shiftW * factorX) / w;
    const scaleY = (h + shiftH * factorY) / h;

    return { origin: [originX, originY], scale: [scaleX, scaleY] };
  }

  private getCanvasCenter(target: 'emit' | 'broadcast'): [number, number] {
    const factor = target === 'emit' ? -1 : 1;
    return [
      factor * Math.floor(this.canvasRef.nativeElement.width / 2),
      factor * Math.floor(this.canvasRef.nativeElement.height / 2),
    ];
  }

  get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height];
  }
}
