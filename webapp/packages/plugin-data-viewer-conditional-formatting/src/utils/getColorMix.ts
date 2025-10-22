/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { clamp } from './clamp.js';

export function getColorMix(color1: string, color2: string, ratio: number): string {
  const percent = clamp(ratio * 100, 0, 100);
  return `color-mix(in oklab, ${color1} calc(100% - ${percent}%), ${color2} ${percent}%)`;
}
