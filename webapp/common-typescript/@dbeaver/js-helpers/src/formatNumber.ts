/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function formatNumber(n: number, d: number): string {
  if (n < 1000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: d ? Math.max(0, d) : 2 });
  }

  const digits = Math.floor(Math.log10(n)) + 1;
  const unitIndex = Math.floor((digits - 1) / 3);
  const exponent = unitIndex * 3;

  const power = Math.pow(10, d);
  const rounded = Math.round((n * power) / Math.pow(10, exponent)) / power;

  const units = ' kMBTPE';
  const unit = units[unitIndex]!;

  return rounded + unit;
}
