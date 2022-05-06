/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import type { IDataContext } from '../DataContext/IDataContext';
import { useDataContext } from '../DataContext/useDataContext';
import { CaptureViewContext } from './CaptureViewContext';
import { DATA_CONTEXT_VIEW } from './DATA_CONTEXT_VIEW';
import type { IView } from './IView';

export function useViewContext(view: IView<any>, parentContext: IDataContext | undefined): IDataContext {
  const context = useContext(CaptureViewContext);
  const viewContext = useDataContext(parentContext ?? context);

  viewContext.set(DATA_CONTEXT_VIEW, view);

  return viewContext;
}
