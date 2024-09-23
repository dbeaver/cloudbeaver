/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { type IDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';

import { CaptureViewContext } from './CaptureViewContext.js';

export function useCaptureViewContext(capture: (context: IDataContext, id: string) => void): void {
  const context = useContext(CaptureViewContext);
  useDataContextLink(context, capture);
}
