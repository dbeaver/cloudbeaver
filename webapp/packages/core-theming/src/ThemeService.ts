/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService, UIError } from '@cloudbeaver/core-events';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { SettingsService } from '@cloudbeaver/core-settings';

import type { Style } from './ComponentStyle';
import './styles/main/base.pure.css';
import './styles/main/color.pure.scss';
import './styles/main/elevation.pure.scss';
import './styles/main/fonts.pure.css';
import './styles/main/normalize.pure.css';
import './styles/main/typography.pure.scss';
import { DEFAULT_THEME_ID, themes } from './themes';
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
  currentThemeId: string;
}

export interface IStyleRegistry {
  mode: 'replace' | 'append';
  styles: Style[];
}

@injectable()
export class ThemeService extends Bootstrap {
  get themes(): ITheme[] {
    return Array.from(this.themeMap.values());
  }

  get defaultThemeId(): string {
    return this.themeSettingsService.settings.getValue('defaultTheme');
  }

  get currentThemeId(): string {
    return this.settings.currentThemeId;
  }

  get currentTheme(): ITheme {
    let theme = this.themeMap.get(this.currentThemeId);

    if (!theme) {
      theme = this.themeMap.get(DEFAULT_THEME_ID)!;
    }

    return theme;
  }

  readonly onChange: ISyncExecutor<ITheme>;

  private readonly stylesRegistry: Map<Style, IStyleRegistry[]> = new Map();
  private readonly themeMap: Map<string, ITheme> = new Map();
  private readonly settings: ISettings;

  constructor(
    private readonly serverConfigResource: ServerConfigResource,
    private readonly notificationService: NotificationService,
    private readonly settingsService: SettingsService,
    private readonly themeSettingsService: ThemeSettingsService,
  ) {
    super();

    this.settings = getDefaultThemeSettings();
    this.onChange = new SyncExecutor();

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

  addStyleRegistry<T extends Record<string, string>>(style: Style<T>, mode: 'replace' | 'append', styles: Style<T>[]): void {
    if (!this.stylesRegistry.has(style)) {
      this.stylesRegistry.set(style, []);
    }

    this.stylesRegistry.get(style)!.push({ mode, styles });
  }

  mapStyles<T extends Record<string, string>>(styles: Style<T>[], context?: Map<Style, IStyleRegistry[]>): Style<T>[] {
    return styles
      .map(style => {
        const registries = this.stylesRegistry.get(style) ?? context?.get(style);

        if (!registries) {
          return [style];
        }

        return registries.reduce(
          (acc, registry) => {
            if (registry.mode === 'replace') {
              acc = acc.filter(s => s !== style);
            }

            return [...acc, ...this.mapStyles(registry.styles, context)] as Style<T>[];
          },
          [style] as Style<T>[],
        );
      })
      .flat();
  }

  async load(): Promise<void> {
    await this.serverConfigResource.load();
    this.setCurrentThemeId(this.defaultThemeId); // set default app theme
    this.settingsService.registerSettings(THEME_SETTINGS_KEY, this.settings, getDefaultThemeSettings, undefined, () =>
      this.setTheme(this.currentThemeId),
    ); // load user state theme
    await this.setTheme(this.currentThemeId);
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
    if (themeId === this.currentThemeId) {
      return;
    }
    await this.setTheme(themeId);
    this.onChange.execute(this.currentTheme);
  }

  async setTheme(themeId: string): Promise<void> {
    await this.tryChangeTheme(themeId);
  }

  private async tryChangeTheme(themeId: string): Promise<void> {
    try {
      await this.loadThemeStylesAsync(themeId);
    } catch (e: any) {
      if (themeId !== DEFAULT_THEME_ID) {
        return this.tryChangeTheme(DEFAULT_THEME_ID); // try to fallback to default theme
      }
      throw e;
    }

    this.setCurrentThemeId(themeId);
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
      throw new UIError(`Theme ${id} not found.`);
    }

    if (!theme.styles) {
      theme.styles = await theme.loader();
    }
  }
}

function getDefaultThemeSettings(): ISettings {
  return {
    currentThemeId: DEFAULT_THEME_ID,
  };
}
