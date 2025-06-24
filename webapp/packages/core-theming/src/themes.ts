/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITheme } from './ThemeService.js';
import type { ClassCollection } from './themeUtils.js';

const emptyTheme = {};

export enum THEME_ID {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export const themes: ITheme[] = [
  {
    name: 'ui_light_theme',
    id: THEME_ID.LIGHT,
    loader: async (): Promise<ClassCollection> => {
      const styles = await import('./styles/main/light.theme.scss');
      return styles.default || emptyTheme;
    },
  },
  {
    name: 'ui_dark_theme',
    id: THEME_ID.DARK,
    loader: async (): Promise<ClassCollection> => {
      const styles = await import('./styles/main/dark.theme.scss');
      return styles.default || emptyTheme;
    },
  },
  {
    name: 'ui_system_theme',
    id: THEME_ID.SYSTEM,
    loader: (): ClassCollection => emptyTheme,
  },
];

export const DEFAULT_THEME_ID = THEME_ID.SYSTEM;
export const UNKNOWN_SYSTEM_THEME_FALLBACK = THEME_ID.LIGHT;
