/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed, observable, makeObservable } from 'mobx';

import './styles/main/normalize.pure.css';
import './styles/main/base.pure.css';
import './styles/main/fonts.pure.css';
import './styles/main/app-loading-screen.pure.css';
import './styles/main/elevation.pure.scss';
import './styles/main/typography.pure.scss';
import './styles/main/color.pure.scss';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DbeaverError, NotificationService } from '@cloudbeaver/core-events';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { SettingsService } from '@cloudbeaver/core-settings';

import { themes } from './themes';
import { defaultThemeSettings, ThemeSettingsService } from './ThemeSettingsService';
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
  currentThemeId: string;
}

@injectable()
export class ThemeService extends Bootstrap {
  get themes(): ITheme[] {
    return Array.from(this.themeMap.values());
  }

  get defaultThemeId(): string {
    if (this.themeSettingsService.settings.isValueDefault('defaultTheme')) {
      return this.themeSettingsService.deprecatedSettings.getValue('defaultTheme');
    }

    return this.themeSettingsService.settings.getValue('defaultTheme');
  }

  get currentThemeId(): string {
    return this.settings.currentThemeId;
  }

  get currentTheme(): ITheme {
    let theme = this.themeMap.get(this.currentThemeId);

    if (!theme) {
      theme = this.themeMap.get(defaultThemeSettings.defaultTheme)!;
    }

    return theme;
  }

  readonly onThemeChange: ISyncExecutor<ITheme>;

  private readonly themeMap: Map<string, ITheme> = new Map();
  private readonly settings: ISettings;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
    private readonly themeSettingsService: ThemeSettingsService
  ) {
    super();

    this.settings = getDefaultThemeSettings();
    this.onThemeChange = new SyncExecutor();

    makeObservable<ThemeService, 'themeMap' | 'settings' | 'setCurrentThemeId'>(this, {
      themes: computed,
      currentTheme: computed,
      defaultThemeId: computed,
      themeMap: observable.shallow,
      settings: observable,
      setCurrentThemeId: action,
    });
  }

  register(): void {
    this.loadAllThemes();
  }

  async load(): Promise<void> {
    await this.serverConfigResource.load();
    this.setCurrentThemeId(this.defaultThemeId); // set default app theme
    this.settingsService.registerSettings(
      THEME_SETTINGS_KEY,
      this.settings,
      getDefaultThemeSettings,
      () => this.tryChangeTheme(this.currentThemeId)
    ); // load user state theme
    await this.tryChangeTheme(this.currentThemeId);
  }

  getThemeStyles(themeId: string): ClassCollection[] {
    const theme = this.themeMap.get(themeId);

    if (!theme) {
      this.notificationService.logError({ title: `Theme ${themeId} not found.` });
      return COMMON_STYLES;
    }
    return [...COMMON_STYLES, theme.styles!];
  }

  async changeTheme(themeId: string): Promise<void> {
    await this.tryChangeTheme(themeId);
  }

  private async tryChangeTheme(themeId: string): Promise<void> {
    try {
      await this.loadThemeStylesAsync(themeId);
    } catch (e: any) {
      if (themeId !== defaultThemeSettings.defaultTheme) {
        return this.tryChangeTheme(defaultThemeSettings.defaultTheme); // try to fallback to default theme
      }
      throw e;
    }

    this.setCurrentThemeId(themeId);
  }

  private setCurrentThemeId(themeId: string) {
    this.settings.currentThemeId = themeId;
    this.onThemeChange.execute(this.currentTheme);
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

function getDefaultThemeSettings(): ISettings {
  return {
    currentThemeId: defaultThemeSettings.defaultTheme,
  };
}