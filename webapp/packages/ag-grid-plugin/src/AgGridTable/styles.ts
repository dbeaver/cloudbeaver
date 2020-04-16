/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ThemeSelector } from '@dbeaver/core/src/theming';

export const agGridStyles: ThemeSelector = async (theme) => {
  const styles = theme === 'dark'
    ? await import('../styles/themes/dark.module.scss')
    : await import('../styles/themes/light.module.scss');
  return styles.default;
};
