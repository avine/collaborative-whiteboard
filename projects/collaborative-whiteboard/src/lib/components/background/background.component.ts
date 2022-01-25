import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { DEFAULT_OWNER, getDefaultBackground, getDefaultBackgroundColor } from '../../cw.config';
import { Background, Owner } from '../../cw.types';
import { getDomUID } from '../../utils';

@Component({
  selector: 'cw-background',
  templateUrl: './background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwBackgroundComponent {
  @Input() set owner(owner: Owner) {
    this.ownerSnapshot = owner;
  }

  @Input() background = getDefaultBackground();

  @Output() backgroundChange = new EventEmitter<Background>();

  private ownerSnapshot = DEFAULT_OWNER;

  colors = getDefaultBackgroundColor();

  checkboxId = getDomUID();

  emit() {
    this.backgroundChange.emit({ ...this.background, owner: this.ownerSnapshot });
  }

  reset() {
    this.background = getDefaultBackground(this.ownerSnapshot);
    this.emit();
  }
}
