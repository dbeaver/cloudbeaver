/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuTrigger } from '@cloudbeaver/core-dialogs';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { useStyles } from '@cloudbeaver/core-theming';
import type { IDatabaseDataModel, IDataPresentationActions, IDataTableActions, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from '../../DataGridContextMenu/DataGridContextMenuService';
import { cellMenuStyles } from './cellMenuStyles';

interface Props {
  model: IDatabaseDataModel<any>;
  actions: IDataTableActions;
  spreadsheetActions: IDataPresentationActions<IResultSetElementKey>;
  resultIndex: number;
  cellKey: IResultSetElementKey;
  onClick?: () => void;
  onStateSwitch?: (state: boolean) => void;
}

export const CellMenu = observer<Props>(function CellMenu({
  model,
  actions,
  spreadsheetActions,
  resultIndex,
  cellKey,
  onClick,
  onStateSwitch,
}) {
  const dataGridContextMenuService = useService(DataGridContextMenuService);
  const style = useStyles(cellMenuStyles);

  const panel = dataGridContextMenuService.constructMenuWithContext(
    model, actions, spreadsheetActions, resultIndex, cellKey
  );

  if (!panel.menuItems.length || panel.menuItems.every(item => item.isHidden)) {
    return null;
  }

  function handleClick() {
    dataGridContextMenuService.openMenu(model, actions, spreadsheetActions, resultIndex, cellKey);
    onClick?.();
  }

  function stopPropagation(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    event.stopPropagation();
  }

  function markStopPropagation(event: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    EventContext.set(event, EventStopPropagationFlag);
  }

  return styled(style)(
    <cell-menu
      as='div'
      onMouseUp={markStopPropagation}
      onDoubleClick={stopPropagation}
    >
      <MenuTrigger
        panel={panel}
        style={[cellMenuStyles]}
        modal
        onClick={handleClick}
        onVisibleSwitch={onStateSwitch}
      >
        <Icon name="snack" viewBox="0 0 16 10" />
      </MenuTrigger>
    </cell-menu>
  );
});
