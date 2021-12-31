import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { getColorsMatrix } from '../../utils/common';

@Component({
  selector: 'cw-color-picker',
  templateUrl: './cw-color-picker.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwColorPickerComponent {
  colorsMatrix = getColorsMatrix();

  @Input() set colors(colors: string[]) {
    this.colorsMatrix = getColorsMatrix(colors);
  }

  @Input() color!: string;

  @Input() opacity = 1;

  @Output() colorChange = new EventEmitter<string>();

  updateColor(color: string) {
    this.color = color;
    this.colorChange.emit(color);
  }

  trackByColor(index: number, color: string) {
    return color;
  }
}
