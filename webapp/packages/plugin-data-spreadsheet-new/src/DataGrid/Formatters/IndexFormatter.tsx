/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import type { RenderCellProps } from '@cloudbeaver/plugin-data-grid';
import type { IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { CellContext } from '../CellRenderer/CellContext.js';

export const IndexFormatter: React.FC<RenderCellProps<IResultSetRowKey>> = observer(function IndexFormatter(props) {
  const context = useContext(CellContext);

  return <div>{context.position.rowIdx + 1}</div>;
});
