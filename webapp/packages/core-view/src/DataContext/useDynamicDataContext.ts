/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';
import { useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import { DataContext } from './DataContext';
import type { DataContextGetter } from './DataContextGetter';
import { DynamicDataContext } from './DynamicDataContext';
import type { IDataContext } from './IDataContext';

export function useDynamicDataContext(context: IDataContext | undefined): IDataContext {
  const state = useObjectRef(() => ({
    dynamic: new DynamicDataContext(context || new DataContext()),
    contexts: [] as Array<DataContextGetter<any>>,
  }));

  if (context) {
    state.dynamic.setFallBack(context);
  }
  state.contexts = state.dynamic.contexts;
  state.dynamic.flush();

  useEffect(action(() => {
    for (const context of state.contexts) {
      if (!state.dynamic.contexts.includes(context)) {
        state.dynamic.delete(context);
      }
    }
  }));

  return state.dynamic;
}
