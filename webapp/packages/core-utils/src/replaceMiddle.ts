/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function replaceMiddle(value: string, newMiddle: string, sideLength: number, limiter: number): string {
  if (value.length < limiter) {
    return value;
  }

  return value.substr(0, sideLength) + newMiddle + value.substr(value.length - sideLength);
}
