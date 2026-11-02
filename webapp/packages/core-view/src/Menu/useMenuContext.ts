/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useMemo } from 'react';

import type { IDataContext } from '@cloudbeaver/core-data-context';

import { CaptureViewContext } from '../View/CaptureViewContext.js';
import type { IMenu } from './IMenu.js';
import { createMenuContext } from './MenuModel.js';

export function useMenuContext(menu: IMenu, menuContext?: IDataContext): IDataContext {
  const viewContext = useContext(CaptureViewContext);
  const parent = menuContext ?? viewContext;
  return useMemo(() => createMenuContext(menu, parent), [menu, parent]);
}
