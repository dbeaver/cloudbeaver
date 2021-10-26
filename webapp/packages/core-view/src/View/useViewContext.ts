/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useMemo, useState } from 'react';

import { Context } from '../Context/Context';
import type { IContext } from '../Context/IContext';
import type { IView } from './IView';
import type { IViewContext } from './IViewContext';

export function useViewContext(view: IView<any>): [IViewContext, IContext] {
  const [context] = useState<IContext>(() => new Context());
  const viewContext = useMemo(() => ({ view, context }), [view]);

  return [viewContext, context];
}
