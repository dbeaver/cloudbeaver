/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { normalizeColorToRgb } from './colorUtils.js';

export function isLightColor(color: string): boolean {
  const rgb = normalizeColorToRgb(color);
  // Parse rgb(r, g, b) format
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) {
    return false;
  }

  const r = parseInt(match[1]!, 10);
  const g = parseInt(match[2]!, 10);
  const b = parseInt(match[3]!, 10);

  // Calculate relative luminance using the formula from WCAG
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // If luminance > 0.5, it's a light color
  return luminance > 0.5;
}
