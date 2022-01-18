/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled, { css } from 'reshadow';

import { getComputed, useObjectRef } from '@cloudbeaver/core-blocks';
import type { IDataPresentationActions, IResultSetElementKey, IResultSetRowKey } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { CellContext } from '../CellRenderer/CellContext';
import { DataGridContext } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';
import { CellFormatterFactory } from './CellFormatterFactory';
import { CellMenu } from './Menu/CellMenu';

interface Props extends FormatterProps<IResultSetRowKey> {
  className?: string;
}

const styles = css`
  formatter-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }
  formatter-container {
    flex: 1;
    overflow: hidden;
  }
`;

export const CellFormatter = observer<Props>(function CellFormatter({ className, ...rest }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const editingContext = useContext(EditingContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const isEditing = cellContext.isEditing;
  const showCellMenu = getComputed(() => !isEditing && (
    rest.isCellSelected
    || cellContext?.mouse.state.mouseEnter
    || menuVisible
  ));

  const spreadsheetActions = useObjectRef<IDataPresentationActions<IResultSetElementKey>>({
    edit(position) {
      const idx = tableDataContext.getColumnIndexFromColumnKey(position.column);
      const rowIdx = tableDataContext.getRowIndexFromKey(position.row);

      if (idx !== -1) {
        editingContext.edit({ idx, rowIdx });
      }
    },
  });

  return styled(styles)(
    <formatter-wrapper className={className}>
      <formatter-container>
        <CellFormatterFactory {...rest} isEditing={isEditing} />
      </formatter-container>
      {showCellMenu && cellContext.cell && (
        <menu-container>
          <CellMenu
            cellKey={cellContext.cell}
            model={context.model}
            actions={context.actions}
            spreadsheetActions={spreadsheetActions}
            resultIndex={context.resultIndex}
            onStateSwitch={setMenuVisible}
          />
        </menu-container>
      )}
    </formatter-wrapper>
  );
});
