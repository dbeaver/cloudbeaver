/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Column } from '../../Column';
import { SelectorFormatter } from './SelectorFormatter';

export const ColumnSelect: Column = {
  key: 'columnSelector',
  columnDataIndex: null,
  name: '',
  width: 40,
  maxWidth: 40,
  frozen: true,
  formatter: SelectorFormatter,
};