/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ThemeSelector } from '@cloudbeaver/core-theming';

import type Dark from './dark.module.scss';
import type Light from './light.module.scss';

export const DATA_GRID_BASE_STYLES: ThemeSelector = async theme => {
  let styles: typeof Light & typeof Dark;
  const dark = (await import('./dark.module.scss')).default;
  const light = (await import('./light.module.scss')).default;

  switch (theme) {
    case 'dark':
      styles = dark;
      break;
    default:
      styles = light;
      break;
  }

  return styles;
};
