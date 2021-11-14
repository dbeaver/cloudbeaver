/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import type { IDataContext } from '../DataContext/IDataContext';
import { useDynamicDataContext } from '../DataContext/useDynamicDataContext';
import { CaptureViewContext } from './CaptureViewContext';

export function useCaptureViewContext(): IDataContext | undefined {
  const context = useContext(CaptureViewContext);
  const dynamic = useDynamicDataContext(context);

  if (context === undefined) {
    return undefined;
  }

  return dynamic;
}
