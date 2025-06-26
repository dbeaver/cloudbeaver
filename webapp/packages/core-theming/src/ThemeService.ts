/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { UIError } from '@cloudbeaver/core-events';

import type { Style } from './ComponentStyle.js';
import './styles/main/base.pure.css';
import './styles/main/color.pure.scss';
import './styles/main/elevation.pure.scss';
import './styles/main/fonts.pure.css';
// TODO: important to keep normalize first
import './styles/main/normalize.pure.css';
import './styles/main/typography.pure.scss';
import './styles/UiIconButton.css';
import './styles/UiSpinner.css';
import './styles/UiInput.css';
import { DEFAULT_THEME_ID, emptyTheme, THEME_OPTIONS_ID, type IStyleRegistry, type ITheme, type IThemeService, type THEME_ID } from './themes.js';
import { ThemeSettingsService } from './ThemeSettingsService.js';
import { computed, makeObservable, observable, reaction, type IReactionDisposer } from 'mobx';
import { SyncExecutor, type ISyncExecutor } from '@cloudbeaver/core-executor';

@injectable()
export class ThemeService extends Bootstrap {
  private readonly loadedThemes: Set<THEME_ID> = new Set();
  private readonly themeServiceMap: Map<THEME_OPTIONS_ID, IThemeService>;
  private readonly stylesRegistry: Map<Style, IStyleRegistry[]> = new Map();
  private reactionDisposer: IReactionDisposer | null;
  readonly onChange: ISyncExecutor<THEME_ID>;

  get themes(): ITheme[] {
    return Array.from(this.themeServiceMap.values().map(themeService => themeService.theme));
  }

  get settingsThemeId(): THEME_OPTIONS_ID {
    return this.themeSettingsService.theme;
  }

  get currentThemeService(): IThemeService | undefined {
    let themeService = this.themeServiceMap.get(this.settingsThemeId);

    if (!themeService) {
      themeService = this.themeServiceMap.get(DEFAULT_THEME_ID);
    }

    return themeService;
  }

  get currentTheme(): ITheme | undefined {
    return this.currentThemeService?.theme;
  }

  get themeId(): THEME_ID | undefined {
    return this.currentThemeService?.themeId;
  }

  constructor(private readonly themeSettingsService: ThemeSettingsService) {
    super();
    this.themeServiceMap = new Map();
    this.reactionDisposer = null;
    this.onChange = new SyncExecutor();

    makeObservable<this, 'themeServiceMap'>(this, {
      themeServiceMap: observable.deep,
      themeId: computed,
      themes: computed,
      settingsThemeId: computed,
      currentThemeService: computed,
      currentTheme: computed,
    });
  }

  override register(): void {
    this.reactionDisposer = reaction(
      () => this.currentTheme,
      async theme => {
        if (theme) {
          await this.loadTheme(theme.id);

          if (this.currentThemeService) {
            this.onChange.execute(this.currentThemeService.themeId);
          }
        }
      },
      {
        fireImmediately: true,
      },
    );
  }

  override dispose(): void {
    if (this.reactionDisposer) {
      this.reactionDisposer();
      this.reactionDisposer = null;
    }
  }

  registerThemeService(themeService: IThemeService): void {
    if (this.themeServiceMap.has(themeService.theme.id)) {
      throw new Error(`Theme with id ${themeService.theme.id} is already registered.`);
    }

    this.themeServiceMap.set(themeService.theme.id, themeService);
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

  private async loadTheme(themeId: THEME_OPTIONS_ID): Promise<string> {
    try {
      await this.loadThemeStylesAsync(themeId);
      return themeId;
    } catch (e: any) {
      if (themeId !== DEFAULT_THEME_ID) {
        return this.loadTheme(DEFAULT_THEME_ID); // try to fallback to default theme
      }
      throw e;
    }
  }

  private async loadThemeStylesAsync(id: THEME_OPTIONS_ID): Promise<void> {
    const themeService = this.themeServiceMap.get(id);

    if (!themeService) {
      throw new UIError(`Theme ${id} not found.`);
    }

    const themesLoaderMap = themeService.theme.getLoadersMap();

    for (const themeService of this.themeServiceMap.values()) {
      if (this.loadedThemes.has(themeService.themeId)) {
        continue;
      }

      const styles = await themesLoaderMap.get(themeService.themeId);

      if (!styles) {
        throw new UIError(`Theme ${themeService.themeId} styles not found in ${id} theme.`);
      }

      themeService.theme.styles = styles.default || emptyTheme;
      this.loadedThemes.add(themeService.themeId);
    }
  }
}
