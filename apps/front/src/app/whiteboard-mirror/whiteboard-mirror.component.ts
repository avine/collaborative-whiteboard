import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DrawTransport } from '@collaborative-whiteboard/lib';

@Component({
  selector: 'app-whiteboard-mirror',
  templateUrl: './whiteboard-mirror.component.html',
  styleUrls: ['./whiteboard-mirror.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhiteboardMirrorComponent {
  clone(drawTransport: DrawTransport): DrawTransport {
    if (drawTransport.action === 'add') {
      return {
        ...drawTransport,
        events: drawTransport.events.map((event) => ({ ...event })),
      };
    }
    return drawTransport;
  }
}
