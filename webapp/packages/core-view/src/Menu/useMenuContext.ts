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
import { CaptureViewContext } from '../View/CaptureViewContext';
import { DATA_CONTEXT_MENU } from './DATA_CONTEXT_MENU';
import type { IMenu } from './IMenu';

export function useMenuContext(menu: IMenu, _menuContext?: IDataContext): IDataContext {
  const viewContext = useContext(CaptureViewContext);
  const context = useDataContext(_menuContext || viewContext);

  context.set(DATA_CONTEXT_MENU, menu);

  return context;
}
