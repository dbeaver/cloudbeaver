/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isArraysEqual<T>(first: T[], second: T[]): boolean {
  if (first.length !== second.length) {
    return false;
  }

  return !first.some(value => !second.includes(value));
}
