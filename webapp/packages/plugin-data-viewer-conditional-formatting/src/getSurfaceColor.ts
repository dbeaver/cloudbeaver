/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ThemeType } from '@cloudbeaver/core-theming';

// TODO: implement universal color palette for conditional coloring and use it instead
export function getSurfaceColor(themeType: ThemeType | undefined): string {
  return themeType === 'dark' ? '#25252d' : '#ffffff';
}
