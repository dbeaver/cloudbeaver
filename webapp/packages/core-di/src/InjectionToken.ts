/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITypedConstructor } from './ITypedConstructor';

/**
 * Use this token to inject value as a service
 */
export type ValueToken<T> = () => T;

/**
 * there are two types of tokens in the application: tokens for classes and tokens for values (class instances)
 */
export type InjectionToken<T> = ITypedConstructor<T> | ValueToken<T>;

export function createValueToken<T extends Record<string, any>>(
  obj: string | ITypedConstructor<T> | T
): ValueToken<T> {
  // just fake function to keep type T
  const token = () => null as unknown as T;
  const name = getName(obj);
  Object.defineProperty(token, 'name', { value: name, writable: false });

  return token;
}

function getName(obj: any): string {
  if (!obj) {
    return 'unknown';
  }
  if (typeof obj === 'string') {
    return obj;
  }
  if (typeof obj === 'object') {
    if (obj.constructor) {
      return obj.constructor.name || 'unknown';
    }
  } else if (typeof obj === 'function') {
    return obj.name || 'unknown';
  }
  return 'unexpected';
}
