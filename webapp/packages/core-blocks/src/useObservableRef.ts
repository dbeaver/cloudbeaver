/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, type AnnotationsMap, makeObservable, runInAction, untracked } from 'mobx';
import { useLayoutEffect, useState } from 'react';

import { bindFunctions } from '@cloudbeaver/core-utils';

export function useObservableRef<T extends Record<any, any>>(
  init: () => T & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  update: false,
  name?: string,
): T;
export function useObservableRef<T extends Record<any, any>>(
  init: () => T & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  update: false,
  bind?: Array<keyof T>,
  name?: string,
): T;
export function useObservableRef<T extends Record<any, any>, U extends Record<any, any>>(
  init: () => T & ThisType<T & U>,
  observed: AnnotationsMap<T & U, never>,
  update: U & ThisType<T & U>,
  bind?: Array<keyof (T & U)>,
  name?: string,
): T & U;
export function useObservableRef<T extends Record<any, any>>(
  init: T & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  bind?: Array<keyof T>,
  name?: string,
): T;
export function useObservableRef<T extends Record<any, any>>(
  init: () => Partial<T> & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  update: Partial<T> & ThisType<T>,
  bind?: Array<keyof T>,
  name?: string,
): T;
export function useObservableRef<T extends Record<any, any>>(
  init: T | (() => T),
  observed: AnnotationsMap<T, never>,
  update?: Array<keyof T> | T | false,
  bind?: Array<keyof T> | string,
  name?: string,
): T {
  if (typeof bind === 'string') {
    name = bind;
    bind = undefined;
  }

  if (Array.isArray(update)) {
    bind = update;
    update = undefined;
  }

  if (update === undefined) {
    update = typeof init === 'function' ? untracked(init as any) : init;
  }

  const [state] = useState(() => {
    let state: T = typeof init === 'function' ? untracked(init as any) : init;

    if (update) {
      runInAction(() => assign(state, update));
      update = undefined;
    }

    state = makeObservable(state, observed, { deep: false, name });

    if (bind) {
      bindFunctions(state, bind as []);
    }

    return state;
  });

  useLayoutEffect(
    action(() => {
      if (update) {
        assign(state, update);

        if (Array.isArray(bind)) {
          bind = bind.filter(key => (key as any) in (update as T));

          if (bind.length > 0) {
            bindFunctions(state, bind);
          }
        }
      }
    }),
  );

  return state;
}

function assign(object: any, update: any): void {
  for (const [key, value] of Object.entries(update)) {
    if (!(key in object) || object[key] !== value) {
      object[key] = value;
    }
  }
}
