/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';

import { s } from '@cloudbeaver/core-blocks';
import { MenuBar, MenuBarItemStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../../DATA_CONTEXT_SQL_EDITOR_STATE';
import type { ISqlEditorTabState } from '../../ISqlEditorTabState';
import { OUTPUT_LOGS_MENU } from './OUTPUT_LOGS_MENU';
import styles from './OutputLogsMenu.m.css';

interface Props {
  sqlEditorTabState: ISqlEditorTabState;
}

export const OutputLogsMenu = observer<Props>(function OutputLogsMenu({ sqlEditorTabState }) {
  const menu = useMenu({
    menu: OUTPUT_LOGS_MENU,
  });

  useEffect(() => {
    menu.context.set(DATA_CONTEXT_SQL_EDITOR_STATE, sqlEditorTabState);
  }, []);

  return (
    <MenuBar
      menu={menu}
      nestedMenuSettings={{ modal: true, placement: 'top-start' }}
      className={s(styles, { menuBar: true }, MenuBarItemStyles.floating)}
    />
  );
});
