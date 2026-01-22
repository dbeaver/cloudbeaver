/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { replaceMiddle } from '@cloudbeaver/core-utils';

export function getMenuLabelClipped(
  label: string,
  sideLength: number = 8,
  limiter: number = 30,
): { clippedLabel: string; tooltip: string | undefined } {
  const clippedLabel = replaceMiddle(label, ' ... ', sideLength, limiter);
  const tooltip = clippedLabel !== label ? label : undefined;

  return { clippedLabel, tooltip };
}
