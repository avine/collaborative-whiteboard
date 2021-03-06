import { ThemeService } from 'src/app/services/theme.service';

import { Component, OnInit } from '@angular/core';
import { faTint } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  themeIcon = faTint;

  constructor(public themeService: ThemeService) {}

  ngOnInit() {}
}
