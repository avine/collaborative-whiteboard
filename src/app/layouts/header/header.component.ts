import { ChangeDetectionStrategy, Component } from '@angular/core';
import { faTint, faUser, faEllipsisV } from '@fortawesome/free-solid-svg-icons';

import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  themeIcon = faTint;
  userIcon = faUser;
  burger = faEllipsisV;

  isDropdownClosed = true;

  constructor(public themeService: ThemeService) {}
}
