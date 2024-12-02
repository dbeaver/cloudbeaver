/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useLayoutEffect, useState } from 'react';

import { DataContext } from './DataContext.js';
import type { IDataContext } from './IDataContext.js';
import type { IDataContextProvider } from './IDataContextProvider.js';

export function useDataContext(fallback?: IDataContextProvider): IDataContext {
  const [context] = useState(() => new DataContext());

  useLayoutEffect(() => {
    context.setFallBack(fallback);
  });

  return context;
}
