/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function isValuesEqual<T extends string | boolean | number>(
  first: T | null | undefined,
  second: T | null | undefined,
  defaultValue?: T
): boolean {
  return (first ?? defaultValue) === (second ?? defaultValue);
}
