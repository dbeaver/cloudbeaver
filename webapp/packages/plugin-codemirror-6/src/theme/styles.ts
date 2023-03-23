/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ThemeSelector } from '@cloudbeaver/core-theming';

export const SqlEditorStyles: ThemeSelector = async theme => {
  let styles: any;

  switch (theme) {
    case 'dark':
      styles = await import('./dark.module.scss');
      break;
    default:
      styles = await import('./light.module.scss');
      break;
  }

  return styles.default;
};
