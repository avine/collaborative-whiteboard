import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import { getColorsMatrix } from '../../cw.operator';

@Component({
  selector: 'cw-color-picker',
  templateUrl: './cw-color-picker.component.html',
  styleUrls: ['./cw-color-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwColorPickerComponent {
  colorsMatrix = getColorsMatrix();

  @Input() set colors(colors: string[]) {
    this.colorsMatrix = getColorsMatrix(colors);
  }

  @Input() color!: string;

  @Output() colorChange = new EventEmitter<string>();

  updateColor(color: string) {
    this.color = color;
    this.colorChange.emit(color);
  }

  trackByColor(index: number, color: string) {
    return color;
  }
}
