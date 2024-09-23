/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ICustomColumn } from '../../Column.js';
import { IconFormatter } from './IconFormatter.js';

export const ColumnIcon: ICustomColumn = {
  key: 'columnIcon',
  name: '',
  width: 40,
  maxWidth: 40,
  minWidth: 40,
  frozen: true,
  renderCell: props => <IconFormatter {...props} />,
  order: 1,
};
