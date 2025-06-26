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
import { computed, makeObservable, observable } from 'mobx';

const DARK_THEME: ITheme = {
  name: 'ui_dark_theme',
  id: THEME_OPTIONS_ID.DARK,
  getLoadersMap: (): ThemeLoadersMap => new Map([['dark', import('./styles/main/dark.theme.scss')]]),
};

@injectable()
export class ThemeDarkService extends Bootstrap implements IThemeService {
  readonly theme: ITheme;

  constructor(private readonly themeBaseService: ThemeService) {
    super();
    this.theme = DARK_THEME;

    makeObservable(this, {
      theme: observable.ref,
      themeId: computed,
    });
  }

  get themeId(): THEME_ID {
    return 'dark';
  }

  override register(): void {
    this.themeBaseService.registerThemeService(this);
  }
}
