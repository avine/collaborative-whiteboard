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
  Optional,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

import { DEFAULT_DRAW_MODE, DEFAULT_OWNER, getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import { CwService } from '../../cw.service';
import {
  CanvasLine,
  CanvasPoint,
  DrawEvent,
  DrawEventAnimated,
  DrawEventsBroadcast,
  DrawOptions,
  DrawType,
} from '../../cw.types';
import { PointerSensitivityOrigin } from '../../directives/pointer.types';
import { CanvasContext } from '../../utils/canvas-context';
import { getSelectionMoveDrawOptions } from '../../utils/canvas-context/canvas-context.config';
import { getEventUID, inferBasicDrawType, isEmptyCanvasLine, translateDrawEvent } from '../../utils/common';
import { isDrawEventAnimated, mapToDrawEventsAnimated } from '../../utils/events-animation';
import { getAnimFlushCount, getAnimFrameRate } from './canvas.utils';

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
  @ViewChild('canvasBroadcast') canvasBroadcastRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasEmit') canvasEmitRef!: ElementRef<HTMLCanvasElement>;

  private contextResult!: CanvasContext;
  private contextBroadcast!: CanvasContext;
  private contextEmit!: CanvasContext;

  private broadcastId = 0;

  private broadcastEventsBuffer: (DrawEvent | DrawEventAnimated)[] = [];

  private skipUnselect!: boolean;

  constructor(
    @Optional() private service: CwService,
    @Inject(DOCUMENT) private document: Document,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

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
    this.handleBroadcastBackground();
    this.updateBroadcastEventsBuffer();
    this.flushBroadcastEventsBuffer();
  }

  private handleBroadcastBackground() {
    const events: DrawEvent[] = [];
    const drawTypesInOrder: DrawType[] = ['clear', 'fillRect', 'fillRect'];
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
    this.broadcastEventsBuffer = [];
    this.contextBroadcast.drawClear(this.canvasSizeAsLine);
    this.contextResult.resetPaths();
    while (events.length) {
      this.handleResult(events.shift() as DrawEvent);
    }
  }

  private updateBroadcastEventsBuffer() {
    let events = this.broadcast.events.map((event) => translateDrawEvent(event, ...this.getCanvasCenter('broadcast')));
    if (this.broadcast.animate) {
      events = mapToDrawEventsAnimated(events);
    }
    this.broadcastEventsBuffer.push(...events);
  }

  private flushBroadcastEventsBuffer() {
    const id = ++this.broadcastId; // Do this on top (and NOT inside the `else` statement)
    if (!this.broadcast.animate || !this.document.defaultView) {
      this.contextBroadcast.drawClear(this.canvasSizeAsLine);
      while (this.broadcastEventsBuffer.length) {
        this.handleResult(this.broadcastEventsBuffer.shift() as DrawEvent);
      }
    } else {
      const steps = this.broadcastEventsBuffer.length;
      const frameRate = getAnimFrameRate(steps);
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
        if (frameRate) {
          setTimeout(() => this.document.defaultView?.requestAnimationFrame(step), frameRate);
        } else {
          this.document.defaultView?.requestAnimationFrame(step);
        }
      };
      this.document.defaultView.requestAnimationFrame(step);
    }
  }

  private handleResult(event: DrawEvent) {
    if ((event.type === 'fillRect' || event.type === 'clear') && isEmptyCanvasLine(event.data)) {
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

  emitStart(canvasPoint: CanvasPoint, options = this.drawOptions) {
    if (this.drawMode === 'selection') {
      this.handleSelectionStart(canvasPoint);
      return;
    }
    this.contextEmit.drawPoint(canvasPoint, options); // ! FIXME: is it better not to draw this point ?
  }

  emitMove(data: number[], options = this.drawOptions) {
    this.contextEmit.drawClear(this.canvasSizeAsLine);
    if (this.drawMode === 'selection') {
      this.handleSelectionMove(data);
      return;
    }
    switch (this.drawMode) {
      case 'brush': {
        this.contextEmit.drawLineSerie(data, options);
        break;
      }
      case 'line': {
        this.contextEmit.drawLine([...data.slice(0, 2), ...data.slice(-2)] as CanvasLine, options);
        break;
      }
      case 'rectangle': {
        this.contextEmit.drawRectangle([...data.slice(0, 2), ...data.slice(-2)] as CanvasLine, options);
        break;
      }
      case 'ellipse': {
        this.contextEmit.drawEllipse([...data.slice(0, 2), ...data.slice(-2)] as CanvasLine, options);
        break;
      }
    }
  }

  emitEnd(data: number[], options = this.drawOptions) {
    this.contextEmit.drawClear(this.canvasSizeAsLine);
    if (this.drawMode === 'selection') {
      this.handleSelectionEnd(data);
      return;
    }
    let event: DrawEvent | undefined = undefined;
    switch (this.drawMode) {
      case 'brush': {
        event = this.getCompleteEvent(data, options);
        break;
      }
      case 'line': {
        event = this.getCompleteEvent([...data.slice(0, 2), ...data.slice(-2)], options);
        break;
      }
      case 'rectangle': {
        event = this.getCompleteEvent([...data.slice(0, 2), ...data.slice(-2)], options, 'rectangle');
        break;
      }
      case 'ellipse': {
        event = this.getCompleteEvent([...data.slice(0, 2), ...data.slice(-2)], options, 'ellipse');
        break;
      }
    }
    this.handleResult(event);
    this.draw.emit(translateDrawEvent(event, ...this.getCanvasCenter('emit')));
  }

  private handleSelectionStart(canvasPoint: CanvasPoint) {
    const eventsId = this.contextResult.getSelectedDrawEventsId(...canvasPoint);
    if (eventsId.length) {
      this.skipUnselect = this.service?.addSelection(eventsId);
    }
  }

  private handleSelectionMove(data: number[]) {
    this.contextEmit.drawRectangle(
      [...data.slice(0, 2), ...data.slice(-2)] as CanvasLine,
      getSelectionMoveDrawOptions()
    );
  }

  private handleSelectionEnd(data: number[]) {
    switch (data.length) {
      case 2: {
        if (this.skipUnselect) {
          this.skipUnselect = false;
          break;
        }
        const eventsId = this.contextResult.getSelectedDrawEventsId(...(data as CanvasPoint));
        if (eventsId.length) {
          this.service?.removeSelection(eventsId);
        } else {
          this.service?.clearSelection();
        }
        break;
      }
      default: {
        const canvasLine = [...data.slice(0, 2), ...data.slice(-2)] as CanvasLine;
        const eventsId = this.contextResult.getSelectedDrawEventsIdInArea(canvasLine);
        if (eventsId.length) {
          this.service?.addSelection(eventsId);
        } else {
          this.service?.clearSelection();
        }
        break;
      }
    }
  }

  private getCompleteEvent(data: number[], options: DrawOptions, forceDrawType?: DrawType): DrawEvent {
    return {
      id: getEventUID(),
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

  private get canvasSizeAsLine(): CanvasLine {
    return [0, 0, this.canvasSize.width, this.canvasSize.height];
  }
}
