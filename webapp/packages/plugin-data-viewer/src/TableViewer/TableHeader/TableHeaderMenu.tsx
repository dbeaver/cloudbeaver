/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type PlaceholderComponent, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import { DATA_CONTEXT_DV_SIMPLE } from '../DATA_CONTEXT_DV_SIMPLE.js';
import { DATA_VIEWER_DATA_MODEL_TOOLS_MENU } from './DATA_VIEWER_DATA_MODEL_TOOLS_MENU.js';
import type { ITableHeaderPlaceholderProps } from './TableHeaderService.js';

export const TableHeaderMenu: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function TableHeaderMenu({ model, simple, resultIndex }) {
  const menu = useMenu({ menu: DATA_VIEWER_DATA_MODEL_TOOLS_MENU });
  const menuBarStyles = useS(MenuBarStyles, MenuBarItemStyles);

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DV_DDM, model, id);
    context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex, id);
    context.set(DATA_CONTEXT_DV_SIMPLE, simple, id);
  });

  return <MenuBar className={menuBarStyles['floating']} menu={menu} />;
});
