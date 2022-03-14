/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState, useCallback, useMemo } from 'react';
import styled, { use } from 'reshadow';

import { useObjectRef } from '../useObjectRef';
import { useObservableRef } from '../useObservableRef';
import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';
import { TableContext, ITableContext, ITableState } from './TableContext';

interface Props {
  keys?: any[];
  selectedItems?: Map<any, boolean>;
  expandedItems?: Map<any, boolean>;
  size?: 'big';
  className?: string;
  onSelect?: (item: any, state: boolean) => void;
  isItemSelectable?: (item: any) => boolean;
}

export const Table = observer<Props>(function Table({
  keys, isItemSelectable, selectedItems, expandedItems, className, size, children, onSelect,
}) {
  const props = useObjectRef({ onSelect });

  const [selected] = useState<Map<any, boolean>>(() => selectedItems || observable(new Map()));
  const [expanded] = useState<Map<any, boolean>>(() => expandedItems || observable(new Map()));

  const state: ITableState = useObservableRef(() => ({
    get selectableItems() {
      if (!this.keys) {
        return [];
      }

      if (!this.isItemSelectable) {
        return this.keys;
      }

      return this.keys.filter(this.isItemSelectable);
    },
    get tableSelected() {
      return this.selectableItems.length > 0 && this.selectableItems.every(item => selected.get(item));
    },
    selectTable() {
      const tableSelected = this.tableSelected;
      for (const item of this.selectableItems) {
        selected.set(item, !tableSelected);
      }
    },

  }), {
    keys: observable.ref,
    isItemSelectable: observable.ref,
    selectableItems: computed,
    tableSelected: computed,
    selectTable: action.bound,
  }, { keys, isItemSelectable });

  const isExpanded = useMemo(() => computed(() => Array.from(expanded.values()).some(Boolean)), [expanded]);

  const setItemSelect = useCallback((item: any, state: boolean) => {
    selected.set(item, state);
    if (props.onSelect) {
      props.onSelect(item, state);
    }
  }, []);
  const setItemExpand = useCallback((item: any, state: boolean) => expanded.set(item, state), []);
  const clearSelection = useCallback(() => selected.clear(), []);
  const collapse = useCallback(() => expanded.clear(), []);

  const [context] = useState<ITableContext>(() => ({
    state,
    selectedItems: selected,
    expandedItems: expanded,
    setItemExpand,
    setItemSelect,
    clearSelection,
    collapse,
  }));

  return styled(BASE_TABLE_STYLES)(
    <TableContext.Provider value={context}>
      <table className={className} {...use({ expanded: isExpanded.get(), size })}>
        {children}
      </table>
    </TableContext.Provider>
  );
});
