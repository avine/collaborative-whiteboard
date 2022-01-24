import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { DEFAULT_DRAW_MODE, DEFAULT_OWNER, getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import { CanvasLine, CanvasPoint, DrawEvent, DrawEventsBroadcast, DrawOptions, DrawType } from '../../cw.types';
import { PointerSensitivityOrigin } from '../../directives';
import { CanvasContext, getDrawEventUID, inferBasicDrawType, isEmptyCanvasLine, translateEvent } from '../../utils';

@Component({
  selector: 'cw-canvas',
  templateUrl: './canvas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwCanvasComponent implements OnChanges, AfterViewInit {
  @Input() owner = DEFAULT_OWNER;

  @Input() drawMode = DEFAULT_DRAW_MODE;

  @Input() canvasSize = getDefaultCanvasSize();

  @Input() showGuides = true;

  @Input() broadcast!: DrawEventsBroadcast;

  @Input() drawOptions = getDefaultDrawOptions();

  @Input() pointerMagnet = 0;

  @Input() drawDisabled = false;

  @Output() draw = new EventEmitter<DrawEvent>();

  @ViewChild('canvasResult') canvasResultRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasEmit') canvasEmitRef!: ElementRef<HTMLCanvasElement>;

  contextResult!: CanvasContext;
  contextEmit!: CanvasContext;

  ngOnChanges({ canvasSize }: SimpleChanges) {
    // Note: Skip the `.firstChange` because `this.context*` is not yet available
    if (canvasSize?.currentValue && !canvasSize.firstChange) {
      this.applyCanvasSize();
    }
  }

  ngAfterViewInit() {
    this.initContext();
    this.applyCanvasSize();
  }

  private initContext() {
    const contextResult = this.canvasResultRef.nativeElement?.getContext('2d');
    const contextEmit = this.canvasEmitRef.nativeElement?.getContext('2d');
    if (!contextResult || !contextEmit) {
      console.error('Canvas NOT supported!');
      return;
    }
    this.contextResult = new CanvasContext(contextResult);
    this.contextEmit = new CanvasContext(contextEmit);
  }

  private applyCanvasSize() {
    this.contextResult.applyCanvasSize(this.canvasSize);
    this.contextEmit.applyCanvasSize(this.canvasSize);
  }

  handleResult(event: DrawEvent) {
    if ((event.type === 'fillBackground' || event.type === 'clear') && isEmptyCanvasLine(event.data)) {
      this.contextResult.handleEvent({ ...event, data: this.canvasSizeAsLine });
    } else {
      this.contextResult.handleEvent(event);
    }
  }

  get pointerMagnetShift(): CanvasPoint {
    if (!this.pointerMagnet) {
      return [0, 0];
    }
    return [
      Math.round((this.canvasSize.width / 2) % this.pointerMagnet),
      Math.round((this.canvasSize.height / 2) % this.pointerMagnet),
    ];
  }

  get pointerSensitivity() {
    const lineWidthRatio = Math.round(this.drawOptions.lineWidth / 3);
    if (this.pointerMagnet !== 0) {
      return Math.min(this.pointerMagnet, lineWidthRatio);
    }
    const SENSITIVITY_MIN = 3;
    const SENSITIVITY_MAX = 9;
    return Math.min(Math.max(SENSITIVITY_MIN, lineWidthRatio), SENSITIVITY_MAX);
  }

  get pointerSensitivityOrigin(): PointerSensitivityOrigin {
    return this.drawMode === 'brush' ? 'previous' : 'first';
  }

  pointerEnd(magnetized: number[], original: number[]) {
    if (this.drawMode === 'selection') {
      return;
    }
    let event: DrawEvent | undefined = undefined;
    switch (this.drawMode) {
      case 'brush': {
        event = this.getCompleteEvent(magnetized, this.drawOptions);
        break;
      }
      case 'line': {
        event = this.getCompleteEvent([...magnetized.slice(0, 2), ...magnetized.slice(-2)], this.drawOptions);
        break;
      }
      case 'rectangle': {
        event = this.getCompleteEvent(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)],
          this.drawOptions,
          'rectangle'
        );
        break;
      }
      case 'ellipse': {
        event = this.getCompleteEvent(
          [...magnetized.slice(0, 2), ...magnetized.slice(-2)],
          this.drawOptions,
          'ellipse'
        );
        break;
      }
    }
    this.handleResult(event);
    this.draw.emit(translateEvent(event, ...this.getCanvasCenter('emit')));
  }

  private getCompleteEvent(data: number[], options: DrawOptions, forceDrawType?: DrawType): DrawEvent {
    return {
      id: getDrawEventUID(),
      owner: this.owner,
      type: forceDrawType ?? inferBasicDrawType(data.length),
      data,
      options: { ...options }, // Prevent `drawOptions` mutation from outside
    } as DrawEvent;
  }

  private getCanvasCenter(target: 'emit' | 'broadcast'): [number, number] {
    const factor = target === 'emit' ? -1 : 1;
    return [factor * Math.floor(this.canvasSize.width / 2), factor * Math.floor(this.canvasSize.height / 2)];
  }

  get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasSize.width, this.canvasSize.height];
  }

  redraw() {
    this.contextResult.resetPaths();
  }
}
