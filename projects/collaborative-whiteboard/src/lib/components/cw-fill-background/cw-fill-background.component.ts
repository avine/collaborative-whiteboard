import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { getDefaultFillBackground, getDefaultFillBackgroundColor } from '../../cw.config';
import { FillBackground } from '../../cw.types';
import { getUID } from '../../cw.utils';

@Component({
  selector: 'cw-fill-background',
  templateUrl: './cw-fill-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwFillBackgroundComponent {
  @Input() fillBackground = getDefaultFillBackground();

  @Output() fillBackgroundChange = new EventEmitter<FillBackground>();

  colors = getDefaultFillBackgroundColor();

  checkboxId = getUID();

  emit() {
    this.fillBackgroundChange.emit({ ...this.fillBackground });
  }

  reset() {
    this.fillBackground = getDefaultFillBackground();
    this.emit();
  }
}
