import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { getDefaultDrawBackground } from '../../cw.config';

import { DrawBackground } from '../../cw.types';

@Component({
  selector: 'cw-draw-background',
  templateUrl: './cw-draw-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwDrawBackgroundComponent {
  @Input() drawBackground = getDefaultDrawBackground();

  @Output() drawBackgroundChange = new EventEmitter<DrawBackground>();

  emit() {
    this.drawBackgroundChange.emit({ ...this.drawBackground });
  }

  reset() {
    this.drawBackground = getDefaultDrawBackground();
    this.emit();
  }
}
