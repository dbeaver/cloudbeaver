/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext, useMemo, useState } from 'react';

import { Context } from '../Context/Context';
import type { IContext } from '../Context/IContext';
import { CaptureViewContext } from '../View/CaptureViewContext';
import type { IMenu } from './IMenu';
import type { IMenuContext } from './IMenuContext';

export function useMenuContext(menu: IMenu): [IMenuContext, IContext] {
  const viewContext = useContext(CaptureViewContext);
  const [menuContext] = useState<IContext>(() => new Context());

  const context = useMemo<IMenuContext>(() => ({
    menu,
    menuContext,
    viewContext: viewContext.viewContext,
  }), [viewContext, menu]);

  return [context, menuContext];
}
