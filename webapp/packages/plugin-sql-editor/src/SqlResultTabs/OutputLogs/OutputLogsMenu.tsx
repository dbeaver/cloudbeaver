/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { MenuBar, MenuBarGroupStyles, MenuBarItemStyles } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_SQL_EDITOR_STATE } from '../../DATA_CONTEXT_SQL_EDITOR_STATE.js';
import type { ISqlEditorTabState } from '../../ISqlEditorTabState.js';
import { OUTPUT_LOGS_MENU } from './OUTPUT_LOGS_MENU.js';
import styles from './OutputLogsMenu.module.css';

interface Props {
  sqlEditorTabState: ISqlEditorTabState;
}

export const OutputLogsMenu = observer<Props>(function OutputLogsMenu({ sqlEditorTabState }) {
  const style = useS(styles, MenuBarItemStyles, MenuBarGroupStyles);
  const menu = useMenu({
    menu: OUTPUT_LOGS_MENU,
  });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_SQL_EDITOR_STATE, sqlEditorTabState, id);
  });

  return <MenuBar menu={menu} className={s(style, { menuBar: true, floating: true })} />;
});
