/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function replaceMiddle(value: string, newMiddle: string, sideLength: number, limiter: number): string {
  if (value.length < limiter) {
    return value;
  }

  return value.substring(0, sideLength) + newMiddle + value.substring(value.length - sideLength);
}
