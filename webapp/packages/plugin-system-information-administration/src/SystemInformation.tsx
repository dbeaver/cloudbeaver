/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { AdministrationItemContentProps } from '@cloudbeaver/core-administration';
import { ColoredContainer, Group } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { type Column, DataGrid } from '@cloudbeaver/plugin-data-grid';
import { HeaderCell } from './SystemInformationTable/HeaderCell.js';

const COLUMNS: Column<string>[] = [
  {
    key: 'name',
    name: 'Product name',
    resizable: true,
    renderCell: props => <div>{props.row}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
  {
    key: 'storage',
    name: 'Storage',
    resizable: true,
    renderCell: props => <div>{props.row}</div>,
    renderHeaderCell: props => <HeaderCell {...props} />,
  },
];

export const SystemInformation: TabContainerPanelComponent<AdministrationItemContentProps> = observer(function SystemInformation() {
  return (
    <ColoredContainer wrap gap overflow parent>
      <Group overflow>
        <DataGrid
          rows={['Product name', 'Storage']}
          rowKeyGetter={
            // @ts-ignore
            row => row.id
          }
          columns={COLUMNS}
          rowHeight={30}
        />
      </Group>
    </ColoredContainer>
  );
});
