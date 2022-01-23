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

import { getDefaultCanvasSize } from '../../cw.config';
import { CanvasLine, DrawEvent, DrawEventAnimated, DrawEventsBroadcast, DrawType } from '../../cw.types';
import {
  CanvasContext,
  isDrawEventAnimated,
  isEmptyCanvasLine,
  mapToDrawEventsAnimated,
  translateEvent,
} from '../../utils';
import { getAnimFlushCount, getAnimFrameRate } from '../canvas/canvas.utils';

@Component({
  selector: 'cw-canvas-broadcast-preview',
  templateUrl: './canvas-broadcast-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwCanvasBroadcastPreviewComponent implements OnChanges, AfterViewInit {
  @Input() canvasSize = getDefaultCanvasSize();

  @Input() broadcast!: DrawEventsBroadcast;

  @Output() redraw = new EventEmitter<void>();

  @Output() drawEvent = new EventEmitter<DrawEvent>();

  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  private context!: CanvasContext;

  private broadcastId = 0;

  private eventsBuffer: (DrawEvent | DrawEventAnimated)[] = [];

  constructor(@Inject(DOCUMENT) private document: Document, private changeDetectorRef: ChangeDetectorRef) {}

  ngOnChanges({ canvasSize, broadcast }: SimpleChanges) {
    // Note: Skip the `.firstChange` because `this.context*` is not yet available
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
    const context = this.canvasRef.nativeElement?.getContext('2d');
    if (!context) {
      console.error('Canvas NOT supported!');
      return;
    }
    this.context = new CanvasContext(context);
  }

  private applyCanvasSize() {
    this.context.applyCanvasSize(this.canvasSize);
  }

  private handleBroadcast() {
    this.handleBackground();
    this.updateEventsBuffer();
    this.flushEventsBuffer();
  }

  private handleBackground() {
    const events: DrawEvent[] = [];
    const drawTypesInOrder: DrawType[] = ['clear', 'fillBackground', 'fillBackground'];
    for (let i = 0; i < drawTypesInOrder.length; i++) {
      const currFirstEvent = this.broadcast.events[0];
      if (currFirstEvent?.type !== drawTypesInOrder[i] || !isEmptyCanvasLine(currFirstEvent?.data as CanvasLine)) {
        break;
      }
      events.push(this.broadcast.events.shift() as DrawEvent);
    }
    if (!events.length) {
      return;
    }
    this.eventsBuffer = [];
    this.context.drawClear(this.canvasSizeAsLine);
    this.redraw.emit();
    while (events.length) {
      this.drawEvent.emit(events.shift() as DrawEvent);
    }
  }

  private updateEventsBuffer() {
    let events = this.broadcast.events.map((event) => translateEvent(event, ...this.getCanvasCenter('broadcast')));
    if (this.broadcast.animate) {
      events = mapToDrawEventsAnimated(events);
    }
    this.eventsBuffer.push(...events);
  }

  private flushEventsBuffer() {
    const id = ++this.broadcastId; // Do this on top (and NOT inside the `else` statement)
    if (!this.broadcast.animate || !this.document.defaultView) {
      this.context.drawClear(this.canvasSizeAsLine);
      while (this.eventsBuffer.length) {
        this.drawEvent.emit(this.eventsBuffer.shift() as DrawEvent);
      }
    } else {
      const steps = this.eventsBuffer.length;
      const frameRate = getAnimFrameRate(steps);
      const step = () => {
        if (id !== this.broadcastId) {
          return;
        }
        if (!this.eventsBuffer.length) {
          // Because we are using `ChangeDetectionStrategy.OnPush`, the end of the
          // animation (which occurs asynchronously) is NOT detected by Angular.
          // For this reason, we have to detect this change manually.
          this.changeDetectorRef.detectChanges();
          return;
        }
        const flushCount = getAnimFlushCount(this.eventsBuffer.length, steps);
        for (let i = 0; i < flushCount; i++) {
          const event = this.eventsBuffer.shift() as DrawEvent | DrawEventAnimated;
          if (!isDrawEventAnimated(event)) {
            this.drawEvent.emit(event);
            continue;
          }
          this.context.drawClear(this.canvasSizeAsLine);
          if (event.animate) {
            this.context.handleEvent(event);
          } else {
            this.drawEvent.emit(event);
          }
        }
        if (frameRate) {
          setTimeout(() => this.document.defaultView?.requestAnimationFrame(step), frameRate);
        } else {
          this.document.defaultView?.requestAnimationFrame(step);
        }
      };
      this.document.defaultView.requestAnimationFrame(step);
    }
  }

  private get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasSize.width, this.canvasSize.height];
  }

  private getCanvasCenter(target: 'emit' | 'broadcast'): [number, number] {
    const factor = target === 'emit' ? -1 : 1;
    return [factor * Math.floor(this.canvasSize.width / 2), factor * Math.floor(this.canvasSize.height / 2)];
  }
}
