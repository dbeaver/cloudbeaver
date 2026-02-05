/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface Result<T> {
  result: T | null;
  error: Error | null;
}

export async function executeAsyncSilently<T>(asyncFunction: () => Promise<T>): Promise<Result<T>> {
  let result: T | null = null;
  let error: Error | null = null;

  try {
    result = await asyncFunction();
  } catch (err: any) {
    error = err;
  }

  return { result, error };
}
