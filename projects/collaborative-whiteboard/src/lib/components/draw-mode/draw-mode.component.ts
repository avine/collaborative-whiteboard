import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { DEFAULT_DRAW_MODE } from '../../cw.config';
import { DrawMode } from '../../cw.types';

@Component({
  selector: 'cw-draw-mode',
  templateUrl: './draw-mode.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwDrawModeComponent {
  @Input() drawMode: DrawMode = DEFAULT_DRAW_MODE;

  @Output() drawModeChange = new EventEmitter<DrawMode>();

  list: DrawMode[] = ['brush', 'line', 'rectangle', 'ellipse'];
}
