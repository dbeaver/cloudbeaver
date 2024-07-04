/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, CRegistry, s, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles, MenuBarStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX';
import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { DATA_CONTEXT_DATA_VIEWER_SIMPLE } from '../../TableHeader/DATA_CONTEXT_DATA_VIEWER_SIMPLE';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from './DATA_VIEWER_DATA_MODEL_ACTIONS_MENU';
import { REFRESH_MENU_ITEM_REGISTRY } from './RefreshAction/RefreshMenuAction';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, any>;
  simple: boolean;
  className?: string;
}

export const TableFooterMenu = observer<Props>(function TableFooterMenu({ resultIndex, model, simple, className }) {
  const styles = useS(MenuBarStyles, MenuBarItemStyles);
  const menu = useMenu({ menu: DATA_VIEWER_DATA_MODEL_ACTIONS_MENU });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DV_DDM, model, id);
    context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex, id);
    context.set(DATA_CONTEXT_DATA_VIEWER_SIMPLE, simple, id);
  });

  return (
    <CRegistry registry={REFRESH_MENU_ITEM_REGISTRY}>
      <MenuBar menu={menu} className={s(styles, { floating: true, withLabel: true }, className)} />
    </CRegistry>
  );
});
