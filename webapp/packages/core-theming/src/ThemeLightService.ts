/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ThemeService } from './ThemeService.js';
import { THEME_OPTIONS_ID, type ITheme, type IThemeService, type THEME_ID } from './themes.js';
import type { ClassCollection } from './themeUtils.js';
import { makeObservable, observable, computed } from 'mobx';

const LIGHT_THEME: ITheme = {
  name: 'ui_light_theme',
  id: THEME_OPTIONS_ID.LIGHT,
  loader: async (): Promise<Partial<Record<THEME_ID, ClassCollection>>> => {
    const styles = await import('./styles/main/light.theme.scss');

    return {
      light: styles.default || {},
    };
  },
};

@injectable()
export class ThemeLightService extends Bootstrap implements IThemeService {
  readonly theme: ITheme;

  constructor(private readonly themeBaseService: ThemeService) {
    super();
    this.theme = LIGHT_THEME;

    makeObservable(this, {
      theme: observable.ref,
      themeId: computed,
    });
  }

  get themeId(): THEME_ID {
    return 'light';
  }

  override register(): void {
    this.themeBaseService.registerThemeService(this);
  }
}
