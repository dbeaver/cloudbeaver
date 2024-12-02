/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useState } from 'react';

import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useObservableRef } from '../useObservableRef.js';
import { useS } from '../useS.js';
import style from './Table.module.css';
import { type ITableContext, type ITableState, TableContext } from './TableContext.js';

interface Props {
  keys?: any[];
  selectedItems?: Map<any, boolean>;
  expandedItems?: Map<any, boolean>;
  size?: 'big';
  className?: string;
  onSelect?: (item: any, state: boolean) => void;
  isItemSelectable?: (item: any) => boolean;
}

export const Table = observer<React.PropsWithChildren<Props>>(function Table({
  keys,
  isItemSelectable,
  selectedItems,
  expandedItems,
  className,
  size,
  children,
  onSelect,
}) {
  const props = useObjectRef({ onSelect });
  const styles = useS(style);

  const [selected] = useState<Map<any, boolean>>(() => selectedItems || observable(new Map()));
  const [expanded] = useState<Map<any, boolean>>(() => expandedItems || observable(new Map()));

  useEffect(
    action(() => {
      if (!keys) {
        return;
      }

      const removeSelected = Array.from(selected.keys()).filter(key => !keys.includes(key));
      const removeExpanded = Array.from(expanded.keys()).filter(key => !keys.includes(key));

      for (const id of removeSelected) {
        selected.delete(id);
      }

      for (const id of removeExpanded) {
        expanded.delete(id);
      }
    }),
    [keys],
  );

  const state: ITableState = useObservableRef(
    () => ({
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
    }),
    {
      keys: observable.ref,
      isItemSelectable: observable.ref,
      selectableItems: computed,
      tableSelected: computed,
      selectTable: action.bound,
    },
    { keys, isItemSelectable },
  );

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

  return (
    <TableContext.Provider value={context}>
      <table className={s(styles, { table: true, big: size === 'big' }, className)}>{children}</table>
    </TableContext.Provider>
  );
});
