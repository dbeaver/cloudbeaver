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

const DARK_QUERY = '(prefers-color-scheme: dark)';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

@injectable()
export class SystemThemeService extends Bootstrap {
  private dynamicTheme: ITheme;

  constructor(
    private readonly themeService: ThemeService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
    this.dynamicTheme = this.getDynamicTheme();

    makeObservable<this, 'dynamicTheme'>(this, {
      dynamicTheme: observable.ref,
    });
  }

  override register(): void | Promise<void> {
    const systemThemeService = this;
    this.themeService.addTheme({
      id: 'system',
      name: 'System Theme',
      get class(): string {
        return systemThemeService.dynamicTheme!.class;
      },
      loaded: false,
      async loader() {
        await systemThemeService.themeService.loadTheme(systemThemeService.dynamicTheme.id);
      },
    });
    this.subscribeSystemThemeChange();

    this.settingsResolverService.addResolver(ROOT_SETTINGS_LAYER, {
      onChange: new SyncExecutor(),
      has: function (key: any): boolean {
        return key === 'core.theming.theme';
      },
      isEdited: function (key?: any): boolean {
        return false;
      },
      isReadOnly: function (key: any): boolean {
        return true;
      },
      getValue: function (key: any) {
        if (key === 'core.theming.theme') {
          return 'system';
        }
        return undefined;
      },
      getEditedValue: function (key: any) {
        if (key === 'core.theming.theme') {
          return 'system';
        }
        return undefined;
      },
      setValue: function (key: any, value: any): void {},
      save: async function (): Promise<void> {},
      clear: function (): void {},
    });
    this.unsubscribeSystemThemeChange();
  }

  override dispose(): void {
    this.unsubscribeSystemThemeChange();
  }

  private unsubscribeSystemThemeChange(): void {
    window.matchMedia(DARK_QUERY).removeEventListener('change', this.handleSystemThemeChange.bind(this));
    window.matchMedia(LIGHT_QUERY).removeEventListener('change', this.handleSystemThemeChange.bind(this));
  }

  private subscribeSystemThemeChange(): void {
    window.matchMedia(DARK_QUERY).addEventListener('change', this.handleSystemThemeChange.bind(this));
    window.matchMedia(LIGHT_QUERY).addEventListener('change', this.handleSystemThemeChange.bind(this));
  }

  private handleSystemThemeChange(): void {
    this.dynamicTheme = this.getDynamicTheme();
    this.themeService.loadTheme(this.dynamicTheme.id);
  }

  private getDynamicTheme(): ITheme {
    const isDark = window.matchMedia(DARK_QUERY).matches;
    const isLight = window.matchMedia(LIGHT_QUERY).matches;

    switch (true) {
      case isDark:
        return this.themeService.themes.find(theme => theme.id === 'dark') || this.themeService.themes[0]!;
      case isLight:
        return this.themeService.themes.find(theme => theme.id === 'light') || this.themeService.themes[0]!;
      default:
        break;
    }

    return this.themeService.themes[0]!;
  }
}
