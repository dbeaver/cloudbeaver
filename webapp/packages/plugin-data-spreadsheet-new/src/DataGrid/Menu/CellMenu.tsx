/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useEffect } from 'react';

import { MenuItemElementStyles, s, SContext, type StyleRegistry, useObjectRef, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_ACTIONS,
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION_ACTIONS,
  DATA_CONTEXT_DV_RESULT_KEY,
  DATA_CONTEXT_DV_SIMPLE,
  type IDataPresentationActions,
  type IGridDataKey,
  MENU_DV_CONTEXT_MENU,
} from '@cloudbeaver/plugin-data-viewer';

import { TableMenuContext } from '../CellRenderer/TableMenuContext.js';
import { DataGridContext } from '../DataGridContext.js';
import { TableDataContext } from '../TableDataContext.js';
import classes from './CellMenu.module.css';

interface Props {
  onClose: () => void;
}

const registry: StyleRegistry = [
  [
    MenuItemElementStyles,
    {
      mode: 'append',
      styles: [classes],
    },
  ],
];

export const CellMenu = observer<Props>(function CellMenu({ onClose }) {
  const style = useS(classes);
  const dataGridContext = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const tableMenuContext = useContext(TableMenuContext);
  const menu = useMenu({ menu: MENU_DV_CONTEXT_MENU });

  const { activeCellKey, menuPosition } = tableMenuContext;

  useEffect(() => {
    if (!activeCellKey) {
      return;
    }

    const container = dataGridContext.getContainer();

    if (!container) {
      return;
    }

    function handleScroll() {
      tableMenuContext.closeMenu();
    }

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeCellKey, dataGridContext, tableMenuContext]);

  const spreadsheetActions = useObjectRef<IDataPresentationActions<IGridDataKey>>({
    edit(position) {
      const colIdx = tableDataContext.getColumnIndexFromColumnKey(position.column);
      const rowIdx = tableDataContext.getRowIndexFromKey(position.row);
      if (colIdx !== -1) {
        dataGridContext.getDataGridApi()?.openEditor({ colIdx, rowIdx });
      }
    },
    unpinColumns(keys) {
      tableDataContext.view.unpinColumns(keys.map(key => key.column));
    },
    pinColumns(keys) {
      tableDataContext.view.pinColumns(keys.map(key => key.column));
    },
    isColumnPinned(key) {
      return tableDataContext.view.isColumnPinned(key.column);
    },
    unpinAllColumns() {
      tableDataContext.view.unpinAllColumns();
    },
    hasPinnedColumns() {
      return tableDataContext.view.hasPinnedColumns();
    },
  });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DV_DDM, dataGridContext.model, id);
    context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, dataGridContext.resultIndex, id);
    context.set(DATA_CONTEXT_DV_SIMPLE, dataGridContext.simple, id);
    context.set(DATA_CONTEXT_DV_ACTIONS, dataGridContext.actions, id);
    context.set(DATA_CONTEXT_DV_PRESENTATION_ACTIONS, spreadsheetActions, id);
    context.set(DATA_CONTEXT_DV_RESULT_KEY, activeCellKey, id);
  });

  function handleStateSwitch(visible: boolean) {
    if (!visible) {
      tableMenuContext.closeMenu();
      onClose();
    }
  }

  if (!activeCellKey) {
    return null;
  }

  return (
    <SContext registry={registry}>
      <ContextMenu
        className={s(style, { contextMenu: true })}
        menu={menu}
        contextMenuPosition={menuPosition}
        visible={!!menuPosition.position}
        autoFocusOnShow
        onVisibleSwitch={handleStateSwitch}
      />
    </SContext>
  );
});
