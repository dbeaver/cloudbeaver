/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ICachedValueObject<T> {
  readonly invalid: boolean;
  value(getter: () => T): T;
  invalidate(): void;
}

export function cacheValue<T>(): ICachedValueObject<T> {
  let value: T;
  let invalid = true;

  return {
    value(getter: () => T) {
      if (invalid) {
        value = getter();
        invalid = false;
      }
      return value;
    },
    get invalid() {
      return invalid;
    },
    invalidate() {
      invalid = true;
    },
  };
}