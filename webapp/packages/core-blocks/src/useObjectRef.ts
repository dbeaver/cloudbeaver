/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AnnotationsMap, makeObservable, observable } from 'mobx';
import { useState } from 'react';

export function useObjectRef<T extends Record<any, any>>(
  init: T & ThisType<T>,
  update?: (T extends Record<any, any> ? Partial<T> & ThisType<T> : never) | null,
  observed?: boolean | AnnotationsMap<T, never>,
  bind?: Array<keyof T>
): T {
  const [ref] = useState(() => {
    if (observed === true) {
      observable(init, undefined, { deep: false });
    } else if (typeof observed === 'object') {
      makeObservable(init, observed, { deep: false });
    }

    if (bind) {
      bindFunctions(init, bind);
    }

    return init;
  });

  if (update !== null) {
    if (update) {
      Object.assign(ref, update);

      if (bind) {
        bind = bind.filter(key => key in update);
      }
    } else {
      Object.assign(ref, init);
    }

    if (bind && bind.length > 0) {
      bindFunctions(ref, bind);
    }
  }

  return ref;
}

function bindFunctions<T>(object: T, keys: Array<keyof T>): void {
  for (const key of keys) {
    const value = object[key];

    if (typeof value === 'function') {
      object[key] = value.bind(object);
    }
  }
}
