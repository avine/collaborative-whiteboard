import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { getDefaultFillBackground } from '../../cw.config';
import { DrawConfig } from '../../cw.types';
import { StorageKey, StorageService } from '../../utils/storage';

@Component({
  selector: 'cw-fill-background',
  templateUrl: './cw-fill-background.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwFillBackgroundComponent {
  @Input() options: Pick<DrawConfig, 'bgColor' | 'bgOpacity'> = getDefaultFillBackground();

  @Output() optionsChange = new EventEmitter<Pick<DrawConfig, 'bgColor' | 'bgOpacity'>>();

  constructor(private storageService: StorageService) {}

  reset() {
    this.options = getDefaultFillBackground();
    this.emit();
  }

  emit() {
    this.optionsChange.emit({ ...this.options });
    this.storageService.setLocal(StorageKey.FillBackground, this.options);
  }
}
