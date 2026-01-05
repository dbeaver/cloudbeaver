/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getPercentile(sorted: number[], percentile: number): number {
  const n = sorted.length;
  if (n === 1) {
    return sorted[0]!;
  }
  const idx = (n - 1) * percentile;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  const t = idx - lo;
  return (1 - t) * sorted[lo]! + t * sorted[hi]!;
}
