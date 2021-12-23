import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { getDefaultDrawBackground } from '../../cw.config';

import { DrawBackground } from '../../cw.types';
import { StorageKey, StorageService } from '../../utils/storage';

@Component({
  selector: 'cw-draw-background',
  templateUrl: './cw-draw-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwDrawBackgroundComponent {
  @Input() drawBackground: DrawBackground = getDefaultDrawBackground();

  @Output() drawBackgroundChange = new EventEmitter<DrawBackground>();

  constructor(private storageService: StorageService) {}

  emit() {
    this.drawBackgroundChange.emit({ ...this.drawBackground });
    this.storageService.setLocal(StorageKey.DrawBackground, this.drawBackground);
  }

  reset() {
    this.drawBackground = getDefaultDrawBackground();
    this.emit();
  }
}
