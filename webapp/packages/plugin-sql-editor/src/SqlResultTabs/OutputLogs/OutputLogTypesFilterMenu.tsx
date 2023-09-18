/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, s, useS } from '@cloudbeaver/core-blocks';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { OUTPUT_LOGS_FILTER_MENU } from './OUTPUT_LOGS_FILTER_MENU';
import style from './OutputLogTypesFilterMenu.m.css';
import type { SqlOutputLogsPanelState } from './useOutputLogsPanelState';

interface Props {
  state: SqlOutputLogsPanelState;
}

export const OutputLogsFilterMenu = observer<Props>(function OutputLogTypesFilterMenu({ state }) {
  const styles = useS(style);
  const menu = useMenu({
    menu: OUTPUT_LOGS_FILTER_MENU,
  });

  return (
    <ContextMenu className={s(styles, { contextMenu: true })} menu={menu} placement="bottom-end" modal>
      <Icon className={s(styles, { icon: true })} name="filter" viewBox="0 0 16 16" />
    </ContextMenu>
  );
});
