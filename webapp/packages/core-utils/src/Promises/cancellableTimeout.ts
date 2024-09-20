/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CancellablePromise } from './CancellablePromise.js';

export function cancellableTimeout(timeout: number): CancellablePromise<void> {
  return new CancellablePromise<void>(resolve => {
    const token = setTimeout(() => resolve(), timeout);
    return () => {
      clearTimeout(token);
    };
  });
}
