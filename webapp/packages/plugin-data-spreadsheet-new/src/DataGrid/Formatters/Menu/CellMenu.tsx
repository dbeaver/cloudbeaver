/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled from 'reshadow';

import { Icon } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuTrigger } from '@cloudbeaver/core-dialogs';
import type { IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from '../../DataGridContextMenu/DataGridContextMenuService';
import { cellMenuStyles } from './cellMenuStyles';

interface Props {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  row: number;
  column: number;
  onStateSwitch?: (state: boolean) => void;
}

export const CellMenu: React.FC<Props> = observer(function TreeNodeMenu({
  model,
  resultIndex,
  row,
  column,
  onStateSwitch,
}) {
  const dataGridContextMenuService = useService(DataGridContextMenuService);

  const { panel, hidden } = useMemo(
    () => {
      const panel = dataGridContextMenuService.constructMenuWithContext(model, resultIndex, row, column);
      const hidden = computed(() => !panel.menuItems.length
        || panel.menuItems.every(item => item.isHidden));

      return { panel, hidden };
    },
    [column, row]
  );

  if (hidden.get()) {
    return null;
  }

  return styled(cellMenuStyles)(
    <cell-menu as='div' onClick={e => e.stopPropagation()} onDoubleClick={e => e.stopPropagation()}>
      <MenuTrigger panel={panel} onVisibleSwitch={onStateSwitch}>
        <Icon name="snack" viewBox="0 0 16 10" />
      </MenuTrigger>
    </cell-menu>
  );
});
