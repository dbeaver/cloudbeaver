/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useState, useCallback } from 'react';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { TableContext, ITableContext } from './TableContext';

type Props = React.PropsWithChildren<{
  selectedItems?: Map<any, boolean>;
  className?: string;
}>

export function Table({ selectedItems, children, className }: Props) {
  const [selected] = useState<Map<any, boolean>>(() => selectedItems || observable(new Map()));
  const setItemSelect = useCallback((item: any, state: boolean) => selected.set(item, state), []);
  const clearSelection = useCallback(() => selected.clear(), []);

  const [context] = useState<ITableContext>(() => ({
    selectedItems: selected,
    setItemSelect,
    clearSelection,
  }));

  return styled(useStyles())(
    <TableContext.Provider value={context}>
      <table className={className}>
        {children}
      </table>
    </TableContext.Provider>
  );
}
