/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ThemeSelector } from '@cloudbeaver/core-theming';

export const agGridStyles: ThemeSelector = async (theme) => {
  let styles: any;

  switch (theme) {
    case 'dark':
      styles = await import('./themes/dark.module.scss');
      break;
    default:
      styles = await import('./themes/light.module.scss');
      break;
  }

  return [styles.default];
};
