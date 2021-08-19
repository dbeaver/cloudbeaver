/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AnnotationsMap, makeObservable, createAtom, IAtom, observable, action } from 'mobx';
import { useEffect, useState } from 'react';

type State<T> = [T, (update: T) => IAtom[]];

export function useObservableRef<T extends Record<any, any>>(
  init: () => T & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  update: false,
  bind?: Array<keyof T>
): T;
export function useObservableRef<T extends Record<any, any>, U extends Record<any, any>>(
  init: () => T & ThisType<T & U>,
  observed: AnnotationsMap<T & U, never>,
  update: U & ThisType<T & U>,
  bind?: Array<keyof (T & U)>
): T & U;
export function useObservableRef<T extends Record<any, any>>(
  init: T & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  bind?: Array<keyof T>
): T;
export function useObservableRef<T extends Record<any, any>>(
  init: () => Partial<T> & ThisType<T>,
  observed: AnnotationsMap<T, never>,
  update: Partial<T> & ThisType<T>,
  bind?: Array<keyof T>
): T;
export function useObservableRef<T extends Record<any, any>>(
  init: T | (() => T),
  observed: AnnotationsMap<T, never>,
  update?: Array<keyof T> | T | false,
  bind?: Array<keyof T>
): T {
  if (Array.isArray(update)) {
    bind = update;
    update = undefined;
  }

  if (update === undefined) {
    update = typeof init === 'function' ? init() : init;
  }

  const [[ref, patch]] = useState<State<T>>(() => {
    const state = typeof init === 'function' ? init() : init;
    const atoms = new Map<string, IAtom>();
    const observedWithoutRefs: AnnotationsMap<T, never> = {};
    let delayUpdate = true;
    let firstPatch = true;

    if (update) {
      Object.assign(state, update);
      update = undefined;
    }

    const fullState: T = Object.assign({}, state);

    function batch(fn: () => void) {
      delayUpdate = true;
      fn();
      delayUpdate = false;
    }

    function patch(update: T): IAtom[] {
      if (firstPatch) {
        firstPatch = false;
        return [];
      }
      const updatedAtoms: IAtom[] = [];
      batch(() => {
        for (const key in update as T) {
          const atom = atoms.get(key);

          if (atom) {
            updatedAtoms.push(atom);
            fullState[key] = update[key];
          } else {
            state[key] = update[key];
          }
        }

        if (bind) {
          bind = bind.filter(key => (key as any) in (update as T));

          if (bind.length > 0) {
            bindFunctions(fullState, bind);
          }
        }
      });

      return updatedAtoms;
    }

    for (const key in observed) {
      const annotation = observed[key];

      if (annotation === observable.ref) {
        const atom = createAtom(key);

        atoms.set(key, atom);

        Object.defineProperty(state, key, {
          get() {
            if (!delayUpdate) {
              atom.reportObserved();
            }
            return fullState[key];
          },
          set(value) {
            fullState[key as keyof T] = value;

            if (!delayUpdate) {
              atom.reportChanged();
            }
          },
        });
      } else {
        (observedWithoutRefs as any)[key] = annotation;
      }
    }
    delayUpdate = false;

    makeObservable(state, observedWithoutRefs, { deep: false });

    if (bind) {
      bindFunctions(state, bind);
    }

    return [state, patch];
  });

  let updatedAtoms: IAtom[] = [];

  if (update) {
    updatedAtoms = patch(update);
  }

  useEffect(() => {
    action(() => {
      for (const atom of updatedAtoms) {
        atom.reportChanged();
      }
    });
  });

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
