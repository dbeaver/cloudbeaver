/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type PropsWithChildren, useContext } from 'react';

import { useDataContext } from '@cloudbeaver/core-data-context';

import { CaptureViewContext } from './CaptureViewContext.js';

export const CaptureViewScope = observer<PropsWithChildren>(function CaptureViewScope({ children }) {
  const context = useContext(CaptureViewContext);
  const viewContext = useDataContext(context);

  return <CaptureViewContext.Provider value={viewContext}>{children}</CaptureViewContext.Provider>;
});
