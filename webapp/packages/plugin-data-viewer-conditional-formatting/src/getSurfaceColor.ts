/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// TODO: implement universal color palette for conditional coloring and use it instead
export function getSurfaceColor(themeType: 'dark' | 'light' | undefined): string {
  return themeType === 'dark' ? '#25252d' : '#ffffff';
}
