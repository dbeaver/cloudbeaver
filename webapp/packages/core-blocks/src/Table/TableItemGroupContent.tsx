/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { TableItemGroupContext } from './TableItemGroupContext.js';

export interface TableItemGroupContentProps {
  children?: React.ReactNode | (() => React.ReactNode);
}

export const TableItemGroupContent = observer<TableItemGroupContentProps>(function TableItemGroupContent({ children }) {
  const context = useContext(TableItemGroupContext);

  if (!context) {
    throw new Error('TableItemGroupContent can be used only inside TableItemGroup');
  }

  if (!context.expanded) {
    return null;
  }

  return <>{typeof children === 'function' ? children() : children}</>;
});
