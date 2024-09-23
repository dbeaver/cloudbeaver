/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { type IDataContext, useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';

import { CaptureViewContext } from './CaptureViewContext.js';
import { DATA_CONTEXT_VIEW } from './DATA_CONTEXT_VIEW.js';
import type { IView } from './IView.js';

export function useViewContext(view: IView<any>, parentContext: IDataContext | undefined): IDataContext {
  const context = useContext(CaptureViewContext);
  const viewContext = useDataContext(parentContext ?? context);

  useDataContextLink(viewContext, (context, id) => {
    context.set(DATA_CONTEXT_VIEW, view, id);
  });

  return viewContext;
}
