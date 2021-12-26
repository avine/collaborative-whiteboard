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

import { defaultOwner, getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import {
  CanvasLine,
  CanvasPoint,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
} from '../../cw.types';
import {
  getClearEvent,
  getEventUID,
  inferDrawType,
  keepDrawEventsAfterClearEvent,
  mapToDrawEventsAnimated,
  translate,
} from '../../cw.utils';
import { CanvasContext } from '../../utils/canvas/context';

@Component({
  selector: 'cw-canvas',
  templateUrl: './cw-canvas.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwCanvasComponent implements OnChanges, AfterViewInit {
  @Input() owner = defaultOwner;

  @Input() canvasSize = getDefaultCanvasSize();

  @Input() showGuides = true;

  @Input() broadcast!: DrawEventsBroadcast;

  @Input() drawOptions = getDefaultDrawOptions();

  @Input() drawDisabled = false;

  @Output() draw = new EventEmitter<DrawEvent>();

  @ViewChild('canvasDraw') canvasDrawRef!: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasPreview') canvasPreviewRef!: ElementRef<HTMLCanvasElement>;

  private contextDraw!: CanvasContext;

  private contextPreview!: CanvasContext;

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
    this.initContext();
    this.applyCanvasSize();
    if (this.broadcast) {
      this.handleBroadcast();
    }
  }

  private initContext() {
    const contextDraw = this.canvasDrawRef.nativeElement?.getContext('2d');
    const contextPreview = this.canvasPreviewRef.nativeElement?.getContext('2d');
    if (!contextDraw || !contextPreview) {
      console.error('Canvas NOT supported!');
      return;
    }
    this.contextDraw = new CanvasContext(contextDraw);
    this.contextPreview = new CanvasContext(contextPreview);
  }

  private applyCanvasSize() {
    this.contextDraw.applyCanvasSize(this.canvasSize);
    this.contextPreview.applyCanvasSize(this.canvasSize);
  }

  private handleBroadcast() {
    this.updateBroadcastEventsBuffer();
    this.flushBroadcastEventsBuffer();
  }

  private updateBroadcastEventsBuffer() {
    let events = keepDrawEventsAfterClearEvent(this.broadcast.events);
    const hasClearEvent = events.length < this.broadcast.events.length;
    events = events.map((event) => translate(event, ...this.getCanvasCenter('broadcast')));
    if (this.broadcast.animate) {
      events = mapToDrawEventsAnimated(events);
    }
    if (hasClearEvent) {
      this.broadcastEventsBuffer = [getClearEvent(this.owner), ...events];
    } else {
      this.broadcastEventsBuffer.push(...events);
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
              case 'start':
              case 'started': {
                this.drawPreviewMove(event.data, event.options, true);
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
        this.contextDraw.drawPoint(event.data, event.options);
        break;
      }
      case 'line': {
        this.contextDraw.drawLine(event.data, event.options);
        break;
      }
      case 'lineSerie': {
        this.contextDraw.drawLineSerie(event.data, event.options);
        break;
      }
      case 'fillRect': {
        this.contextDraw.drawFillRect(event.data ?? this.canvasSizeAsLine, event.options);
        break;
      }
      case 'clear': {
        this.contextDraw.drawClear(event.data ?? this.canvasSizeAsLine);
        break;
      }
      default: {
        console.error('Unhandled event', event);
        break;
      }
    }
  }

  drawPreviewStart(canvasPoint: CanvasPoint, options = this.drawOptions, isBroadcast = false) {
    this.contextPreview.drawPoint(canvasPoint, options);
    this.hasPreview[isBroadcast ? 'broadcast' : 'owner'] = true;
  }

  drawPreviewMove(canvasLine: CanvasLine, options = this.drawOptions, isBroadcast = false) {
    this.contextPreview.drawLine(canvasLine, options);
    this.hasPreview[isBroadcast ? 'broadcast' : 'owner'] = true;
  }

  drawPreviewEnd(data: number[], options = this.drawOptions, isBroadcast = false) {
    this.hasPreview[isBroadcast ? 'broadcast' : 'owner'] = false;
    if (!this.hasPreview.broadcast && !this.hasPreview.owner) {
      this.contextPreview.drawClear(this.canvasSizeAsLine);
    }
    const event = {
      id: getEventUID(),
      owner: this.owner,
      type: inferDrawType(data.length),
      data,
      options: { ...options }, // Prevent `this.drawOptions` mutation from outside
    } as DrawEvent;
    this.handleDraw(event); // Dispatch event to `contextDraw`
    if (!isBroadcast) {
      this.draw.emit(translate(event, ...this.getCanvasCenter('emit')));
    }
  }

  private get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasSize.width, this.canvasSize.height];
  }

  private getCanvasCenter(target: 'emit' | 'broadcast'): [number, number] {
    const factor = target === 'emit' ? -1 : 1;
    return [factor * Math.floor(this.canvasSize.width / 2), factor * Math.floor(this.canvasSize.height / 2)];
  }

  get pointerSensitivity() {
    return Math.max(3, this.drawOptions.lineWidth / 2);
  }
}
