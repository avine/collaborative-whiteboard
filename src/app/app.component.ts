import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { faDownload, faUserCircle } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  userIcon = faUserCircle;
  update = faDownload;

  popup: 'update' | '' = '';

  constructor(@Inject(DOCUMENT) private document: Document) {}

  closePopup(reload = false) {
    this.popup = '';
    if (reload) {
      this.document.defaultView?.location.reload();
    }
  }
}
