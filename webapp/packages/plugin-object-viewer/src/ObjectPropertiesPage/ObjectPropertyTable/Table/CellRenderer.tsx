/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { CellRendererProps, Cell } from 'react-data-grid';

import type { DBObject } from '@cloudbeaver/core-app';

export const CellRenderer = observer<CellRendererProps<DBObject>>(function CellRenderer(props) {
  return (
    <Cell {...props} />
  );
});