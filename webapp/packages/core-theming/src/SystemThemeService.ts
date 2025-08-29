/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { makeObservable, observable } from 'mobx';
import { ThemeService, type ITheme } from './ThemeService.js';
import { ROOT_SETTINGS_LAYER, SettingsResolverService } from '@cloudbeaver/core-settings';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { IThemeSettingsKey } from './ThemeSettingsService.js';

const DARK_QUERY = '(prefers-color-scheme: dark)';

@injectable(() => [ThemeService, SettingsResolverService])
export class SystemThemeService extends Bootstrap {
  private dynamicTheme: ITheme | null;
  private readonly mediaQueryList: MediaQueryList;

  constructor(
    private readonly themeService: ThemeService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.dynamicTheme = null;
    this.updateSystemTheme = this.updateSystemTheme.bind(this);
    this.mediaQueryList = window.matchMedia(DARK_QUERY);

    makeObservable<this, 'dynamicTheme'>(this, {
      dynamicTheme: observable.ref,
    });
  }

  override register(): void | Promise<void> {
    const systemThemeService = this;
    this.themeService.addTheme({
      id: 'system',
      name: 'ui_system_theme',
      get class(): string {
        return systemThemeService.dynamicTheme?.class || '';
      },
      loaded: false,
      async loader() {
        await systemThemeService.updateSystemTheme();
        if (systemThemeService.dynamicTheme) {
          await systemThemeService.themeService.loadTheme(systemThemeService.dynamicTheme.id);
        }
      },
    });

    this.subscribeSystemThemeChange();

    this.settingsResolverService.addResolver(ROOT_SETTINGS_LAYER, {
      onChange: new SyncExecutor(),
      has: function (key: IThemeSettingsKey): boolean {
        return key === 'core.theming.theme';
      },
      getValue: function (key: IThemeSettingsKey) {
        if (key === 'core.theming.theme') {
          return 'system';
        }
        return undefined;
      },
      getEditedValue(key) {
        if (key === 'core.theming.theme') {
          return 'system';
        }
        return undefined;
      },
      isEdited() {
        return false;
      },
    });
  }

  override dispose(): void {
    this.unsubscribeSystemThemeChange();
  }

  private unsubscribeSystemThemeChange(): void {
    this.mediaQueryList.removeEventListener('change', this.updateSystemTheme);
  }

  private subscribeSystemThemeChange(): void {
    this.mediaQueryList.addEventListener('change', this.updateSystemTheme);
  }

  private async updateSystemTheme(): Promise<void> {
    this.dynamicTheme = this.getDynamicTheme();
    if (this.dynamicTheme && this.themeService.themeId === 'system') {
      await this.themeService.loadTheme(this.dynamicTheme.id);
    }
  }

  private getDynamicTheme(): ITheme | null {
    const isDark = window.matchMedia(DARK_QUERY).matches;

    if (isDark) {
      return this.themeService.themes.find(theme => theme.id === 'dark') || this.themeService.themes[0] || null;
    }

    return this.themeService.themes.find(theme => theme.id === 'light') || this.themeService.themes[0] || null;
  }
}
