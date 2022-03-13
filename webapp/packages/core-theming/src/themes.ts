/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITheme } from './ThemeService';

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
