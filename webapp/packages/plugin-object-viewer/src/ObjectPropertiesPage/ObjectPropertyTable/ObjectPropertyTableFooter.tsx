/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { TableState } from '@cloudbeaver/core-blocks';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_OBJECT_VIEWER_NODES } from './DATA_CONTEXT_OBJECT_VIEWER_NODES';
import { DATA_CONTEXT_OBJECT_VIEWER_TABLE_STATE } from './DATA_CONTEXT_OBJECT_VIEWER_TABLE_STATE';
import { MENU_OBJECT_VIEWER_FOOTER_ACTIONS } from './MENU_OBJECT_VIEWER_FOOTER_ACTIONS';

interface Props {
  nodeIds: string[];
  tableState: TableState;
  className?: string;
}

export const ObjectPropertyTableFooter = observer<Props>(function ObjectPropertyTableFooter({ nodeIds, tableState, className }) {
  const menu = useMenu({ menu: MENU_OBJECT_VIEWER_FOOTER_ACTIONS });

  menu.context.set(DATA_CONTEXT_OBJECT_VIEWER_NODES, nodeIds);
  menu.context.set(DATA_CONTEXT_OBJECT_VIEWER_TABLE_STATE, tableState);

  return <MenuBar className={className} menu={menu} />;
});
