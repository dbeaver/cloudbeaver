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
  expandedItems?: Map<any, boolean>;
  onSelect?: (item: any, state: boolean) => void;
  className?: string;
}>

export function Table({
  selectedItems, expandedItems, onSelect, children, className,
}: Props) {
  const [selected] = useState<Map<any, boolean>>(() => selectedItems || observable(new Map()));
  const [expanded] = useState<Map<any, boolean>>(() => expandedItems || observable(new Map()));
  const setItemSelect = useCallback((item: any, state: boolean) => {
    selected.set(item, state);
    if (onSelect) {
      onSelect(item, state);
    }
  }, [onSelect]);
  const setItemExpand = useCallback((item: any, state: boolean) => expanded.set(item, state), []);
  const clearSelection = useCallback(() => selected.clear(), []);
  const collapse = useCallback(() => expanded.clear(), []);

  const [context] = useState<ITableContext>(() => ({
    selectedItems: selected,
    expandedItems: expanded,
    setItemExpand,
    setItemSelect,
    clearSelection,
    collapse,
  }));

  return styled(useStyles())(
    <TableContext.Provider value={context}>
      <table className={className}>
        {children}
      </table>
    </TableContext.Provider>
  );
}
