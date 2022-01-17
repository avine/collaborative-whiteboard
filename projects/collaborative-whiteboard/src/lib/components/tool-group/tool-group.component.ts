import { Subscription } from 'rxjs';
import { first, startWith } from 'rxjs/operators';

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

import { addStorageKeySuffix, CwStorageService, StorageKey } from '../../services';
import { CwToolContentComponent } from '../tool-content/tool-content.component';
import { ToolContentPosition } from '../tool-content/tool-content.types';
import { CwToolComponent } from '../tool/tool.component';

@Component({
  selector: 'cw-tool-group',
  templateUrl: './tool-group.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwToolGroupComponent implements AfterViewInit, OnDestroy {
  @Input() name!: string;

  @Input() layoutVertical = false;

  @Input() dragBoundarySelector!: string;

  @ContentChildren(CwToolComponent) tools!: QueryList<CwToolComponent>;

  @ViewChild('portal', { read: ViewContainerRef })
  portal!: ViewContainerRef;

  private activeTools = new Map<CwToolComponent, { overlayRef: OverlayRef; subscriptions: Subscription }>();

  private toolPositions = new Map<CwToolComponent, ToolContentPosition>();

  private readonly toolPropsSubscriptions = new Subscription();
  private readonly toolsChangeSubscription = new Subscription();

  collapse = this.storageService.getLocal(addStorageKeySuffix(StorageKey.ToolGroupCollapse, this.name), false);

  private overlayZIndex = 1000;

  constructor(
    private storageService: CwStorageService,
    private overlay: Overlay,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    this.watchToolPropsChange();
    this.watchToolsChange();
  }

  ngOnDestroy() {
    this.unwatchToolPropsChange();
    this.unwatchToolsChange();
    this.closeAllContent();
  }

  private watchToolPropsChange() {
    this.tools.forEach((tool) => {
      this.toolPropsSubscriptions.add(tool.isDisabledChange.subscribe(() => this.changeDetectorRef.detectChanges()));
      this.toolPropsSubscriptions.add(tool.activeChange.subscribe(() => this.checkContent(tool)));
      this.checkContent(tool);
    });
  }

  private unwatchToolPropsChange() {
    this.toolPropsSubscriptions.unsubscribe();
  }

  private watchToolsChange() {
    this.toolsChangeSubscription.add(
      this.tools.changes.subscribe(() => {
        this.checkActiveTools();
        this.unwatchToolPropsChange();
        this.watchToolPropsChange();
      })
    );
  }

  private unwatchToolsChange() {
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
    // positionStrategy
    const positionStrategy = this.overlay.position().global();
    const toolPosition = this.toolPositions.get(tool);
    if (!toolPosition) {
      positionStrategy.centerHorizontally().centerVertically();
    } else {
      positionStrategy.top(`${toolPosition.top}px`).left(`${toolPosition.left}px`);
    }
    const overlayRef = this.overlay.create({ positionStrategy });

    // componentRef
    const componentRef = overlayRef.attach(new ComponentPortal(CwToolContentComponent));
    componentRef.instance.title = tool.title;
    componentRef.instance.content = tool.content;
    componentRef.instance.dispose.pipe(first()).subscribe(() => this.toggleActive(tool));

    // subscriptions
    const subscriptions = new Subscription();
    subscriptions.add(
      componentRef.instance.focused.pipe(startWith(true)).subscribe(() => {
        overlayRef.hostElement.style.zIndex = (++this.overlayZIndex).toString();
      })
    );
    subscriptions.add(
      componentRef.instance.position.subscribe((position) => {
        this.toolPositions.set(tool, position);
      })
    );
    this.activeTools.set(tool, { overlayRef, subscriptions });
  }

  private closeContent(tool: CwToolComponent) {
    this.activeTools.get(tool)?.overlayRef.dispose();
    this.activeTools.get(tool)?.subscriptions.unsubscribe();
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
