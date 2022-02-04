import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'cw-tool',
  templateUrl: './tool.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwToolComponent {
  @Input() title!: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() content!: TemplateRef<any>;

  /**
   * By default, when `content` is NOT provided, `active` is always `false`, and `activeChange` always emits `true`.
   * When "switch mode" is enabled, `active` is alternately `true` and `false`.
   */
  @Input() noContentSwitchMode = false;

  @Input() active = false;

  @Output() activeChange = new EventEmitter<boolean>();

  private _isDisabled = false;

  @Input() set isDisabled(value: boolean) {
    if (this._isDisabled === value) {
      return;
    }
    this._isDisabled = value;

    // Here's the trick! Setting the @Input acts as a trigger to @Output the same value.
    // `CwToolComponent` is just a proxy for `CwToolGroupComponent` that subscribes to its changes
    this.isDisabledChange.emit(value);
  }
  get isDisabled() {
    return this._isDisabled;
  }

  @Output() isDisabledChange = new EventEmitter<boolean>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @ViewChild('label', { static: true }) label!: TemplateRef<any>;
}
