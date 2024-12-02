/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import { TableState } from './TableState.js';

export function useTable<K = string>(): TableState<K> {
  const [table] = useState(() => new TableState<K>());
  return table;
}
