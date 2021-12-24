import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CwCanvasComponent } from './components/cw-canvas/cw-canvas.component';
import { CwPointerDirective } from './components/cw-canvas/cw-pointer.directive';
import { CwColorPickerComponent } from './components/cw-color-picker/cw-color-picker.component';
import { CwCutComponent } from './components/cw-cut/cw-cut.component';
import { CwDrawLineComponent } from './components/cw-draw-line/cw-draw-line.component';
import { CwFillBackgroundComponent } from './components/cw-fill-background/cw-fill-background.component';
import { CwIconComponent } from './components/cw-icon/cw-icon.component';
import { CwToolContentComponent } from './components/cw-tool-content/cw-tool-content.component';
import { CwToolGroupComponent } from './components/cw-tool-group/cw-tool-group.component';
import { CwToolComponent } from './components/cw-tool/cw-tool.component';
import { CwWhiteboardComponent } from './components/cw-whiteboard/cw-whiteboard.component';
import { StorageService } from './utils/storage';

const features = [
  CwCanvasComponent,
  CwColorPickerComponent,
  CwCutComponent,
  CwDrawLineComponent,
  CwFillBackgroundComponent,
  CwIconComponent,
  CwToolContentComponent,
  CwToolGroupComponent,
  CwToolComponent,
  CwWhiteboardComponent,
  CwPointerDirective,
];

@NgModule({
  declarations: [features],
  imports: [CommonModule, FormsModule, DragDropModule, OverlayModule, PortalModule],
  exports: [features],
  entryComponents: [CwToolContentComponent],
})
export class CwModule {
  static forRoot(): ModuleWithProviders<CwModule> {
    return { ngModule: CwModule, providers: [StorageService] };
  }

  static forChild(): ModuleWithProviders<CwModule> {
    return { ngModule: CwModule };
  }
}
