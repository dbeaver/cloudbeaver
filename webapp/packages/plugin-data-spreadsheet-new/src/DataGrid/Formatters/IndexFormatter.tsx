/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import type { IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';
import type { FormatterProps } from '@cloudbeaver/plugin-react-data-grid';


import { CellContext } from '../CellRenderer/CellContext';

export const IndexFormatter: React.FC<FormatterProps<IResultSetRowKey>> = function IndexFormatter(props) {
  const context = useContext(CellContext);

  return <div>{context.position.rowIdx + 1}</div>;
};
