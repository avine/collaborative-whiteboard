import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-whiteboard-mirror',
  templateUrl: './whiteboard-mirror.component.html',
  styleUrls: ['./whiteboard-mirror.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhiteboardMirrorComponent {}
