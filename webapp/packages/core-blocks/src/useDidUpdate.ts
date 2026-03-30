/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type DependencyList, type EffectCallback, useLayoutEffect, useRef } from 'react';

/**
 * @name useDidUpdate
 * @description – Hook that triggers the effect callback on updates

 * @param {EffectCallback} effect The effect callback
 * @param {DependencyList} [deps] The dependencies list for the effect
 *
 * @example
 * useDidUpdate(() => console.log("effect runs on updates"), deps);
 */
export const useDidUpdate = (effect: EffectCallback, deps?: DependencyList) => {
  const mountedRef = useRef(false);

  useLayoutEffect(
    () => () => {
      mountedRef.current = false;
    },
    [],
  );

  useLayoutEffect(() => {
    if (mountedRef.current) {
      return effect();
    }

    mountedRef.current = true;
    return undefined;
  }, deps);
};
