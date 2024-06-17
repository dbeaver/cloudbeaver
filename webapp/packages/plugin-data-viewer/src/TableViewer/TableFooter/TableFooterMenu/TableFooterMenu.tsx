/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, SContext, StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { type IDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarItemStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX';
import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { DATA_CONTEXT_DATA_VIEWER_SIMPLE } from '../../TableHeader/DATA_CONTEXT_DATA_VIEWER_SIMPLE';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from './DATA_VIEWER_DATA_MODEL_ACTIONS_MENU';
import style from './TableFooterMenu.module.css';
import tableFooterMenuBarItemStyles from './TableFooterMenuBarItemStyles.module.css';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, any>;
  simple: boolean;
  context?: IDataContext;
  className?: string;
}

const registry: StyleRegistry = [[MenuBarItemStyles, { mode: 'append', styles: [tableFooterMenuBarItemStyles] }]];

export const TableFooterMenu = observer<Props>(function TableFooterMenu({ resultIndex, model, simple, context, className }) {
  const styles = useS(style, tableFooterMenuBarItemStyles);
  const menu = useMenu({ menu: DATA_VIEWER_DATA_MODEL_ACTIONS_MENU, context });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_DV_DDM, model, id);
    context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex, id);
    context.set(DATA_CONTEXT_DATA_VIEWER_SIMPLE, simple, id);
  });

  return (
    <div className={s(styles, { wrapper: true, tableFooterMenu: true }, className)}>
      <SContext registry={registry}>
        <MenuBar menu={menu} />
      </SContext>
    </div>
  );
});
