/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autorun } from 'mobx';
import { useLayoutEffect, useState } from 'react';

import { uuid } from '@cloudbeaver/core-utils';

import type { IDataContext } from './IDataContext.js';

export function useDataContextLink(context: IDataContext | undefined, update: (context: IDataContext, id: string) => void): void {
  const [id] = useState(() => uuid());

  useLayoutEffect(() =>
    autorun(() => {
      if (context) {
        update(context, id);
      }
    }),
  );

  useLayoutEffect(
    () => () => {
      context?.deleteForId(id);
    },
    [context, id],
  );
}
