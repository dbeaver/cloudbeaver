/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

export function useObjectRef<T extends Record<any, any>>(
  init: () => T & ThisType<T>,
  update: false,
  bind?: Array<keyof T>
): T;
export function useObjectRef<T extends Record<any, any>>(
  init: () => T & ThisType<T>
): T;
export function useObjectRef<T extends Record<any, any>, U extends Record<any, any>>(
  init: () => (T & ThisType<T & U>),
  update: U & ThisType<T & U>,
  bind?: Array<keyof (T & U)>
): T & U;
export function useObjectRef<T extends Record<any, any>>(
  init: T & ThisType<T>,
  bind?: Array<keyof T>
): T;
export function useObjectRef<T extends Record<any, any>>(
  init: () => Partial<T> & ThisType<T>,
  update: Partial<T> & ThisType<T>,
  bind?: Array<keyof T>
): T;
export function useObjectRef<T extends Record<any, any>, U extends Record<any, any>>(
  init: (() => (T & ThisType<T & U>)) | (T & ThisType<T & U>),
  update?: (U & ThisType<T & U>) | Array<keyof (T & U)> | false,
  bind?: Array<keyof (T & U)>
): T & U {
  if (Array.isArray(update)) {
    bind = update;
    update = undefined;
  }

  if (update === undefined && arguments.length === 1) {
    update = typeof init === 'function' ? init() : init;
  }

  const [ref] = useState(() => {
    const state = typeof init === 'function' ? init() : init;

    if (bind) {
      bindFunctions(state, bind);
    }

    return state;
  });

  if (update) {
    Object.assign(ref, update);

    if (bind) {
      bind = bind.filter(key => (key as any) in (update as T & U));

      if (bind.length > 0) {
        bindFunctions(ref, bind);
      }
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
