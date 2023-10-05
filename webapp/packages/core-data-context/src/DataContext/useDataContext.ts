/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import type { IDataContext } from './IDataContext';
import type { IDataContextProvider } from './IDataContextProvider';
import { TempDataContext } from './TempDataContext';

export function useDataContext(fallback?: IDataContextProvider): IDataContext {
  const [context] = useState(() => new TempDataContext());

  context.setFallBack(fallback);

  return context;
}
