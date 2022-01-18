/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { DataContext } from './DataContext';
import type { IDataContextProvider } from './IDataContextProvider';

export function useDataContext(fallback?: IDataContextProvider): DataContext {
  const [context] = useState(() => new DataContext());

  context.setFallBack(fallback);

  return context;
}
