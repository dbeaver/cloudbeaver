/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable } from 'mobx';

import './styles/main/normalize.css';
import './styles/main/elevation.scss';
import './styles/main/typography.scss';
import './styles/main/color.scss';
import { injectable } from '@cloudbeaver/core-di';
import { DbeaverError, NotificationService } from '@cloudbeaver/core-events';
import { SettingsService } from '@cloudbeaver/core-settings';

import { themes } from './themes';
import { ClassCollection } from './themeUtils';

const COMMON_STYLES: any[] = [];

export interface ITheme {
  name: string;
  id: string;
  styles?: ClassCollection; // will be populated after execution ITheme.loader()
  loader: () => Promise<ClassCollection>;
}

const THEME_SETTINGS_KEY = 'themeSettings';
const DEFAULT_THEME_ID = 'light';

@injectable()
export class ThemeService {

  @computed get themes(): ITheme[] {
    return Array.from(this.themeMap.values());
  }

  get currentThemeId() {
    return this.settings.currentThemeId;
  }

  @computed get currentTheme(): ITheme {
    let theme = this.themeMap.get(this.settings.currentThemeId);
    if (!theme) {
      theme = this.themeMap.get(DEFAULT_THEME_ID)!;
    }

    return theme;
  }

  @observable.shallow private themeMap: Map<string, ITheme> = new Map();
  @observable private settings = {
    currentThemeId: DEFAULT_THEME_ID,
  };

  constructor(private notificationService: NotificationService,
              private settingsService: SettingsService) {
    this.loadAllThemes();
  }

  async init() {
    this.settingsService.registerSettings(this.settings, THEME_SETTINGS_KEY);
    await this.changeThemeAsync(this.currentThemeId);
  }

  getThemeStyles(themeId: string): ClassCollection[] {
    const theme = this.themeMap.get(themeId);

    if (!theme) {
      this.notificationService.logError({ title: `Theme ${themeId} not found.` });
      return COMMON_STYLES;
    }
    return [...COMMON_STYLES, theme.styles as ClassCollection];
  }

  async changeThemeAsync(themeId: string): Promise<void> {
    try {
      await this.loadThemeStylesAsync(themeId);
    } catch (e) {
      if (themeId !== DEFAULT_THEME_ID) {
        return this.changeThemeAsync(DEFAULT_THEME_ID); // try to fallback to default theme
      }
      throw e;
    }
    return this.setCurrentThemeId(themeId);
  }

  @action
  private setCurrentThemeId(themeId: string) {
    this.settings.currentThemeId = themeId;
  }

  private loadAllThemes(): void {
    for (const theme of themes) {
      this.themeMap.set(theme.id, theme);
    }
  }

  private async loadThemeStylesAsync(id: string): Promise<void> {
    const theme = this.themeMap.get(id);
    if (!theme) {
      throw new DbeaverError({ message: `Theme ${id} not found.` });
    }

    if (!theme.styles) {
      theme.styles = await theme.loader();
    }
  }
}
