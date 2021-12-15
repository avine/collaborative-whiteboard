import { Subscription } from 'rxjs';
import { first } from 'rxjs/operators';

import { CdkDrag } from '@angular/cdk/drag-drop';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  Input,
  OnDestroy,
  QueryList,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';

import { addStorageKeySuffix, StorageKey, StorageService } from '../../utils/storage';
import { CwToolContentComponent } from '../cw-tool-content/cw-tool-content.component';
import { CwToolComponent } from '../cw-tool/cw-tool.component';

@Component({
  selector: 'cw-tool-group',
  templateUrl: './cw-tool-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwToolGroupComponent implements AfterViewInit, OnDestroy {
  @Input() name!: string;

  @Input() layoutVertical = false;

  @Input() dragBoundarySelector!: string;

  @ContentChildren(CwToolComponent) tools!: QueryList<CwToolComponent>;

  @ViewChild('portal', { read: ViewContainerRef })
  portal!: ViewContainerRef;

  private activeTools = new Map<CwToolComponent, OverlayRef>();

  private activeChangeSubscriptions: Subscription[] = [];
  private toolsChangeSubscription!: Subscription;

  collapse = this.storageService.getLocal(addStorageKeySuffix(StorageKey.ToolGroupCollapse, this.name), false);

  constructor(
    private storageService: StorageService,
    private overlay: Overlay,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.subscribeToActiveChange();
    this.subscribeToToolsChange();
  }

  ngOnDestroy() {
    this.unsubscribeFromActiveChange();
    this.unsubscribeFromToolsChange();
    this.closeAllContent();
  }

  private subscribeToActiveChange() {
    this.activeChangeSubscriptions = [];
    this.tools.forEach((tool) => {
      const subscription = tool.activeChange.subscribe(() => this.checkContent(tool));
      this.activeChangeSubscriptions.push(subscription);
      this.checkContent(tool);
    });
  }

  private unsubscribeFromActiveChange() {
    this.activeChangeSubscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private subscribeToToolsChange() {
    this.toolsChangeSubscription = this.tools.changes.subscribe(() => {
      this.checkActiveTools();
      this.unsubscribeFromActiveChange();
      this.subscribeToActiveChange();
    });
  }

  private unsubscribeFromToolsChange() {
    this.toolsChangeSubscription.unsubscribe();
  }

  private checkContent(tool: CwToolComponent) {
    if (tool.content) {
      if (tool.active && !this.activeTools.has(tool)) {
        this.openContent(tool);
      } else if (!tool.active && this.activeTools.has(tool)) {
        this.closeContent(tool);
      }
    }
  }

  private checkActiveTools() {
    const tools = this.tools.toArray();
    for (const tool of this.activeTools.keys()) {
      if (tools.indexOf(tool) === -1) {
        this.closeContent(tool);
      }
    }
  }

  private openContent(tool: CwToolComponent) {
    const positionStrategy = this.overlay.position().global().centerHorizontally().centerVertically();
    const overlayRef = this.overlay.create({ positionStrategy });
    const componentRef = overlayRef.attach(new ComponentPortal(CwToolContentComponent));
    componentRef.instance.title = tool.title;
    componentRef.instance.content = tool.content;
    componentRef.instance.dispose.pipe(first()).subscribe(() => this.toggleActive(tool));
    this.activeTools.set(tool, overlayRef);
  }

  private closeContent(tool: CwToolComponent) {
    this.activeTools.get(tool)?.dispose();
    this.activeTools.delete(tool);

    // "Close" action might be triggered from outside this component
    this.changeDetectorRef.detectChanges();
  }

  private closeAllContent() {
    for (const tool of this.activeTools.keys()) {
      this.closeContent(tool);
    }
  }

  toggleLayoutVertical() {
    this.layoutVertical = !this.layoutVertical;
    this.storageService.setLocal(
      addStorageKeySuffix(StorageKey.ToolGroupLayoutVertical, this.name),
      this.layoutVertical
    );
  }

  toggleActive(tool: CwToolComponent) {
    if (tool.content || tool.noContentSwitchMode) {
      tool.active = !tool.active;
      tool.activeChange.emit(tool.active);
    } else {
      tool.activeChange.emit(true);
    }
  }

  toggleCollapse() {
    this.collapse = !this.collapse;
    this.storageService.setLocal(addStorageKeySuffix(StorageKey.ToolGroupCollapse, this.name), this.collapse);
  }
}
