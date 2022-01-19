/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import { DataContext } from './DataContext';
import { DynamicDataContext } from './DynamicDataContext';
import type { IDataContext } from './IDataContext';

export function useDynamicDataContext(
  context: IDataContext | undefined,
  capture: (context: IDataContext) => void
): void {
  const state = useObjectRef(() => ({
    dynamic: new DynamicDataContext(context || new DataContext()),
  }));

  if (context) {
    state.dynamic.setFallBack(context);
  }

  state.dynamic.flush();
  capture(state.dynamic);

  useEffect(() => () => state.dynamic.flush(), []);
}
