import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { getDefaultFillBackground } from '../../cw.config';

import { FillBackground } from '../../cw.types';

@Component({
  selector: 'cw-fill-background',
  templateUrl: './cw-fill-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwFillBackgroundComponent {
  @Input() fillBackground = getDefaultFillBackground();

  @Output() fillBackgroundChange = new EventEmitter<FillBackground>();

  emit() {
    this.fillBackgroundChange.emit({ ...this.fillBackground });
  }

  reset() {
    this.fillBackground = getDefaultFillBackground();
    this.emit();
  }
}
