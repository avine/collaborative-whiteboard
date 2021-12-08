import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { faEllipsisV, faMoon, faSun, faUserCircle } from '@fortawesome/free-solid-svg-icons';

import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  burger = faEllipsisV;
  darkThemeIcon = faMoon;
  lightThemeIcon = faSun;
  userIcon = faUserCircle;

  isDropdownClosed = true;

  private delay!: any;

  private readonly DELAY = 400;

  constructor(public themeService: ThemeService, private changeDetectorRef: ChangeDetectorRef) {}

  toggleDropDown() {
    this.isDropdownClosed = !this.isDropdownClosed;
  }

  closeDropdown() {
    this.isDropdownClosed = true;
  }

  delayCloseDropDown() {
    this.delay = setTimeout(() => {
      this.closeDropdown();
      this.changeDetectorRef.detectChanges();
    }, this.DELAY);
  }

  cancelDelay() {
    clearTimeout(this.delay);
  }
}
