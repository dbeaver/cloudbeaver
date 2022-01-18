/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function declensionOfNumber(value: number, words: string[]) {
  value = Math.abs(value) % 100;
  const num = value % 10;
  if (value > 10 && value < 20) {
    return words[2];
  }

  if (num > 1 && num < 5) {
    return words[1];
  }

  if (num === 1) {
    return words[0];
  }

  return words[2];
}
