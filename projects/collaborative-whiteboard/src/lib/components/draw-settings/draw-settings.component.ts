import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { getDefaultDrawOptions } from '../../cw.config';
import { DrawOptions } from '../../cw.types';

@Component({
  selector: 'cw-draw-settings',
  templateUrl: './draw-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwDrawSettingsComponent {
  @Input() lineWidthMax = 40;

  @Input() drawOptions = getDefaultDrawOptions();

  @Output() drawOptionsChange = new EventEmitter<DrawOptions>();

  emit() {
    this.drawOptionsChange.emit({ ...this.drawOptions });
  }
}
