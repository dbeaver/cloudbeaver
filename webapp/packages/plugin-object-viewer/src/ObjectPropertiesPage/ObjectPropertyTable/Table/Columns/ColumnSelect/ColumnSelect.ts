/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICustomColumn } from '../../Column';
import { SelectorFormatter } from './SelectorFormatter';

export const ColumnSelect: ICustomColumn = {
  key: 'columnSelector',
  columnDataIndex: null,
  name: '',
  width: 32,
  maxWidth: 32,
  minWidth: 32,
  frozen: true,
  formatter: SelectorFormatter,
  order: 0,
};
