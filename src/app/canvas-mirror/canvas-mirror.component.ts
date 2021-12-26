import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DrawEvent, DrawEventsBroadcast, mapToDrawEventsBroadcast } from '@collaborative-whiteboard';

@Component({
  selector: 'app-canvas-mirror',
  templateUrl: './canvas-mirror.component.html',
  styleUrls: ['./canvas-mirror.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasMirrorComponent {
  drawEventsBroadcast!: DrawEventsBroadcast;

  animate = true;

  broadcast(event: DrawEvent) {
    this.drawEventsBroadcast = mapToDrawEventsBroadcast([event], this.animate);
  }
}
