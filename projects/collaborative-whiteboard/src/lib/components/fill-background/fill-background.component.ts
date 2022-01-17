import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { DEFAULT_OWNER, getDefaultFillBackground, getDefaultFillBackgroundColor } from '../../cw.config';
import { FillBackground, Owner } from '../../cw.types';
import { getDomUID } from '../../utils';

@Component({
  selector: 'cw-fill-background',
  templateUrl: './fill-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwFillBackgroundComponent {
  @Input() set owner(owner: Owner) {
    this.ownerSnapshot = owner;
  }

  @Input() fillBackground = getDefaultFillBackground();

  @Output() fillBackgroundChange = new EventEmitter<FillBackground>();

  private ownerSnapshot = DEFAULT_OWNER;

  colors = getDefaultFillBackgroundColor();

  checkboxId = getDomUID();

  emit() {
    this.fillBackgroundChange.emit({ ...this.fillBackground, owner: this.ownerSnapshot });
  }

  reset() {
    this.fillBackground = getDefaultFillBackground(this.ownerSnapshot);
    this.emit();
  }
}
