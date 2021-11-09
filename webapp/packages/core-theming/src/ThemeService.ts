/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable, makeObservable } from 'mobx';

import './styles/main/normalize.css';
import './styles/main/app-loading-screen.css';
import './styles/main/elevation.scss';
import './styles/main/typography.scss';
import './styles/main/color.scss';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DbeaverError, NotificationService } from '@cloudbeaver/core-events';
import { SettingsService } from '@cloudbeaver/core-settings';

import { themes } from './themes';
import { ThemeSettingsService } from './ThemeSettingsService';
import type { ClassCollection } from './themeUtils';

const COMMON_STYLES: any[] = [];
const THEME_SETTINGS_KEY = 'themeSettings';

export interface ITheme {
  name: string;
  id: string;
  styles?: ClassCollection; // will be populated after execution ITheme.loader()
  loader: () => Promise<ClassCollection>;
}

interface ISettings {
  currentThemeId?: string;
}

@injectable()
export class ThemeService extends Bootstrap {
  get themes(): ITheme[] {
    return Array.from(this.themeMap.values());
  }

  get defaultTheme(): string {
    return this.themeSettingsService.settings.getValue('defaultTheme');
  }

  get currentThemeId(): string {
    return this.settings.currentThemeId || this.defaultTheme;
  }

  get currentTheme(): ITheme {
    return this.themeMap.get(this.currentThemeId)!;
  }

  private readonly themeMap: Map<string, ITheme> = new Map();
  private readonly settings: ISettings = {};

  constructor(
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
    private readonly themeSettingsService: ThemeSettingsService,
  ) {
    super();

    makeObservable<ThemeService, 'themeMap' | 'settings' | 'setCurrentThemeId'>(this, {
      themes: computed,
      currentTheme: computed,
      defaultTheme: computed,
      themeMap: observable.shallow,
      settings: observable,
      setCurrentThemeId: action,
    });
  }

  register(): void {
    this.loadAllThemes();
  }

  async load(): Promise<void> {
    this.setCurrentThemeId(this.defaultTheme);
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
      if (themeId !== this.defaultTheme) {
        return this.changeThemeAsync(this.defaultTheme); // try to fallback to default theme
      }
      throw e;
    }
    return this.setCurrentThemeId(themeId);
  }

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
