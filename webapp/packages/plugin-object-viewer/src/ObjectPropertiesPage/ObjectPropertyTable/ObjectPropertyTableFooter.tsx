/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { TableState, ToolsPanel } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { ObjectPropertyTableFooterItem } from './ObjectPropertyTableFooterItem';
import { ObjectPropertyTableFooterService } from './ObjectPropertyTableFooterService';

interface Props {
  nodeIds: string[];
  tableState: TableState;
  className?: string;
}

export const ObjectPropertyTableFooter = observer<Props>(function ObjectPropertyTableFooter({ nodeIds, tableState, className }) {
  const service = useService(ObjectPropertyTableFooterService);

  const items = service.constructMenuWithContext(nodeIds, tableState);
  const hidden = items.every(item => item.isHidden);

  if (hidden) {
    return null;
  }

  return (
    <ToolsPanel className={className}>
      {items.map((topItem, i) => (
        <ObjectPropertyTableFooterItem key={i} menuItem={topItem} />
      ))}
    </ToolsPanel>
  );
});
