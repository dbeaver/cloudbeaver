/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { THEME_ID } from './themes.js';
import { computed, makeObservable, observable } from 'mobx';

const QUERY_SYSTEM_THEME_SET = new Set<string>(['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)']);

@injectable()
export class SystemThemeService extends Bootstrap {
  private themeId: THEME_ID;

  constructor() {
    super();
    this.themeId = this.getThemeId();

    makeObservable<this, 'themeId'>(this, {
      themeId: observable.ref,
      systemThemeId: computed,
    });
  }

  get systemThemeId(): THEME_ID {
    return this.themeId;
  }

  override register(): void | Promise<void> {
    this.subscribeSystemThemeChange();
  }

  override dispose(): void {
    this.unsubscribeSystemThemeChange();
  }

  private unsubscribeSystemThemeChange(): void {
    for (const query of QUERY_SYSTEM_THEME_SET) {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.removeEventListener('change', this.handleSystemThemeChange.bind(this));
    }
  }

  private subscribeSystemThemeChange(): void {
    for (const query of QUERY_SYSTEM_THEME_SET) {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', this.handleSystemThemeChange.bind(this));
    }
  }

  private handleSystemThemeChange(): void {
    this.themeId = this.getThemeId();
  }

  private getThemeId(): THEME_ID {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isLight = window.matchMedia('(prefers-color-scheme: light)').matches;

    switch (true) {
      case isDark:
        return THEME_ID.DARK;
      case isLight:
        return THEME_ID.LIGHT;
      default:
        break;
    }

    // fallback to light theme if no theme is detected
    return THEME_ID.LIGHT;
  }
}
