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

import { getDefaultCanvasSize, getDefaultDrawBackground, getDefaultDrawOptions } from '../../cw.config';
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

  drawBackground = this.storageService.getLocal(StorageKey.DrawBackground, getDefaultDrawBackground());

  drawOptions = this.storageService.getLocal(StorageKey.DrawOptions, getDefaultDrawOptions());

  // note: if there's more than one tool-group then set a different name for each one of them
  toolGroupName = '';

  toolGroupLayoutVertical = this.storageService.getLocal(
    addStorageKeySuffix(StorageKey.ToolGroupLayoutVertical, this.toolGroupName),
    true
  );

  showDrawBackgroundTool = false;

  showDrawLineTool = false;

  showCutTool = false;

  showGuides = this.storageService.getLocal(StorageKey.ShowGuides, true);

  broadcastHistoryCut!: DrawEventsBroadcast;

  subscriptions: Subscription[] = [];

  constructor(
    public service: CwService,
    private storageService: StorageService,
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

    this.service.setDrawBackground(this.drawBackground);
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

  storeShowGuides(showGuides: boolean) {
    this.storageService.setLocal(StorageKey.ShowGuides, showGuides);
  }

  download(htmlCanvasElement: HTMLCanvasElement) {
    const link = this.document.createElement('a');
    link.href = htmlCanvasElement.toDataURL('image/png');
    link.download = 'collaborative-whiteboard.png';

    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);
  }
}
