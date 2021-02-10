/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITheme } from './ThemeService';

export const themes: ITheme[] = [
  {
    name: 'Light',
    id: 'light',
    loader: async () => {
      const styles = await import('./styles/theme-light.module.scss');
      return styles.default;
    },
  },
  {
    name: 'Dark',
    id: 'dark',
    loader: async () => {
      const styles = await import('./styles/theme-dark.module.scss');
      return styles.default;
    },
  },
];
