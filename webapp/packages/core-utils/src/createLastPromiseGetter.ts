/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export type LastPromiseGetterKey = Array<string | number | boolean | undefined | null>;
export type LastPromiseGetter<R> = (key: LastPromiseGetterKey, query: () => Promise<R>, reset?: boolean) => Promise<R>;
export function createLastPromiseGetter<R>(): LastPromiseGetter<R> {
  let lastKey: LastPromiseGetterKey | undefined = undefined;
  let lastPromise: Promise<R> | undefined = undefined;

  return async (key: LastPromiseGetterKey, getter: () => Promise<R>, reset?: boolean) => {
    const currentKeyStr = JSON.stringify(key);

    if (reset) {
      lastKey = undefined;
    }

    const lastKeyStr = lastKey ? JSON.stringify(lastKey) : undefined;

    if (currentKeyStr !== lastKeyStr) {
      lastKey = key;
      lastPromise = getter();
    }

    return lastPromise!;
  };
}
