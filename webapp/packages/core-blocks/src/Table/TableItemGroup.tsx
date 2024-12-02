/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { TableItemGroupContext } from './TableItemGroupContext.js';

export interface TableItemGroupProps extends React.PropsWithChildren {
  expanded?: boolean;
}

export const TableItemGroup = observer<TableItemGroupProps>(function TableItemGroup({ expanded = true, children }) {
  const [internalExpanded, setExpanded] = useState(expanded);

  return <TableItemGroupContext.Provider value={{ expanded: internalExpanded, setExpanded }}>{children}</TableItemGroupContext.Provider>;
});
