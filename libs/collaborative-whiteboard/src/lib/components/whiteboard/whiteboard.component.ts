import { fromEvent, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import { CwService } from '../../cw.service';
import { Background, DrawMode, DrawTransport, Owner } from '../../cw.types';
import { addStorageKeySuffix, CwStorageService, StorageKey } from '../../services';

@Component({
  selector: 'cw-whiteboard',
  templateUrl: './whiteboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CwService],
})
export class CwWhiteboardComponent implements OnInit, OnDestroy {
  @Input() fitParentElement = true;

  @Input() dragBoundarySelector!: string;

  @Input() set onwer(owner: Owner) {
    this.service.owner = owner;
  }

  // TODO: rename this method into transport ?
  @Input() set broadcast(transport: DrawTransport | null) {
    if (!transport) {
      return;
    }
    this.service.broadcast(transport);
  }

  @Output() emit = new EventEmitter<DrawTransport>();

  @ViewChild('canvas', { static: true, read: ElementRef }) canvas!: ElementRef<HTMLCanvasElement>;

  private canvasOverflow!: string;

  canvasSize = getDefaultCanvasSize();

  drawOptions = this.storageService.getLocal(StorageKey.DrawOptions, getDefaultDrawOptions());

  showGuides = this.storageService.getLocal(StorageKey.ShowGuides, true);

  pointerMagnet = this.storageService.getLocal(StorageKey.PointerMagnet, 0);

  // Note: if there's more than one tool-group then set a different name for each one of them
  toolGroupName = '';

  toolGroupLayoutVertical = this.storageService.getLocal(
    addStorageKeySuffix(StorageKey.ToolGroupLayoutVertical, this.toolGroupName),
    true
  );

  private end$ = new Subject<void>();

  constructor(
    public service: CwService,
    private storageService: CwStorageService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.service.emit$.pipe(takeUntil(this.end$)).subscribe((transport: DrawTransport) => this.emit.emit(transport));

    this.handleWindowResize();

    this.initCanvasOverflow();
    if (this.fitParentElement) {
      this.fitCanvasSizeToParentElement();
    }

    this.initBackground();
    this.initDrawMode();
  }

  ngOnDestroy() {
    this.end$.next();
    this.end$.complete();
  }

  private handleWindowResize() {
    if (!this.document.defaultView) {
      return;
    }
    fromEvent(this.document.defaultView, 'resize')
      .pipe(debounceTime(250), takeUntil(this.end$))
      .subscribe(() => {
        if (this.fitParentElement) {
          this.fitCanvasSizeToParentElement();
          this.service.redraw();
        }
      });
  }

  private initCanvasOverflow() {
    this.canvasOverflow = this.canvas.nativeElement.style.overflow;
  }

  private fitCanvasSizeToParentElement() {
    const element = this.canvas.nativeElement;
    // Fit the container
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.overflow = 'hidden';
    // Freeze both container and canvas sizes
    const { width, height } = element.getBoundingClientRect();
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.overflow = this.canvasOverflow;
    this.canvasSize = { width, height };
    this.changeDetectorRef.detectChanges();
  }

  storeDrawOptions() {
    this.storageService.setLocal(StorageKey.DrawOptions, this.drawOptions);

    // This is tricky!
    // Because `<cw-draw-settings>` is rendered in an Overlay, it is not a child of `<cw-whiteboard>`'s DOM tree.
    // Thus, cLick events that occurs in the overlay does not trigger the change detection of the whiteboard...
    this.changeDetectorRef.detectChanges();
  }

  storeShowGuides() {
    this.storageService.setLocal(StorageKey.ShowGuides, this.showGuides);
  }

  storePointerMagnet() {
    this.storageService.setLocal(StorageKey.PointerMagnet, this.pointerMagnet);

    // This is tricky!
    // Because `<cw-draw-mode>` is rendered in an Overlay, it is not a child of `<cw-whiteboard>`'s DOM tree.
    // Thus, cLick events that occurs in the overlay does not trigger the change detection of the whiteboard...
    this.changeDetectorRef.detectChanges();
  }

  private initBackground() {
    const background = this.storageService.getLocal<Background>(StorageKey.Background);
    if (background) {
      this.service.setBackground(background);
    }
  }

  updateBackground(background: Background) {
    this.service.setBackground(background);
    this.storageService.setLocal(StorageKey.Background, background);
  }

  private initDrawMode() {
    const drawMode = this.storageService.getLocal<DrawMode>(StorageKey.DrawMode);
    if (drawMode) {
      this.service.drawMode = drawMode;
    }
  }

  updateDrawMode(drawMode: DrawMode) {
    this.service.drawMode = drawMode;
    this.storageService.setLocal(StorageKey.DrawMode, this.service.drawMode);
  }

  download(htmlCanvasElement: HTMLCanvasElement) {
    this.service.clearSelection();
    this.document.defaultView?.requestAnimationFrame(() => {
      const link = this.document.createElement('a');
      link.href = htmlCanvasElement.toDataURL('image/png');
      link.download = 'collaborative-whiteboard.png';

      this.document.body.appendChild(link);
      link.click();
      this.document.body.removeChild(link);
    });
  }

  // This function is used in the template as a fallback value when `service.owner$ | async` is null.
  // But actually, `service.owner$` can't be null because it's a `BehaviorSubject` which always have a value.
  // Anyway, we need this hack, because Angular complains...
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  throwMissing(): any {
    throw new Error('This code should never be executed!');
  }
}
