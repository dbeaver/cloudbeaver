/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { errorOf } from '../errorOf.js';

export class PromiseCancelledError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export function isPromiseCancelledError(error: any): boolean {
  return errorOf(error, PromiseCancelledError) !== undefined;
}
