/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ITypedConstructor } from './ITypedConstructor';

/**
 * there are no way in js to check that function is constructor. So we expect that <T> is object, not function
 * @param obj
 */
export function isConstructor<T>(obj: T | ITypedConstructor<T>): obj is ITypedConstructor<T> {
  return typeof obj === 'function';
}
