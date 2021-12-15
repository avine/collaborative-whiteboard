import { fromEvent, of, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { getDefaultCanvasSize, getDefaultDrawOptions } from '../../cw.config';
import { CwService } from '../../cw.service';
import { DrawEventsBroadcast, DrawTransport, Owner } from '../../cw.types';
import { addStorageKeySuffix, StorageKey, StorageService } from '../../utils/storage';

@Component({
  selector: 'cw-whiteboard',
  templateUrl: './cw-whiteboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CwService],
})
export class CwWhiteboardComponent implements OnInit, OnDestroy {
  @Input() fitParentElement = true;

  @Input() dragBoundarySelector!: string;

  @Input() set onwer(owner: Owner) {
    this.service.owner = owner;
  }

  @Input() set broadcast(transport: DrawTransport | null) {
    if (!transport) {
      return;
    }
    this.service.broadcast(transport);
  }

  @Output() emit = new EventEmitter<DrawTransport>();

  @ViewChild('canvasContainer', { static: true, read: ElementRef }) canvasContainer!: ElementRef<HTMLElement>;

  canvasContainerOverflow!: string;

  canvasSize = getDefaultCanvasSize();

  drawOptions = this.storageService.getLocal(StorageKey.DrawOptions, getDefaultDrawOptions());

  // note: if there's more than one tool-group then set a different name for each one of them
  toolGroupName = '';

  toolGroupLayoutVertical = this.storageService.getLocal(
    addStorageKeySuffix(StorageKey.ToolGroupLayoutVertical, this.toolGroupName),
    true
  );

  showDrawLineTool = false;

  showCutTool = false;

  showGuides = this.storageService.getLocal(StorageKey.ShowGuides, true);

  broadcastHistoryCut!: DrawEventsBroadcast;

  subscriptions: Subscription[] = [];

  constructor(
    public service: CwService,
    private storageService: StorageService,
    private changeDetectorRef: ChangeDetectorRef
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
  }

  ngOnDestroy() {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private handleWindowResize() {
    if (!window) {
      return of().subscribe();
    }
    return fromEvent(window, 'resize')
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
  }

  storeShowGuides(showGuides: boolean) {
    this.storageService.setLocal(StorageKey.ShowGuides, showGuides);
  }
}
