/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useObjectRef } from './useObjectRef';

export function useInterval(callback: () => void, delay: number | null) {
  const state = useObjectRef({ callback });

  useEffect(() => {
    if (delay === null) {
      return;
    }

    const tick = () => {
      state.callback();
    };

    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}