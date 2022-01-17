import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CwCanvasComponent,
  CwColorPickerComponent,
  CwDrawModeComponent,
  CwDrawSettingsComponent,
  CwFillBackgroundComponent,
  CwIconComponent,
  CwToolComponent,
  CwToolContentComponent,
  CwToolGroupComponent,
  CwWhiteboardComponent,
} from './components';
import { CwPointerDirective } from './directives/pointer.directive';
import { CwStorageService } from './services/storage';

const features = [
  CwCanvasComponent,
  CwColorPickerComponent,
  CwDrawModeComponent,
  CwDrawSettingsComponent,
  CwFillBackgroundComponent,
  CwIconComponent,
  CwToolComponent,
  CwToolContentComponent,
  CwToolGroupComponent,
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
    return { ngModule: CwModule, providers: [CwStorageService] };
  }

  static forChild(): ModuleWithProviders<CwModule> {
    return { ngModule: CwModule };
  }
}
