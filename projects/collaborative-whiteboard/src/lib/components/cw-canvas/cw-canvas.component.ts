import { DOCUMENT } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import { CanvasLine, CanvasLineSerie, CanvasPoint, DrawEvent, DrawEventsBroadcast, DrawOptions } from '../../cw.types';
import { getClearEvent, keepDrawEventsAfterClearEvent } from '../../cw.utils';
import { applyOn } from './cw-canvas.utils';

@Component({
  selector: 'cw-canvas',
  templateUrl: './cw-canvas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwCanvasComponent implements OnChanges, AfterViewInit {
  @Input() canvasSize = getDefaultCanvasSize();

  @Input() showGuides = true;

  @Input() broadcast!: DrawEventsBroadcast;

  @Input() drawOptions = getDefaultDrawOptions();

  @Input() drawDisabled = false;

  @Output() draw = new EventEmitter<DrawEvent>();

  @ViewChild('canvasDraw') canvasDrawRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasPreview') canvasPreviewRef!: ElementRef<HTMLCanvasElement>;

  private contextDraw!: CanvasRenderingContext2D;

  private contextPreview!: CanvasRenderingContext2D;

  private broadcastId = 0;

  private broadcastBuffer: DrawEvent[] = [];

  private isDrawStarted = false;

  constructor(@Inject(DOCUMENT) private document: Document, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnChanges({ canvasSize, broadcast }: SimpleChanges) {
    // Note: Skip the `.firstChange` because `this.context` is not yet available
    if (canvasSize?.currentValue && !canvasSize.firstChange) {
      this.applyCanvasSize();
    }
    if (broadcast?.currentValue && !broadcast.firstChange) {
      this.handleBroadcast();
    }
  }

  ngAfterViewInit() {
    this.applyCanvasSize();
    this.initContext();

    if (this.broadcast) {
      this.handleBroadcast();
    }
  }

  private applyCanvasSize() {
    applyOn([this.canvasDrawRef.nativeElement, this.canvasPreviewRef.nativeElement], (canvas) => {
      canvas.width = this.canvasSize.width;
      canvas.height = this.canvasSize.height;
    });

    if (this.contextDraw) {
      // Changing the canvas size will reset its context...
      this.setDefaultContext();
    }
  }

  private initContext() {
    if (this.canvasDrawRef.nativeElement.getContext) {
      this.contextDraw = this.canvasDrawRef.nativeElement.getContext('2d') as CanvasRenderingContext2D;
      this.contextPreview = this.canvasPreviewRef.nativeElement.getContext('2d') as CanvasRenderingContext2D;
      this.setDefaultContext();
    } else {
      console.error('Canvas NOT supported!');
    }
  }

  private setDefaultContext() {
    applyOn([this.contextDraw, this.contextPreview], (context) => {
      context.lineCap = 'round';
      context.lineJoin = 'round';
    });
  }

  private handleBroadcast() {
    this.updateBroadcastBuffer();
    this.flushBroadcastBuffer();
  }

  private updateBroadcastBuffer() {
    const events = keepDrawEventsAfterClearEvent(this.broadcast.events);
    if (events.length < this.broadcast.events.length) {
      this.broadcastBuffer = [getClearEvent(), ...events];
    } else {
      this.broadcastBuffer.push(...this.broadcast.events);
    }
  }

  private flushBroadcastBuffer() {
    // ######################################
    // ! FIXME: Restore the "animate" feature
    this.broadcast.animate = true;
    // ######################################

    const id = ++this.broadcastId; // Do this on top (and NOT inside the `else` statement)
    if (!this.broadcast.animate || !this.document.defaultView) {
      while (this.broadcastBuffer.length) {
        this.handleDraw(this.broadcastBuffer.shift() as DrawEvent);
      }
    } else {
      const steps = this.broadcastBuffer.length;
      const step = () => {
        if (id === this.broadcastId) {
          if (this.broadcastBuffer.length) {
            const count = this.flushCount(this.broadcastBuffer.length, steps);
            for (let i = 0; i < count; i++) {
              this.handleDraw(this.broadcastBuffer.shift() as DrawEvent);
            }
            this.document.defaultView?.requestAnimationFrame(step);
          } else {
            // Because we are using `ChangeDetectionStrategy.OnPush`, the end of the
            // animation (which occurs asynchronously) is NOT detected by Angular.
            // For this reason, we have to detect this change manually.
            this.changeDetectorRef.detectChanges();
          }
        }
      };
      this.document.defaultView.requestAnimationFrame(step);
    }
  }

  private flushCount(remain: number, total: number) {
    // Let's do some easing!
    const count = Math.round(Math.sin((remain / total) * Math.PI) * 9) + 1;
    return Math.min(count, remain);
  }

  private handleDraw(event: DrawEvent) {
    switch (event.type) {
      case 'point': {
        this.drawPoint(event.data, event.options);
        break;
      }
      case 'line': {
        this.drawLine(event.data, event.options);
        break;
      }
      case 'lineSerie': {
        this.drawLineSerie(event.data, event.options);
        break;
      }
      case 'clear': {
        this.drawClear(event.data);
        break;
      }
      default: {
        console.error('Unhandled event', event);
        break;
      }
    }
  }

  private drawPoint([x, y]: CanvasPoint, options?: DrawOptions, context = this.contextDraw) {
    this.applyDrawOptions(options);
    context.beginPath();
    context.arc(x + this.offset, y + this.offset, 1, 0, Math.PI * 2, true);
    context.stroke();
    this.applyDrawOptions();
  }

  private drawLine([fromX, fromY, toX, toY]: CanvasLine, options?: DrawOptions, context = this.contextDraw) {
    this.applyDrawOptions(options);
    context.beginPath();
    context.moveTo(fromX + this.offset, fromY + this.offset);
    context.lineTo(toX + this.offset, toY + this.offset);
    context.stroke();
    this.applyDrawOptions();
  }

  private drawLineSerie(serie: CanvasLineSerie, options?: DrawOptions, context = this.contextDraw) {
    this.applyDrawOptions(options);
    context.beginPath();
    context.moveTo(serie[0] + this.offset, serie[1] + this.offset);
    context.lineTo(serie[2] + this.offset, serie[3] + this.offset);
    for (let i = 4; i < serie.length; i = i + 2) {
      context.lineTo(serie[i] + this.offset, serie[i + 1] + this.offset);
    }
    context.stroke();
    this.applyDrawOptions();
  }

  private drawClear(
    canvasLine: CanvasLine = [0, 0, this.canvasSize.width, this.canvasSize.height],
    context = this.contextDraw
  ) {
    context.clearRect(...canvasLine);
  }

  private applyDrawOptions(options = this.drawOptions) {
    applyOn([this.contextDraw, this.contextPreview], (context) => {
      context.lineWidth = options.lineWidth;
      context.strokeStyle = `rgba(${options.color}, ${options.opacity})`;
    });
  }

  private emit(event: DrawEvent) {
    this.draw.emit(event);
  }

  drawStart(canvasPoint: CanvasPoint) {
    if (this.drawDisabled) {
      return;
    }
    this.drawPoint(canvasPoint, undefined, this.contextPreview);
    this.isDrawStarted = true;
  }

  drawMove(canvasLine: CanvasLine) {
    if (this.drawDisabled) {
      return;
    }
    if (this.isDrawStarted) {
      // Clear the first `drawPoint` (and replace it with the following `drawLine`)
      this.drawClear(undefined, this.contextPreview);
      this.isDrawStarted = false;
    }
    this.drawLine(canvasLine, undefined, this.contextPreview);
  }

  drawEnd(dataBuffer: number[]) {
    if (this.drawDisabled) {
      return;
    }
    this.drawClear(undefined, this.contextPreview);

    const drawEvent: DrawEvent = {
      owner: '',
      type: dataBuffer.length === 2 ? 'point' : dataBuffer.length === 4 ? 'line' : 'lineSerie', // TODO: move to utils
      options: { ...this.drawOptions }, // Prevent `this.drawOptions` mutation from outside
      data: dataBuffer as any,
    };
    this.handleDraw(drawEvent);
    this.emit(drawEvent);
  }

  private get offset(): number {
    return this.drawOptions.lineWidth % 2 === 1 ? 0.5 : 0;
  }

  get pointerSensitivity() {
    return Math.max(3, this.drawOptions.lineWidth / 2);
  }
}
