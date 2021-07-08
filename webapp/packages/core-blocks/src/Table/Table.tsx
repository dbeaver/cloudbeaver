/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState, useCallback, useMemo } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { useObjectRef } from '../useObjectRef';
import { TableContext, ITableContext } from './TableContext';

interface Props {
  selectedItems?: Map<any, boolean>;
  expandedItems?: Map<any, boolean>;
  size?: 'big';
  className?: string;
  onSelect?: (item: any, state: boolean) => void;
}

export const Table: React.FC<Props> = observer(function Table({
  selectedItems, expandedItems, className, size, children, onSelect,
}) {
  const props = useObjectRef({ onSelect });

  const [selected] = useState<Map<any, boolean>>(() => selectedItems || observable(new Map()));
  const [expanded] = useState<Map<any, boolean>>(() => expandedItems || observable(new Map()));
  const setItemSelect = useCallback((item: any, state: boolean) => {
    selected.set(item, state);
    if (props.onSelect) {
      props.onSelect(item, state);
    }
  }, []);
  const setItemExpand = useCallback((item: any, state: boolean) => expanded.set(item, state), []);
  const clearSelection = useCallback(() => selected.clear(), []);
  const collapse = useCallback(() => expanded.clear(), []);
  const isExpanded = useMemo(() => computed(() => Array.from(expanded.values()).some(Boolean)), [expanded]);

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
      <table className={className} {...use({ expanded: isExpanded.get(), size })}>
        {children}
      </table>
    </TableContext.Provider>
  );
});
