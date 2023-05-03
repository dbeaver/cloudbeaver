/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { untracked } from 'mobx';
import { useEffect, useState } from 'react';


import { DataContext } from './DataContext';
import { DynamicDataContext } from './DynamicDataContext';
import type { IDataContext } from './IDataContext';

export function useDynamicDataContext(
  context: IDataContext | undefined,
  capture: (context: IDataContext) => void
): void {
  const [state] = useState(() => new DynamicDataContext(context || new DataContext()));

  untracked(() => {
    if (context) {
      state.setFallBack(context);
    }
  });

  useEffect(() => {
    capture(state);
  });

  useEffect(() => () => state.flush(), []);
}
