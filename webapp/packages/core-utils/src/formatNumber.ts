/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function formatNumber(n: number, d: number) {
  if (n < 1000) {
    return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  const numStr = n.toString();
  const exponent = numStr.length - (numStr.length % 3);

  const power = Math.pow(10, d);
  const rounded = Math.round((n * power) / Math.pow(10, exponent)) / power;

  const units = ' kMBTPE';
  const unit = units[exponent / 3]!;

  return rounded + unit;
}
