import { fromEvent, Subject } from 'rxjs';
import { takeUntil, throttleTime } from 'rxjs/operators';

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

  @Output() cwPointerStart = new EventEmitter<[CanvasPoint, CanvasPoint]>();

  @Output() cwPointerMove = new EventEmitter<[number[], number[]]>();

  @Output() cwPointerEnd = new EventEmitter<[number[], number[]]>();

  private element!: { x: number; y: number };

  private magnetizedBuffer: number[] = [];
  private originalBuffer: number[] = [];

  private end$ = new Subject<void>();

  constructor(private elementRef: ElementRef<HTMLElement>, private ngZone: NgZone) {}

  ngOnInit() {
    this.initMoveListeners();
  }

  ngOnDestroy() {
    this.end$.next();
    this.end$.complete();
  }

  private initMoveListeners() {
    // Prevent unnecessary change detection
    // this.ngZone.runOutsideAngular(() => {
      fromEvent<TouchEvent>(this.elementRef.nativeElement, 'touchmove')
        .pipe(throttleTime(10), takeUntil(this.end$))
        .subscribe((e) => {
          const { clientX, clientY } = e.touches[0];
          this.pointerMove(clientX, clientY);
        });

      fromEvent<MouseEvent>(this.elementRef.nativeElement, 'mousemove')
        .pipe(throttleTime(10), takeUntil(this.end$))
        .subscribe((e) => {
          const { clientX, clientY } = e;
          this.pointerMove(clientX, clientY);
        });
    // });
  }

  pointerStart(pointerX: number, pointerY: number) {
    this.snapshotElementXY();
    const magnetized = this.getMagnetizedCanvasPoint(pointerX, pointerY);
    this.magnetizedBuffer = magnetized;
    const original = this.getOriginalCanvasPoint(pointerX, pointerY);
    this.originalBuffer = original;
    this.cwPointerStart.emit([magnetized, original]);
  }

  private pointerMove(pointerX: number, pointerY: number) {
    if (!this.magnetizedBuffer.length) {
      return;
    }
    const [fromX, fromY] = this.sensitivityOrigin;
    const [toX, toY] = this.getMagnetizedCanvasPoint(pointerX, pointerY);
    if (Math.abs(toX - fromX) <= this.cwPointerSensitivity && Math.abs(toY - fromY) <= this.cwPointerSensitivity) {
      return;
    }
    this.magnetizedBuffer.push(toX, toY);
    this.originalBuffer.push(...this.getOriginalCanvasPoint(pointerX, pointerY));
    this.cwPointerMove.emit([this.magnetizedBuffer, this.originalBuffer]);
  }

  private pointerEnd(pointerX?: number, pointerY?: number) {
    if (!this.magnetizedBuffer.length) {
      return;
    }
    if (pointerX && pointerY) {
      this.pointerMove(pointerX, pointerY);
    }
    this.cwPointerEnd.emit([this.magnetizedBuffer, this.originalBuffer]);
    this.magnetizedBuffer = [];
    this.originalBuffer = [];
  }

  // Note: we assume the `nativeElement` coords will not change between `pointerStart` and `pointerEnd` events
  private snapshotElementXY() {
    const { left: x, top: y } = this.elementRef.nativeElement.getBoundingClientRect();
    this.element = { x, y };
  }

  private getOriginalCanvasPoint(pointerX: number, pointerY: number): CanvasPoint {
    return [Math.round(pointerX - this.element.x), Math.round(pointerY - this.element.y)];
  }

  private getMagnetizedCanvasPoint(pointerX: number, pointerY: number): CanvasPoint {
    return [
      this.magnetize(pointerX - this.element.x, this.cwPointerMagnetShift[0]),
      this.magnetize(pointerY - this.element.y, this.cwPointerMagnetShift[1]),
    ];
  }

  private magnetize(pointer: number, shift: number) {
    if (this.cwPointerMagnet === 0) {
      return Math.round(pointer);
    }
    return Math.round((pointer - shift) / this.cwPointerMagnet) * this.cwPointerMagnet + shift;
  }

  private get sensitivityOrigin(): CanvasPoint {
    return this.cwPointerSensitivityOrigin === 'previous'
      ? [this.magnetizedBuffer[this.magnetizedBuffer.length - 2], this.magnetizedBuffer[this.magnetizedBuffer.length - 1]]
      : [this.magnetizedBuffer[0], this.magnetizedBuffer[1]];
  }
}
