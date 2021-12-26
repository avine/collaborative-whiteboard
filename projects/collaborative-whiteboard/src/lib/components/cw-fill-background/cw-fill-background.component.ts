import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { defaultOwner, getDefaultFillBackground, getDefaultFillBackgroundColor } from '../../cw.config';
import { FillBackground, Owner } from '../../cw.types';
import { getUID } from '../../cw.utils';

@Component({
  selector: 'cw-fill-background',
  templateUrl: './cw-fill-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwFillBackgroundComponent {
  @Input() set owner(owner: Owner) {
    this.ownerSnapshot = owner;
  }

  @Input() fillBackground = getDefaultFillBackground();

  @Output() fillBackgroundChange = new EventEmitter<FillBackground>();

  private ownerSnapshot = defaultOwner;

  colors = getDefaultFillBackgroundColor();

  checkboxId = getUID();

  emit() {
    this.fillBackgroundChange.emit({ ...this.fillBackground, owner: this.ownerSnapshot });
  }

  reset() {
    this.fillBackground = getDefaultFillBackground(this.ownerSnapshot);
    this.emit();
  }
}
