import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-canvas-basic',
  templateUrl: './canvas-basic.component.html',
  styleUrls: ['./canvas-basic.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CanvasBasicComponent {}
