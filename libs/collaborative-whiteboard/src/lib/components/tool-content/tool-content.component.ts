import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, TemplateRef } from '@angular/core';

import { ToolContentPosition } from './tool-content.types';

@Component({
  selector: 'cw-tool-content',
  templateUrl: './tool-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwToolContentComponent {
  @Input() title!: string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() content!: TemplateRef<any>;

  @Output() focused = new EventEmitter<void>();

  @Output() dispose = new EventEmitter<void>();

  @Output() position = new EventEmitter<ToolContentPosition>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  handleTouchEvent(event: Event) {
    // Prevent further "mouse" event from being fired when "touch" event is detected.
    // ! FIXME: this is NOT working on mobile device...
    // event.preventDefault();

    this.focused.emit();
  }

  emitPosition(dragElement: HTMLElement) {
    const { top, left } = dragElement.getBoundingClientRect();
    this.position.emit({ top, left });
  }
}
