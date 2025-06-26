/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ThemeService } from './ThemeService.js';
import { THEME_OPTIONS_ID, type ITheme, type IThemeService, type THEME_ID, type ThemeLoadersMap } from './themes.js';
import { action, computed, makeObservable, observable } from 'mobx';

const SYSTEM_THEME: ITheme = {
  name: 'ui_system_theme',
  id: THEME_OPTIONS_ID.SYSTEM,
  getLoadersMap: (): ThemeLoadersMap =>
    new Map([
      ['light', import('./styles/main/light.theme.scss')],
      ['dark', import('./styles/main/dark.theme.scss')],
    ]),
};

const SYSTEM_THEMES_QUERIES_MAP = new Map<THEME_OPTIONS_ID, string>([
  [THEME_OPTIONS_ID.DARK, '(prefers-color-scheme: dark)'],
  [THEME_OPTIONS_ID.LIGHT, '(prefers-color-scheme: light)'],
]);

const UNKNOWN_SYSTEM_THEME_FALLBACK: THEME_ID = 'light';

@injectable()
export class ThemeSystemService extends Bootstrap implements IThemeService {
  readonly theme: ITheme;
  private themeType: THEME_ID;

  constructor(private readonly themeBaseService: ThemeService) {
    super();
    this.getThemeType = this.getThemeType.bind(this);
    this.theme = SYSTEM_THEME;
    this.themeType = this.getThemeType();

    makeObservable<this, 'themeType' | 'handleSystemThemeChange'>(this, {
      themeType: observable.ref,
      theme: observable.ref,
      handleSystemThemeChange: action.bound,
      themeId: computed,
    });
  }

  get themeId(): THEME_ID {
    return this.themeType;
  }

  override register(): void {
    this.themeBaseService.registerThemeService(this);
    this.subscribeSystemThemeChange();
  }

  override dispose(): void {
    this.disposeSystemThemeChange();
  }

  private getThemeType(): THEME_ID {
    const isDark = window.matchMedia(SYSTEM_THEMES_QUERIES_MAP.get(THEME_OPTIONS_ID.DARK)!).matches;
    const isLight = window.matchMedia(SYSTEM_THEMES_QUERIES_MAP.get(THEME_OPTIONS_ID.LIGHT)!).matches;

    if (isDark) {
      return 'dark';
    }

    if (isLight) {
      return 'light';
    }

    return UNKNOWN_SYSTEM_THEME_FALLBACK;
  }

  private handleSystemThemeChange(): void {
    this.themeType = this.getThemeType();
  }

  private subscribeSystemThemeChange(): void {
    SYSTEM_THEMES_QUERIES_MAP.forEach(query => {
      const mediaQuery = window.matchMedia(query);

      mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    });
  }

  private disposeSystemThemeChange(): void {
    SYSTEM_THEMES_QUERIES_MAP.forEach(query => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    });
  }
}
