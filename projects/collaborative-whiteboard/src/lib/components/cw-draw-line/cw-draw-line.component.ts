import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { DrawOptions } from '../../cw.model';
import { getDefaultDrawOptions } from '../../cw.operator';

@Component({
  selector: 'cw-draw-line',
  templateUrl: './cw-draw-line.component.html',
  styleUrls: ['./cw-draw-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwDrawLineComponent {
  @Input() lineWidthMax = 30;

  @Input() drawOptions = getDefaultDrawOptions();

  @Output() drawOptionsChange = new EventEmitter<DrawOptions>();

  emit() {
    this.drawOptionsChange.emit(this.drawOptions);
  }
}
