import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';

import { ToolContentPosition } from './cw-tool-content.types';

@Component({
  selector: 'cw-tool-content',
  templateUrl: './cw-tool-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CwToolContentComponent {
  @Input() title!: string;

  @Input() content!: TemplateRef<any>;

  @Output() focused = new EventEmitter<void>();

  @Output() dispose = new EventEmitter<void>();

  @Output() position = new EventEmitter<ToolContentPosition>();

  handleTouchEvent(event: Event) {
    // Prevent further "mouse" event from being fired when "touch" event is detected.
    event.preventDefault();
    this.focused.emit();
  }

  emitPosition(dragElement: HTMLElement) {
    const { top, left } = dragElement.getBoundingClientRect();
    this.position.emit({ top, left });
  }
}
