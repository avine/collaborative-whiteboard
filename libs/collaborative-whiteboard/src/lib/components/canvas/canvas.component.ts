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

import { DEFAULT_DRAW_MODE, DEFAULT_OWNER, getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import {
  CanvasLine,
  CanvasPoint,
  CanvasSize,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawMode,
  DrawOptions,
  DrawType,
} from '../../cw.types';
import { PointerSensitivityOrigin } from '../../directives';
import {
  CanvasContext,
  getCanvasCenter,
  getDrawEventUID,
  inferBasicDrawType,
  isDrawEventAnimated,
  isEmptyCanvasLine,
  mapToDrawEventsAnimated,
  translateEvent,
} from '../../utils';
import { getAnimFlushCount } from './canvas.utils';

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

  @ViewChild('canvasBroadcast') canvasBroadcastRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasOwner') canvasOwnerRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasResult') canvasResultRef!: ElementRef<HTMLCanvasElement>;

  private contextBroadcast!: CanvasContext;
  contextOwner!: CanvasContext;
  contextResult!: CanvasContext;

  private broadcastId = 0;
  private broadcastEventsBuffer: (DrawEvent | DrawEventAnimated)[] = [];

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

    // We need to detect changes once `contextOwner` and `contextResult` are initialized.
    this.changeDetectorRef.detectChanges();

    if (this.broadcast) {
      this.handleBroadcast();
    }
  }

  private initContext() {
    const contextBroadcast = this.canvasBroadcastRef.nativeElement?.getContext('2d');
    const contextOwner = this.canvasOwnerRef.nativeElement?.getContext('2d');
    const contextResult = this.canvasResultRef.nativeElement?.getContext('2d');
    if (!contextBroadcast || !contextOwner || !contextResult) {
      console.error('Canvas NOT supported!');
      return;
    }
    this.contextBroadcast = new CanvasContext(contextBroadcast);
    this.contextOwner = new CanvasContext(contextOwner);
    this.contextResult = new CanvasContext(contextResult);
  }

  private applyCanvasSize() {
    this.contextBroadcast.applyCanvasSize(this.canvasSize);
    this.contextOwner.applyCanvasSize(this.canvasSize);
    this.contextResult.applyCanvasSize(this.canvasSize);
  }

  private handleBroadcast() {
    this.handleBroadcastBackground();
    this.updateBroadcastEventsBuffer();
    this.flushBroadcastEventsBuffer();
  }

  private handleBroadcastBackground() {
    const backgroundEvents: DrawEvent[] = [];
    const drawTypesInOrder: DrawType[] = ['clear', 'background', 'background'];
    for (const drawType of drawTypesInOrder) {
      const currFirstEvent = this.broadcast.events[0];
      if (currFirstEvent?.type !== drawType || !isEmptyCanvasLine(currFirstEvent?.data as CanvasLine)) {
        break;
      }
      backgroundEvents.push(this.broadcast.events.shift() as DrawEvent);
    }
    if (!backgroundEvents.length) {
      return;
    }

    // Reset broadcast
    this.broadcastEventsBuffer = [];
    this.contextBroadcast.drawClear(this.canvasSizeAsLine);

    // Reset result and draw background
    this.contextResult.resetPaths();
    while (backgroundEvents.length) {
      this.handleResult(backgroundEvents.shift() as DrawEvent);
    }
  }

  private updateBroadcastEventsBuffer() {
    let events = this.broadcast.events.map((event) =>
      translateEvent(event, ...getCanvasCenter(this.canvasSize, 'broadcast'))
    );
    if (this.broadcast.animate) {
      events = mapToDrawEventsAnimated(events);
    }
    this.broadcastEventsBuffer.push(...events);
  }

  private flushBroadcastEventsBuffer() {
    const id = ++this.broadcastId; // Do this on top (NOT inside `flushWithAnim`)
    if (!this.broadcast.animate || !this.document.defaultView) {
      this.flushBroadcastEventsBufferWithoutAnim();
    } else {
      this.flushBroadcastEventsBufferWithAnim(id);
    }
  }

  private flushBroadcastEventsBufferWithoutAnim() {
    this.contextBroadcast.drawClear(this.canvasSizeAsLine);
    while (this.broadcastEventsBuffer.length) {
      this.handleResult(this.broadcastEventsBuffer.shift() as DrawEvent);
    }
  }

  private flushBroadcastEventsBufferWithAnim(id: number) {
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
      const flushCount = getAnimFlushCount(this.broadcastEventsBuffer.length, steps);
      for (let i = 0; i < flushCount; i++) {
        const event = this.broadcastEventsBuffer.shift() as DrawEvent | DrawEventAnimated;
        if (!isDrawEventAnimated(event)) {
          this.handleResult(event);
          continue;
        }
        this.contextBroadcast.drawClear(this.canvasSizeAsLine);
        if (event.animate) {
          this.contextBroadcast.handleEvent(event);
        } else {
          this.handleResult(event);
        }
      }
      this.document.defaultView?.requestAnimationFrame(step);
    };
    this.document.defaultView?.requestAnimationFrame(step);
  }

  private handleResult(event: DrawEvent) {
    if ((event.type === 'background' || event.type === 'clear') && isEmptyCanvasLine(event.data)) {
      this.contextResult.handleEvent({ ...event, data: this.canvasSizeAsLine });
    } else {
      this.contextResult.handleEvent(event);
    }
  }

  pointerMagnetShift(pointerMagnet: number, canvasSize: CanvasSize): CanvasPoint {
    if (!pointerMagnet) {
      return [0, 0];
    }
    return [Math.round((canvasSize.width / 2) % pointerMagnet), Math.round((canvasSize.height / 2) % pointerMagnet)];
  }

  pointerSensitivity(pointerMagnet: number, drawOptions: DrawOptions) {
    const lineWidthRatio = Math.round(drawOptions.lineWidth / 3);
    if (pointerMagnet !== 0) {
      return Math.min(pointerMagnet, lineWidthRatio);
    }
    const SENSITIVITY_MIN = 3;
    const SENSITIVITY_MAX = 9;
    return Math.min(Math.max(SENSITIVITY_MIN, lineWidthRatio), SENSITIVITY_MAX);
  }

  pointerSensitivityOrigin(drawMode: DrawMode): PointerSensitivityOrigin {
    return drawMode === 'brush' ? 'previous' : 'first';
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  pointerEnd(magnetized: number[], original: number[]) {
    if (this.drawMode === 'selection') {
      return;
    }
    let event: DrawEvent | undefined = undefined;
    if (this.drawMode === 'brush') {
      event = this.getCompleteEvent(magnetized, this.drawOptions);
    } else {
      const [fromX, fromY, toX, toY] = [...magnetized.slice(0, 2), ...magnetized.slice(-2)];
      // At this point, `this.drawMode` can be: 'line' | 'rectangle' | 'ellipse'
      if (fromX === toX && fromY === toY) {
        event = this.getCompleteEvent([fromX, fromY], this.drawOptions, 'point');
      } else if (fromX === toX || fromY === toY) {
        event = this.getCompleteEvent([fromX, fromY, toX, toY], this.drawOptions, 'line');
      } else {
        event = this.getCompleteEvent([fromX, fromY, toX, toY], this.drawOptions, this.drawMode);
      }
    }
    this.handleResult(event);
    this.draw.emit(translateEvent(event, ...getCanvasCenter(this.canvasSize, 'emit')));
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

  private get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasSize.width, this.canvasSize.height];
  }
}
