/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ITheme } from './ThemeService.js';

export const themes: ITheme[] = [
  {
    name: 'ui_light_theme',
    id: 'light',
    class: 'light',
    loaded: false,
    loader: async (): Promise<void> => {
      await import('./styles/main/light.theme.scss');
    },
  },
  {
    name: 'ui_dark_theme',
    id: 'dark',
    class: 'dark',
    loaded: false,
    loader: async (): Promise<void> => {
      await import('./styles/main/dark.theme.scss');
    },
  },
];

export const FALLBACK_THEME_ID = themes[0]!.id;
