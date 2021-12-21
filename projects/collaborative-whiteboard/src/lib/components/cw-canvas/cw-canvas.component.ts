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
import {
  CanvasLine,
  CanvasLineSerie,
  CanvasPoint,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawOptions,
} from '../../cw.types';
import { getClearEvent, getDrawType, keepDrawEventsAfterClearEvent, mapDrawLineSerieToLines } from '../../cw.utils';
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

  private hasPreview = { broadcast: false, owner: false };

  private broadcastId = 0;

  private broadcastEventsBuffer: DrawEvent[] = [];

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
    this.updateBroadcastEventsBuffer();
    this.flushBroadcastEventsBuffer();
  }

  private updateBroadcastEventsBuffer() {
    const events = keepDrawEventsAfterClearEvent(this.broadcast.events);
    if (events.length < this.broadcast.events.length) {
      this.broadcastEventsBuffer = [getClearEvent(), ...events];
    } else {
      this.broadcastEventsBuffer.push(...this.broadcast.events);
    }
  }

  private flushBroadcastEventsBuffer() {
    const id = ++this.broadcastId; // Do this on top (and NOT inside the `else` statement)
    if (!this.broadcast.animate || !this.document.defaultView) {
      while (this.broadcastEventsBuffer.length) {
        this.handleDraw(this.broadcastEventsBuffer.shift() as DrawEvent);
      }
    } else {
      const steps = this.broadcastEventsBuffer.length;
      const step = () => {
        if (id !== this.broadcastId) {
          return;
        }
        if (!this.broadcastEventsBuffer.length) {
          // Because we are using `ChangeDetectionStrategy.OnPush`, the end of the
          // animation (which occurs asynchronously) is NOT detected by Angular.
          // For this reason, we have to detect this change manually.
          this.changeDetectorRef.detectChanges();
          return;
        }
        const count = this.flushCount(this.broadcastEventsBuffer.length, steps);
        for (let i = 0; i < count; i++) {
          const event = this.broadcastEventsBuffer.shift() as DrawEventAnimated;
          if (event.type === 'line' && event.step) {
            switch (event.step) {
              case 'start': {
                // ! FIXME: is drawing a point here a good idea ?
                this.drawPreviewStart([event.data[0], event.data[1]], event.options, true);
                this.drawPreviewMove(event.data, event.options);
                break;
              }
              case 'started': {
                this.drawPreviewMove(event.data, event.options);
                break;
              }
              case 'end': {
                this.drawPreviewEnd(event.canvasLineSerie, event.options, true);
                break;
              }
            }
          } else {
            this.handleDraw(event);
          }
        }
        this.document.defaultView?.requestAnimationFrame(step);
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
    if (options) {
      this.applyDrawOptions();
    }
  }

  private drawLine([fromX, fromY, toX, toY]: CanvasLine, options?: DrawOptions, context = this.contextDraw) {
    this.applyDrawOptions(options);
    context.beginPath();
    context.moveTo(fromX + this.offset, fromY + this.offset);
    context.lineTo(toX + this.offset, toY + this.offset);
    context.stroke();
    if (options) {
      this.applyDrawOptions();
    }
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
    if (options) {
      this.applyDrawOptions();
    }
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

  drawPreviewStart(canvasPoint: CanvasPoint, options = this.drawOptions, isBroadcast = false) {
    this.drawPoint(canvasPoint, options, this.contextPreview);
    this.hasPreview[isBroadcast ? 'broadcast' : 'owner'] = true;
  }

  drawPreviewMove(canvasLine: CanvasLine, options = this.drawOptions) {
    this.drawLine(canvasLine, options, this.contextPreview);
  }

  drawPreviewEnd(data: number[], options = this.drawOptions, isBroadcast = false) {
    this.hasPreview[isBroadcast ? 'broadcast' : 'owner'] = false;
    if (!this.hasPreview.broadcast && !this.hasPreview.owner) {
      this.drawClear(undefined, this.contextPreview);
    }
    const drawEvent = {
      owner: '',
      type: getDrawType(data.length),
      data,
      options: { ...options }, // Prevent `this.drawOptions` mutation from outside
    } as DrawEvent;
    this.handleDraw(drawEvent); // Dispatch event to `contextDraw`
    if (!isBroadcast) {
      this.emit(drawEvent);
    }
  }

  private get offset(): number {
    return this.drawOptions.lineWidth % 2 === 1 ? 0.5 : 0;
  }

  get pointerSensitivity() {
    return Math.max(3, this.drawOptions.lineWidth / 2);
  }
}
