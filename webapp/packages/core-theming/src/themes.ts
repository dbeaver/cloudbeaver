/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITheme } from './ThemeService.js';

const emptyTheme = {};

export const themes: ITheme[] = [
  {
    name: 'ui_light_theme',
    id: 'light',
    loader: async () => {
      const styles = await import('./styles/main/light.theme.scss');
      return styles.default || emptyTheme;
    },
  },
  {
    name: 'ui_dark_theme',
    id: 'dark',
    loader: async () => {
      const styles = await import('./styles/main/dark.theme.scss');
      return styles.default || emptyTheme;
    },
  },
];

export const DEFAULT_THEME_ID = themes[0]!.id;
