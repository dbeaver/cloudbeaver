/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { type IDataContext, useDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';

import { DATA_CONTEXT_LOADABLE_STATE, loadableStateContext } from '../LoadableStateContext/DATA_CONTEXT_LOADABLE_STATE.js';
import { CaptureViewContext } from '../View/CaptureViewContext.js';
import { DATA_CONTEXT_MENU } from './DATA_CONTEXT_MENU.js';
import type { IMenu } from './IMenu.js';

export function useMenuContext(menu: IMenu, _menuContext?: IDataContext): IDataContext {
  const viewContext = useContext(CaptureViewContext);
  const context = useDataContext(_menuContext || viewContext);
  const hasLoadableState = context.hasOwn(DATA_CONTEXT_LOADABLE_STATE);

  useDataContextLink(context, (context, id) => {
    context.set(DATA_CONTEXT_MENU, menu, id);

    if (!hasLoadableState) {
      context.set(DATA_CONTEXT_LOADABLE_STATE, loadableStateContext(), id);
    }
  });

  return context;
}
