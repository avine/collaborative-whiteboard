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

import { defaultDrawMode, defaultOwner, getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import {
  CanvasLine,
  CanvasPoint,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawMode,
  DrawOptions,
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

  @Input() drawMode = defaultDrawMode;

  @Input() canvasSize = getDefaultCanvasSize();

  @Input() showGuides = true;

  @Input() broadcast!: DrawEventsBroadcast;

  @Input() drawOptions = getDefaultDrawOptions();

  @Input() drawDisabled = false;

  @Output() draw = new EventEmitter<DrawEvent>();

  @ViewChild('canvasResult') canvasResultRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasBroadcast') canvasBroadcastRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasEmit') canvasEmitRef!: ElementRef<HTMLCanvasElement>;

  private contextResult!: CanvasContext;
  private contextBroadcast!: CanvasContext;
  private contextEmit!: CanvasContext;

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
    const contextResult = this.canvasResultRef.nativeElement?.getContext('2d');
    const contextBroadcast = this.canvasBroadcastRef.nativeElement?.getContext('2d');
    const contextEmit = this.canvasEmitRef.nativeElement?.getContext('2d');
    if (!contextResult || !contextBroadcast || !contextEmit) {
      console.error('Canvas NOT supported!');
      return;
    }
    this.contextResult = new CanvasContext(contextResult);
    this.contextBroadcast = new CanvasContext(contextBroadcast);
    this.contextEmit = new CanvasContext(contextEmit);
  }

  private applyCanvasSize() {
    this.contextResult.applyCanvasSize(this.canvasSize);
    this.contextBroadcast.applyCanvasSize(this.canvasSize);
    this.contextEmit.applyCanvasSize(this.canvasSize);
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
        this.handleResult(this.broadcastEventsBuffer.shift() as DrawEvent);
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
                this.contextBroadcast.drawLine(event.data, event.options);
                break;
              }
              case 'end': {
                this.contextBroadcast.drawClear(this.canvasSizeAsLine);
                this.handleResult(event.originalEvent);
                break;
              }
            }
          } else {
            this.handleResult(event);
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

  private handleResult(event: DrawEvent) {
    switch (event.type) {
      case 'point': {
        this.contextResult.drawPoint(event.data, event.options);
        break;
      }
      case 'line': {
        this.contextResult.drawLine(event.data, event.options);
        break;
      }
      case 'lineSerie': {
        this.contextResult.drawLineSerie(event.data, event.options);
        break;
      }
      case 'fillRect': {
        this.contextResult.drawFillRect(event.data ?? this.canvasSizeAsLine, event.options);
        break;
      }
      case 'clear': {
        this.contextResult.drawClear(event.data ?? this.canvasSizeAsLine);
        break;
      }
      default: {
        console.error('Unhandled event', event);
        break;
      }
    }
  }

  get pointerSensitivity() {
    return Math.max(3, this.drawOptions.lineWidth / 2);
  }

  emitStart(canvasPoint: CanvasPoint, options = this.drawOptions) {
    this.contextEmit.drawPoint(canvasPoint, options);
  }

  emitMove(data: number[], options = this.drawOptions) {
    switch (this.drawMode) {
      case 'brush': {
        this.contextEmit.drawLine(data.slice(-4) as CanvasLine, options);
        break;
      }
      case 'line': {
        this.contextEmit.drawClear(this.canvasSizeAsLine);
        this.contextEmit.drawLine([...data.slice(0, 2), ...data.slice(-2)] as CanvasLine, options);
        break;
      }
    }
  }

  emitEnd(data: number[], options = this.drawOptions) {
    this.contextEmit.drawClear(this.canvasSizeAsLine);
    let event: DrawEvent;
    switch (this.drawMode) {
      case 'brush': {
        event = this.getCompleteEvent(data, options);
        break;
      }
      case 'line': {
        event = this.getCompleteEvent([...data.slice(0, 2), ...data.slice(-2)], options);
        break;
      }
    }
    this.handleResult(event);
    this.draw.emit(translate(event, ...this.getCanvasCenter('emit')));
  }

  private getCompleteEvent(data: number[], options: DrawOptions): DrawEvent {
    return {
      id: getEventUID(),
      owner: this.owner,
      type: inferDrawType(data.length),
      data,
      options: { ...options }, // Prevent `drawOptions` mutation from outside
    } as DrawEvent;
  }

  private getCanvasCenter(target: 'emit' | 'broadcast'): [number, number] {
    const factor = target === 'emit' ? -1 : 1;
    return [factor * Math.floor(this.canvasSize.width / 2), factor * Math.floor(this.canvasSize.height / 2)];
  }

  private get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasSize.width, this.canvasSize.height];
  }
}
