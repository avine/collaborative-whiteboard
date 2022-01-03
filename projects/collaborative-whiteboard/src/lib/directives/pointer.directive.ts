import { fromEvent, Subscription, throttleTime } from 'rxjs';

import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';

import { CanvasPoint } from '../cw.types';
import { PointerSensitivityOrigin } from './pointer.types';

@Directive({
  selector: '[cwPointer]',
})
export class CwPointerDirective implements OnInit, OnDestroy {
  @HostListener('touchstart', ['$event']) touchstart(e: TouchEvent) {
    if (e.touches.length === 1) {
      // Prevent further "mouse" event from being fired when "touch" event is detected.
      // Notice that only "single-touch" event is considered a draw event.
      e.preventDefault();
    }
    const { clientX, clientY } = e.touches[0];
    this.pointerStart(clientX, clientY);
  }

  @HostListener('touchend', ['$event']) touchend(e: TouchEvent) {
    if (e.touches.length === 1) {
      e.preventDefault();

      const { clientX, clientY } = e.touches[0];
      this.pointerEnd(clientX, clientY);
    } else {
      this.pointerEnd();
    }
  }

  @HostListener('mousedown', ['$event']) mousedown(e: MouseEvent) {
    const { clientX, clientY } = e;
    this.pointerStart(clientX, clientY);
  }

  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
  mouseleave(e: MouseEvent) {
    const { clientX, clientY } = e;
    this.pointerEnd(clientX, clientY);
  }

  @Input() cwPointerMagnet = 0;

  @Input() cwPointerMagnetShift: CanvasPoint = [0, 0];

  @Input() cwPointerSensitivity = 0;

  @Input() cwPointerSensitivityOrigin: PointerSensitivityOrigin = 'previous';

  @Output() cwPointerStart = new EventEmitter<CanvasPoint>();

  @Output() cwPointerMove = new EventEmitter<number[]>();

  @Output() cwPointerEnd = new EventEmitter<number[]>();

  private element!: { x: number; y: number };

  private dataBuffer: number[] = [];

  private readonly moveSubscriptions = new Subscription();

  constructor(private elementRef: ElementRef<HTMLElement>, private ngZone: NgZone) {}

  ngOnInit() {
    this.initMoveListeners();
  }

  ngOnDestroy() {
    this.moveSubscriptions.unsubscribe();
  }

  private initMoveListeners() {
    // Prevent unnecessary change detection
    this.ngZone.runOutsideAngular(() => {
      this.moveSubscriptions.add(
        fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchmove')
          .pipe(throttleTime(10))
          .subscribe((e) => {
            const { clientX, clientY } = e.touches[0];
            this.pointerMove(clientX, clientY);
          })
      );
      this.moveSubscriptions.add(
        fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mousemove')
          .pipe(throttleTime(10))
          .subscribe((e) => {
            const { clientX, clientY } = e;
            this.pointerMove(clientX, clientY);
          })
      );
    });
  }

  pointerStart(pointerX: number, pointerY: number) {
    this.snapshotElementXY();
    const canvasPoint = this.getCanvasPoint(pointerX, pointerY);
    this.dataBuffer = canvasPoint;
    this.cwPointerStart.emit(canvasPoint);
  }

  private pointerMove(pointerX: number, pointerY: number) {
    if (!this.dataBuffer.length) {
      return;
    }
    const [fromX, fromY] = this.sensitivityOrigin;
    const [toX, toY] = this.getCanvasPoint(pointerX, pointerY);
    if (Math.abs(toX - fromX) <= this.cwPointerSensitivity && Math.abs(toY - fromY) <= this.cwPointerSensitivity) {
      return;
    }
    this.dataBuffer.push(toX, toY);
    this.cwPointerMove.emit(this.dataBuffer);
  }

  private pointerEnd(pointerX?: number, pointerY?: number) {
    if (!this.dataBuffer.length) {
      return;
    }
    if (pointerX && pointerY) {
      this.pointerMove(pointerX, pointerY);
    }
    this.cwPointerEnd.emit(this.dataBuffer);
    this.dataBuffer = [];
  }

  // Note: we assume the `nativeElement` coords will not change between `pointerStart` and `pointerEnd` events
  private snapshotElementXY() {
    const { left: x, top: y } = this.elementRef.nativeElement.getBoundingClientRect();
    this.element = { x, y };
  }

  private getCanvasPoint(pointerX: number, pointerY: number): CanvasPoint {
    return [
      this.magnetize(pointerX - this.element.x) + this.cwPointerMagnetShift[0],
      this.magnetize(pointerY - this.element.y) + this.cwPointerMagnetShift[1],
    ];
  }

  private magnetize(n: number) {
    if (this.cwPointerMagnet === 0) {
      return Math.round(n);
    }
    return Math.floor(n / this.cwPointerMagnet) * this.cwPointerMagnet;
  }

  private get sensitivityOrigin(): CanvasPoint {
    return this.cwPointerSensitivityOrigin === 'previous'
      ? [this.dataBuffer[this.dataBuffer.length - 2], this.dataBuffer[this.dataBuffer.length - 1]]
      : [this.dataBuffer[0], this.dataBuffer[1]];
  }
}
