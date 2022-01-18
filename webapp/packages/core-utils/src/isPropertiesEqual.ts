/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isPropertiesEqual<T>(first: T, second: T): boolean {
  if (
    first === null
    || second === null
    || typeof first !== 'object'
    || typeof second !== 'object'
  ) {
    return false;
  }

  const firstProperties = Object.entries(first);
  const secondProperties = Object.entries(second);

  if (firstProperties.length !== secondProperties.length) {
    return false;
  }

  for (const [key, value] of firstProperties) {
    if (second[key as keyof T] !== value) {
      return false;
    }
  }

  return true;
}
