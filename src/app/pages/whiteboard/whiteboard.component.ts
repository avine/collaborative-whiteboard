import { Subject } from 'rxjs';

import { DOCUMENT } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { DrawEvent, DrawTransport } from '@collaborative-whiteboard';

@Component({
  selector: 'app-whiteboard',
  templateUrl: './whiteboard.component.html',
  styleUrls: ['./whiteboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhiteboardComponent implements AfterViewInit {
  broadcastFromHistory$ = new Subject<DrawTransport>();

  constructor(@Inject(DOCUMENT) private document: Document) {}

  ngAfterViewInit() {
    const storedHistory = this.document.defaultView?.localStorage.getItem('app-draw-history');
    if (!storedHistory) {
      return;
    }
    // Prevent ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() =>
      this.broadcastFromHistory$.next({
        action: 'add',
        events: JSON.parse(storedHistory),
      })
    );
  }

  storeHistory(history: DrawEvent[]) {
    this.document.defaultView?.localStorage.setItem('app-draw-history', JSON.stringify(history));
  }
}
