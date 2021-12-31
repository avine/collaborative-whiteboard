import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CwCanvasComponent } from './components/canvas/canvas.component';
import { CwPointerDirective } from './components/canvas/pointer.directive';
import { CwColorPickerComponent } from './components/color-picker/color-picker.component';
import { CwCutComponent } from './components/cut/cut.component';
import { CwDrawModeComponent } from './components/draw-mode/draw-mode.component';
import { CwDrawSettingsComponent } from './components/draw-settings/draw-settings.component';
import { CwFillBackgroundComponent } from './components/fill-background/fill-background.component';
import { CwIconComponent } from './components/icon/icon.component';
import { CwToolContentComponent } from './components/tool-content/tool-content.component';
import { CwToolGroupComponent } from './components/tool-group/tool-group.component';
import { CwToolComponent } from './components/tool/tool.component';
import { CwWhiteboardComponent } from './components/whiteboard/whiteboard.component';
import { CwStorageService } from './services/storage';

const features = [
  CwCanvasComponent,
  CwPointerDirective,
  CwColorPickerComponent,
  CwCutComponent,
  CwDrawModeComponent,
  CwDrawSettingsComponent,
  CwFillBackgroundComponent,
  CwIconComponent,
  CwToolContentComponent,
  CwToolGroupComponent,
  CwToolComponent,
  CwWhiteboardComponent,
];

@NgModule({
  declarations: [features],
  imports: [CommonModule, FormsModule, DragDropModule, OverlayModule, PortalModule],
  exports: [features],
  entryComponents: [CwToolContentComponent],
})
export class CwModule {
  static forRoot(): ModuleWithProviders<CwModule> {
    return { ngModule: CwModule, providers: [CwStorageService] };
  }

  static forChild(): ModuleWithProviders<CwModule> {
    return { ngModule: CwModule };
  }
}
