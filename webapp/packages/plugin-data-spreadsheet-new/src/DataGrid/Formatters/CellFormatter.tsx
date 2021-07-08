/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';
import type { FormatterProps } from 'react-data-grid';
import styled, { css } from 'reshadow';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import type { IDataPresentationActions, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import { EditingContext } from '../../Editing/EditingContext';
import { CellContext } from '../CellRenderer/CellContext';
import { DataGridContext } from '../DataGridContext';
import { TableDataContext } from '../TableDataContext';
import { CellFormatterFactory } from './CellFormatterFactory';
import { CellMenu } from './Menu/CellMenu';

interface Props extends FormatterProps {
  className?: string;
}

const styles = css`
  formatter-wrapper {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  formatter-container {
    flex: 1;
    overflow: hidden;
  }
`;

export const CellFormatter: React.FC<Props> = observer(function CellFormatter({ className, ...rest }) {
  const context = useContext(DataGridContext);
  const tableDataContext = useContext(TableDataContext);
  const cellContext = useContext(CellContext);
  const editingContext = useContext(EditingContext);
  const [menuVisible, setMenuVisible] = useState(false);
  const isEditing = editingContext?.isEditing({ idx: rest.column.idx, rowIdx: rest.rowIdx }) ?? false;
  const showCellMenu = !isEditing
    && (rest.isCellSelected || cellContext?.mouse.state.mouseEnter || menuVisible);

  const spreadsheetActions = useObjectRef<IDataPresentationActions<IResultSetElementKey>>({
    edit(position) {
      if (position.column === undefined || position.row === undefined) {
        return;
      }

      const idx = tableDataContext?.getColumnIndexFromKey(position.column);

      if (idx !== undefined && idx !== null) {
        editingContext?.edit({ idx, rowIdx: position.row });
      }
    },
  });

  return styled(styles)(
    <formatter-wrapper className={className}>
      <formatter-container>
        <CellFormatterFactory {...rest} isEditing={isEditing} />
      </formatter-container>
      {showCellMenu && context && (
        <menu-container>
          <CellMenu
            model={context.model}
            actions={context.actions}
            spreadsheetActions={spreadsheetActions}
            resultIndex={context.resultIndex}
            row={rest.rowIdx}
            column={Number(rest.column.key)}
            onStateSwitch={setMenuVisible}
          />
        </menu-container>
      )}
    </formatter-wrapper>
  );
});
