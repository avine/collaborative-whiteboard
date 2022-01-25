import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import {
  CwBackgroundComponent,
  CwCanvasComponent,
  CwColorPickerComponent,
  CwDrawModeComponent,
  CwDrawSettingsComponent,
  CwIconComponent,
  CwToolComponent,
  CwToolContentComponent,
  CwToolGroupComponent,
  CwWhiteboardComponent,
} from './components';
import { CwEmitPreviewDirective, CwPointerDirective, CwSelectionPreviewDirective } from './directives';
import { CwStorageService } from './services';

const components = [
  CwBackgroundComponent,
  CwCanvasComponent,
  CwColorPickerComponent,
  CwDrawModeComponent,
  CwDrawSettingsComponent,
  CwIconComponent,
  CwToolComponent,
  CwToolContentComponent,
  CwToolGroupComponent,
  CwWhiteboardComponent,
];

const directives = [CwEmitPreviewDirective, CwPointerDirective, CwSelectionPreviewDirective];

@NgModule({
  imports: [CommonModule, FormsModule, DragDropModule, OverlayModule, PortalModule],
  declarations: [components, directives],
  exports: [components, directives],
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
