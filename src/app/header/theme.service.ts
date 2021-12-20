import { DOCUMENT } from '@angular/common';
import { Inject, Injectable, RendererFactory2 } from '@angular/core';

import { ThemeName } from './theme.config';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private renderer = this.rendererFactory.createRenderer(null, null);

  private themeName!: ThemeName;

  get name(): ThemeName {
    return this.themeName;
  }

  get altName(): ThemeName {
    return this.themeName === 'light' ? 'dark' : 'light';
  }

  private readonly DEFAULT: ThemeName = 'dark';

  constructor(@Inject(DOCUMENT) private document: Document, private rendererFactory: RendererFactory2) {
    this.restoreTheme();
  }

  setTheme(name: ThemeName) {
    const oldName: ThemeName = name === 'light' ? 'dark' : 'light';
    this.renderer.removeClass(this.document.documentElement, `theme--${oldName}`);
    this.renderer.addClass(this.document.documentElement, `theme--${name}`);
    this.themeName = name;
    this.storeTheme();
  }

  switchTheme() {
    this.setTheme(this.themeName === 'light' ? 'dark' : 'light');
  }

  private restoreTheme() {
    const themeName = this.document.defaultView?.localStorage.getItem('app-theme');
    this.setTheme((themeName as ThemeName) || this.DEFAULT);
  }

  private storeTheme() {
    this.document.defaultView?.localStorage.setItem('app-theme', this.themeName);
  }
}
