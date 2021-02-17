/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useRef } from 'react';

import type { IConnectionFormData } from './ConnectionFormService';

export function useConnectionData(data: IConnectionFormData, fill: (data: IConnectionFormData) => void): void {
  const firstRenderRef = useRef(true);

  if (firstRenderRef.current) {
    fill(data);
    firstRenderRef.current = false;
  }
}
