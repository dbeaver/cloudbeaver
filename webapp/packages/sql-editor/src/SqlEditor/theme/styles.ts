/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ThemeSelector } from '@dbeaver/core/theming';

export const SqlEditorStyles: ThemeSelector = async (theme) => {
  const styles = await import(`./${theme}.scss`);
  return styles.default;
};
