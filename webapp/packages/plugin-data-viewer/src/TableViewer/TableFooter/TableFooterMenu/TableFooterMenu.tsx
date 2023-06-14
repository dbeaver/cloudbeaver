/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { MENU_BAR_DEFAULT_STYLES, MENU_BAR_SMALL_STYLES, MenuBar } from '@cloudbeaver/core-ui';
import { IDataContext, useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX';
import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { DATA_CONTEXT_DATA_VIEWER_SIMPLE } from '../../TableHeader/DATA_CONTEXT_DATA_VIEWER_SIMPLE';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from './DATA_VIEWER_DATA_MODEL_ACTIONS_MENU';
import { TableFooterMenuItem } from './TableFooterMenuItem';
import { TableFooterMenuService } from './TableFooterMenuService';

const styles = css`
  menu-wrapper {
    display: flex;
    height: 100%;
  }
`;

const menuStyles = css`
  menu-bar {
    height: 100%;
  }
  menu-bar-item {
    & menu-bar-item-label {
      font-weight: 700;
    }
  }
`;

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, any>;
  simple: boolean;
  context?: IDataContext;
  className?: string;
}

export const TableFooterMenu = observer<Props>(function TableFooterMenu({ resultIndex, model, simple, context, className }) {
  const mainMenuService = useService(TableFooterMenuService);
  const menu = useMenu({ menu: DATA_VIEWER_DATA_MODEL_ACTIONS_MENU, context });

  menu.context.set(DATA_CONTEXT_DV_DDM, model);
  menu.context.set(DATA_CONTEXT_DV_DDM_RESULT_INDEX, resultIndex);
  menu.context.set(DATA_CONTEXT_DATA_VIEWER_SIMPLE, simple);

  return styled(styles)(
    <menu-wrapper className={className}>
      {mainMenuService.constructMenuWithContext(model, resultIndex, simple).map((topItem, i) => (
        <TableFooterMenuItem key={i} menuItem={topItem} />
      ))}
      <MenuBar menu={menu} style={[MENU_BAR_DEFAULT_STYLES, MENU_BAR_SMALL_STYLES, menuStyles]} />
    </menu-wrapper>,
  );
});
