/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ColorConvert } from '@dbeaver/js-helpers';

export function normalizeColorToHex(color: string): string {
  return ColorConvert(color).hex();
}

export function normalizeColorToRgb(color: string): string {
  return ColorConvert(color).rgb().string();
}
