import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { getDefaultDrawOptions } from '../../cw.config';
import { DrawOptions } from '../../cw.types';
import { StorageKey, StorageService } from '../../utils/storage';

@Component({
  selector: 'cw-draw-line',
  templateUrl: './cw-draw-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwDrawLineComponent {
  @Input() lineWidthMax = 50;

  @Input() drawOptions = getDefaultDrawOptions();

  @Output() drawOptionsChange = new EventEmitter<DrawOptions>();

  constructor(private storageService: StorageService) {}

  emit() {
    this.drawOptionsChange.emit({ ...this.drawOptions });
    this.storageService.setLocal(StorageKey.DrawOptions, this.drawOptions);
  }
}
