/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { PlaceholderComponent, useS } from '@cloudbeaver/core-blocks';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX';
import { DATA_CONTEXT_DATA_VIEWER_SIMPLE } from './DATA_CONTEXT_DATA_VIEWER_SIMPLE';
import { DATA_VIEWER_DATA_MODEL_TOOLS_MENU } from './DATA_VIEWER_DATA_MODEL_TOOLS_MENU';
import type { ITableHeaderPlaceholderProps } from './TableHeaderService';

export const TableHeaderMenu: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function TableHeaderMenu({ model, simple, resultIndex }) {
  const menu = useMenu({ menu: DATA_VIEWER_DATA_MODEL_TOOLS_MENU });
  const menuBarStyles = useS(MenuBarStyles, MenuBarItemStyles);

  menu.context.set(DATA_CONTEXT_DV_DDM, model);
  menu.context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex);
  menu.context.set(DATA_CONTEXT_DATA_VIEWER_SIMPLE, simple);

  return <MenuBar className={menuBarStyles.floating} menu={menu} />;
});
