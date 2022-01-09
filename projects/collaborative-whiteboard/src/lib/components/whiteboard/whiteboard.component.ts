import { fromEvent, of, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
import { DrawEventsBroadcast, DrawMode, DrawTransport, FillBackground, Owner } from '../../cw.types';
import { addStorageKeySuffix, CwStorageService, StorageKey } from '../../services/storage';

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

  @ViewChild('canvasContainer', { static: true, read: ElementRef }) canvasContainer!: ElementRef<HTMLElement>;

  private canvasContainerOverflow!: string;

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

  showFillBackgroundTool = false;

  showDrawSettingsTool = false;

  showDrawModeTool = false;

  showCutTool = false;

  broadcastHistoryCut!: DrawEventsBroadcast;

  private subscriptions: Subscription[] = [];

  constructor(
    public service: CwService,
    private storageService: CwStorageService,
    private changeDetectorRef: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.subscriptions.push(
      this.service.emit$.subscribe((transport: DrawTransport) => {
        this.emit.emit(transport);
      }),

      // This is tricky!
      // We can't subscribe to `broadcastHistoryCut$` in the template like this:
      //
      //  <cw-canvas
      //    *ngIf="showCutTool"
      //    [broadcast]="broadcastHistoryCut$ | async"
      //  ></cw-canvas>
      //
      // Because this canvas is rendered conditionally, the following error was thrown:
      // "ExpressionChangedAfterItHasBeenCheckedError"
      //
      // In other words, we need the data emitted by `broadcastHistoryCut$` to be ready eagerly.
      this.service.broadcastHistoryCut$.subscribe((broadcastHistoryCut) => {
        this.broadcastHistoryCut = broadcastHistoryCut;
        this.changeDetectorRef.detectChanges();
      }),

      this.handleWindowResize()
    );

    this.initCanvasContainerOverflow();
    if (this.fitParentElement) {
      this.fitCanvasSizeToParentElement();
    }

    this.initFillBackground();
    this.initDrawMode();
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private handleWindowResize() {
    if (!this.document.defaultView) {
      return of().subscribe();
    }
    return fromEvent(this.document.defaultView, 'resize')
      .pipe(debounceTime(250))
      .subscribe(() => {
        if (this.fitParentElement) {
          this.fitCanvasSizeToParentElement();
          this.service.redraw(false);
        }
      });
  }

  private initCanvasContainerOverflow() {
    this.canvasContainerOverflow = this.canvasContainer.nativeElement.style.overflow;
  }

  private fitCanvasSizeToParentElement() {
    const element = this.canvasContainer.nativeElement;
    // Fit the container
    element.style.width = '100%';
    element.style.height = '100%';
    element.style.overflow = 'hidden';
    // Freeze both container and canvas sizes
    const { width, height } = element.getBoundingClientRect();
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.overflow = this.canvasContainerOverflow;
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

  private initFillBackground() {
    const fillBackground = this.storageService.getLocal<FillBackground>(StorageKey.FillBackground);
    if (fillBackground) {
      this.service.setFillBackground(fillBackground);
    }
  }

  updateFillBackground(fillBackground: FillBackground) {
    this.service.setFillBackground(fillBackground);
    this.storageService.setLocal(StorageKey.FillBackground, fillBackground);
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
    })
  }

  // This function is used in the template as a fallback value when `service.owner$ | async` is null.
  // But actually, `service.owner$` can't be null because it's a `BehaviorSubject` which always have a value.
  // Anyway, we need this hack, because Angular complains...
  throwMissing(): any {
    throw new Error('This code should never be executed!');
  }
}
