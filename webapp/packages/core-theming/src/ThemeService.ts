/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, type IReactionDisposer, makeObservable, observable, reaction } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { UIError } from '@cloudbeaver/core-events';
import { type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';

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
import { DEFAULT_THEME_ID, themes } from './themes.js';
import { ThemeSettingsService } from './ThemeSettingsService.js';
import type { ClassCollection } from './themeUtils.js';

export interface ITheme {
  name: string;
  id: string;
  styles?: ClassCollection; // will be populated after execution ITheme.loader()
  loader: () => Promise<ClassCollection>;
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

  get themeId(): string {
    return this.themeSettingsService.theme;
  }

  get currentTheme(): ITheme {
    let theme = this.themeMap.get(this.themeId);

    if (!theme) {
      theme = this.themeMap.get(DEFAULT_THEME_ID)!;
    }

    return theme;
  }

  readonly onChange: ISyncExecutor<ITheme>;

  private readonly stylesRegistry: Map<Style, IStyleRegistry[]> = new Map();
  private readonly themeMap: Map<string, ITheme> = new Map();
  private reactionDisposer: IReactionDisposer | null;

  constructor(private readonly themeSettingsService: ThemeSettingsService) {
    super();

    this.reactionDisposer = null;
    this.onChange = new SyncExecutor();

    makeObservable<ThemeService, 'themeMap'>(this, {
      themes: computed,
      currentTheme: computed,
      themeId: computed,
      themeMap: observable.shallow,
    });
  }

  override register(): void {
    this.loadAllThemes();
    this.reactionDisposer = reaction(
      () => this.currentTheme,
      theme => this.loadTheme(theme.id),
      {
        fireImmediately: true,
      },
    );
  }

  override dispose(): void {
    if (this.reactionDisposer) {
      this.reactionDisposer();
    }
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

  override async load(): Promise<void> {
    await this.loadTheme(this.themeId);
  }

  async changeTheme(themeId: string): Promise<void> {
    if (themeId === this.themeId) {
      return;
    }
    await this.setTheme(themeId);
    this.onChange.execute(this.currentTheme);
  }

  private async setTheme(themeId: string): Promise<void> {
    themeId = await this.loadTheme(themeId);

    this.themeSettingsService.settings.setValue('core.theming.theme', themeId);
    await this.themeSettingsService.settings.save();
  }

  private async loadTheme(themeId: string): Promise<string> {
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
