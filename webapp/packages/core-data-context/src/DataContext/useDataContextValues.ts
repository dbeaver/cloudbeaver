/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun } from 'mobx';
import { useId, useLayoutEffect } from 'react';

import type { DataContextGetter } from './DataContextGetter.js';
import type { IDataContext } from './IDataContext.js';

/** Declarative contributions replace omitted keys; imperative links keep their existing lifecycle. */
export function useDataContextValues(context: IDataContext, values: () => ReadonlyArray<readonly [DataContextGetter<any>, unknown]>): void {
  const id = useId();

  useLayoutEffect(() => autorun(() => context.replaceForId(id, values())));
  useLayoutEffect(
    () => () => {
      context.deleteForId(id);
    },
    [context, id],
  );
}
