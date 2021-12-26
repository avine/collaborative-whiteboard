import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { faDownload, faUserCircle } from '@fortawesome/free-solid-svg-icons';

import { isAppVersionOutdated } from './app.utils';
import { APP_VERSION } from './app.version';

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

  appVersion = APP_VERSION;

  constructor(@Inject(DOCUMENT) private document: Document) {
    this.clearStorageOnNewVersion();
  }

  clearStorageOnNewVersion() {
    const localStorage = this.document.defaultView?.localStorage;
    if (!localStorage) {
      return;
    }
    if (isAppVersionOutdated(localStorage.getItem('app-version'))) {
      localStorage.clear();
      localStorage.setItem('app-version', this.appVersion);

      // TODO: Show message about the this action...
    }
  }

  closePopup(reload = false) {
    this.popup = '';
    if (reload) {
      this.document.defaultView?.location.reload();
    }
  }
}
